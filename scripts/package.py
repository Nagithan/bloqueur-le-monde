"""Paquet reproductible : contenu trié, dates et permissions ZIP fixes."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
dist = root / 'dist'
version = json.loads((dist / 'manifest.json').read_text())['version']
release = root / 'release'
release.mkdir(exist_ok=True)
archive = release / f'bloqueur-le-monde-{version}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for file in sorted(dist.rglob('*')):
        if not file.is_file():
            continue
        info = zipfile.ZipInfo(file.relative_to(dist).as_posix(), (1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        package.writestr(info, file.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(release / 'SHA256SUMS.txt').write_text(f'{digest}  {archive.name}\n')
print(archive)
print('SHA-256:', digest)
