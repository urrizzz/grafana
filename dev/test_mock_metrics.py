import json
import tempfile
import unittest
from pathlib import Path
from mock_metrics import CASES, exposition, history, samples

ANCHOR = 1_800_000_000


def values(t, scenario):
    return {metric: value for metric, tags, value in samples(t, ANCHOR)
            if tags["scenario"] == scenario}


class MockTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (Path(__file__).resolve().parents[1] / "data").mkdir(exist_ok=True)

    def test_counters_grow_and_octets_convert_to_expected_rate(self):
        case = CASES[1]
        from mock_metrics import integrated_octets, rate_profile, PROFILE_MINUTES
        start = ANCHOR
        self.assertEqual(integrated_octets(case, start, start + 60) * 8 / 60,
                         rate_profile(case)[(start // 60) % PROFILE_MINUTES])
        self.assertGreater(values(ANCHOR + 60, "up")["ifHCInOctets"],
                           values(ANCHOR, "up")["ifHCInOctets"])

    def test_irregular_repeatable_profiles_and_boundary_integral(self):
        from mock_metrics import rate_profile, integrated_octets, PROFILE_MINUTES
        a, b = rate_profile(CASES[1]), rate_profile(CASES[1], True)
        self.assertEqual(a, rate_profile(CASES[1]))
        self.assertNotEqual(a[:60], a[60:120])
        self.assertNotEqual(a[:1440], a[1440:2880])
        self.assertNotEqual(a, b)
        self.assertNotEqual(a, rate_profile(CASES[2]))
        boundary = PROFILE_MINUTES * 60
        expected = (a[-1] + a[0]) * 60 // 8
        self.assertEqual(integrated_octets(CASES[1], boundary-60, boundary+60), expected)

    def test_down_preserves_historical_counters(self):
        self.assertEqual(values(ANCHOR, "down")["ifOperStatus"], 2)
        self.assertEqual(values(ANCHOR, "down")["ifHCInOctets"],
                         values(ANCHOR + 60, "down")["ifHCInOctets"])
        self.assertLess(values(ANCHOR - 3600, "down")["ifHCInOctets"],
                        values(ANCHOR, "down")["ifHCInOctets"])

    def test_missing_unknown_zero_reset_and_gap(self):
        self.assertNotIn("ifOperStatus", values(ANCHOR, "missing_status"))
        self.assertEqual(values(ANCHOR, "unknown")["ifOperStatus"], 4)
        self.assertEqual(values(ANCHOR, "zero")["ifHCInOctets"], 0)
        self.assertNotIn("ifHCOutOctets", values(ANCHOR, "missing_out"))
        self.assertNotIn("ifHighSpeed", values(ANCHOR, "missing_capacity"))
        self.assertLess(values(ANCHOR - 1200, "reset")["ifHCInOctets"],
                        values(ANCHOR - 1260, "reset")["ifHCInOctets"])
        self.assertEqual(values(ANCHOR - 2400, "gap"), {})
        self.assertIn("ifHCInOctets", values(ANCHOR - 1740, "gap"))

    def test_history_matches_live_model_and_spacing(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[1] / "data") as directory:
            path = Path(directory) / "history.jsonl"
            history(path, 24, ANCHOR, ANCHOR)
            records = [json.loads(line) for line in path.read_text().splitlines()]
        expected = {(metric, tuple(tags.items())): value for metric, tags, value in samples(ANCHOR, ANCHOR)}
        for record in records:
            tags = dict(record["metric"])
            metric = tags.pop("__name__")
            self.assertTrue(all(b > a and (b-a) % 60000 == 0 for a,b in zip(record["timestamps"],record["timestamps"][1:])))
            if record["timestamps"][-1] == ANCHOR * 1000:
                self.assertEqual(record["values"][-1], expected[(metric, tuple(tags.items()))])
        self.assertTrue(exposition(ANCHOR, ANCHOR).endswith("\n"))


if __name__ == "__main__":
    unittest.main()
