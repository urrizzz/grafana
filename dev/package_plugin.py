"""Create an unsigned development ZIP; does not sign or publish anything."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
plugin = json.loads((dist / "plugin.json").read_text(encoding="utf-8"))
if not (dist / "module.js").is_file():
    raise SystemExit("Build the plugin first with npm run build")
out = root / "artifacts"
out.mkdir(exist_ok=True)
archive = out / f"{plugin['id']}-{plugin['info']['version']}.zip"
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
    for file in sorted(dist.rglob("*")):
        if file.is_file():
            bundle.write(file, f"{plugin['id']}/{file.relative_to(dist).as_posix()}")
for algorithm in ("sha1", "sha256"):
    digest = hashlib.new(algorithm, archive.read_bytes()).hexdigest()
    archive.with_suffix(archive.suffix + "." + algorithm).write_text(f"{digest}  {archive.name}\n")
print(archive.name)
