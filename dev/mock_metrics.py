"""Synthetic IF-MIB exporter and VictoriaMetrics history generator (stdlib only)."""
import argparse
import json
import math
import random
import hashlib
from functools import lru_cache
from itertools import accumulate
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    "ifOperStatus": ("gauge", "Synthetic IF-MIB operational status."),
    "ifHighSpeed": ("gauge", "Synthetic interface capacity in millions of bits per second."),
    "ifHCInOctets": ("counter", "Synthetic cumulative incoming octets."),
    "ifHCOutOctets": ("counter", "Synthetic cumulative outgoing octets."),
    "ifMetadata": ("gauge", "Synthetic metadata carrier; textual IF-MIB fields are labels."),
}
# Documentation addresses only. Cases share two routers to exercise identity isolation.
CASES = [
    ("192.0.2.10", "mock-core", "GigabitEthernet0/0", "up", 1000),
    ("192.0.2.10", "mock-core", "Tunnel10", "up", 100),
    ("192.0.2.10", "mock-core", "Tunnel20", "down", 100),
    ("192.0.2.10", "mock-core", "Tunnel30", "missing_status", 50),
    ("192.0.2.20", "mock-branch", "Tunnel10", "zero", 10),
    ("192.0.2.20", "mock-branch", "Tunnel40", "reset", 100),
    ("192.0.2.20", "mock-branch", "Tunnel50", "gap", 100),
    ("192.0.2.20", "mock-branch", "Tunnel60", "missing_out", 100),
    ("192.0.2.20", "mock-branch", "Tunnel70", "missing_capacity", 100),
    ("192.0.2.20", "mock-branch", "Tunnel80", "unknown", 100),
]


def labels(case):
    instance, name, interface, scenario, _ = case
    return dict(instance=instance, name=name, ifName=interface,
                ifAlias=f"Mock {scenario} channel", ifDescr=f"Synthetic {interface}",
                ifIndex=str(CASES.index(case) + 1), mock="true", scenario=scenario,
                job="cisco-mock")


PROFILE_MINUTES = 7 * 24 * 60


@lru_cache(maxsize=32)
def rate_profile(case, outgoing=False):
    """Seeded week-long minute profile: irregular loads, quiet periods and bursts."""
    if case[3] == "zero":
        return (0,) * PROFILE_MINUTES
    seed = hashlib.sha256((repr(case) + str(outgoing)).encode()).digest()
    rng = random.Random(int.from_bytes(seed[:8], "big"))
    capacity = case[4] * 1_000_000
    profile = []
    while len(profile) < PROFILE_MINUTES:
        level = rng.uniform(0.015, 0.16 if outgoing else 0.35)
        if rng.random() < 0.18:
            level *= 0.08
        for _ in range(rng.randint(3, 45)):
            load = level * rng.uniform(0.55, 1.45)
            if rng.random() < 0.055:
                load += rng.uniform(0.12, 0.5)
            # Even integer bit/s gives exact octets for whole-minute integration.
            profile.append(int(min(0.92, load) * capacity / 2) * 2)
            if len(profile) == PROFILE_MINUTES:
                break
    return tuple(profile)


@lru_cache(maxsize=32)
def cumulative_profile(case, outgoing=False):
    return tuple(accumulate(rate_profile(case, outgoing), initial=0))


def integrated_octets(case, start, end, outgoing=False):
    """Counter integral independent of scrape count, including week boundaries."""
    profile = rate_profile(case, outgoing)
    prefix = cumulative_profile(case, outgoing)
    def primitive(t):
        minute = math.floor(t / 60)
        cycles, index = divmod(minute, PROFILE_MINUTES)
        return (cycles * prefix[-1] + prefix[index]) * 60 + profile[index] * (t - minute * 60)
    return max(0, int((primitive(end) - primitive(start)) / 8))


def samples(timestamp, anchor):
    for case in CASES:
        scenario = case[3]
        # One historical collection gap. The interface keeps transferring traffic.
        if scenario == "gap" and anchor - 2700 <= timestamp < anchor - 1800:
            continue
        values = {"ifMetadata": 1, "ifHighSpeed": case[4],
                  "ifOperStatus": 4 if scenario == "unknown" else 1}
        stop = anchor - 1800
        if scenario == "down" and timestamp >= stop:
            values["ifOperStatus"] = 2
        if scenario == "missing_status" and timestamp >= anchor - 600:
            values.pop("ifOperStatus")
        if scenario == "missing_capacity":
            values.pop("ifHighSpeed")
        start = anchor - 7 * 86400
        if scenario == "reset" and timestamp >= anchor - 1200:
            start = anchor - 1200
        end = min(timestamp, stop) if scenario == "down" else timestamp
        values["ifHCInOctets"] = integrated_octets(case, start, end)
        if scenario != "missing_out":
            values["ifHCOutOctets"] = integrated_octets(case, start, end, True)
        for metric, value in values.items():
            yield metric, labels(case), value


def escape(value):
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def exposition(timestamp, anchor):
    lines = []
    for name, (kind, help_text) in FIELDS.items():
        lines.extend([f"# HELP {name} {help_text}", f"# TYPE {name} {kind}"])
        for metric, tags, value in samples(timestamp, anchor):
            if metric == name:
                selector = ",".join(f'{key}="{escape(value)}"' for key, value in tags.items())
                lines.append(f"{metric}{{{selector}}} {value}")
    return "\n".join(lines) + "\n"


def history(path, hours, end, anchor):
    """JSONL import records with millisecond timestamps, sampled every 60 seconds."""
    series = {}
    end = int(end // 60) * 60
    for timestamp in range(end - hours * 3600, end + 1, 60):
        for metric, tags, value in samples(timestamp, anchor):
            key = (metric, tuple(tags.items()))
            record = series.setdefault(key, {"metric": {"__name__": metric, **tags},
                                             "values": [], "timestamps": []})
            record["values"].append(value)
            record["timestamps"].append(timestamp * 1000)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as stream:
        for record in series.values():
            stream.write(json.dumps(record, separators=(",", ":")) + "\n")
    return len(series)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["serve", "history", "sample"])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9187)
    parser.add_argument("--hours", type=int, choices=range(1, 49), default=24)
    parser.add_argument("--output", type=Path, default=ROOT / "data/mock-history.jsonl")
    parser.add_argument("--anchor", type=int, help="Unix seconds; omit to reuse persisted scenario anchor")
    args = parser.parse_args()
    state = ROOT / "data/mock-anchor.json"
    if args.anchor is not None:
        anchor = args.anchor
    elif state.exists():
        anchor = json.loads(state.read_text())["anchor"]
    else:
        anchor = int(time.time() // 60) * 60
        state.parent.mkdir(parents=True, exist_ok=True)
        state.write_text(json.dumps({"anchor": anchor}) + "\n", encoding="utf-8")
    if args.command == "sample":
        print(exposition(time.time(), anchor), end="")
    elif args.command == "history":
        count = history(args.output, args.hours, time.time(), anchor)
        print(f"Wrote {count} series to {args.output}; synthetic history only, not imported.")
    else:
        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                path = urlsplit(self.path).path
                if path not in ("/metrics", "/health"):
                    self.send_error(404)
                    return
                body = (exposition(time.time(), anchor) if path == "/metrics" else "ok\n").encode()
                self.send_response(200)
                self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        server = ThreadingHTTPServer((args.host, args.port), Handler)
        print(f"Mock metrics: http://{args.host}:{args.port}/metrics; anchor={anchor}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()


if __name__ == "__main__":
    main()
