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
def write_zip(archive, files):
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
        for name, file in sorted(files):
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            package.writestr(info, file.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

archive = release / f'bloqueur-le-monde-{version}.zip'
write_zip(archive, [(file.relative_to(dist).as_posix(), file) for file in dist.rglob('*') if file.is_file()])
# The submission dossier is separate: only the extension ZIP goes into the Store uploader.
dossier = release / f'dossier-chrome-web-store-{version}.zip'
files = [(file.relative_to(root).as_posix(), file) for file in (root / 'store').rglob('*') if file.is_file() and file.suffix in ['.md', '.png', '.json']]
files.extend((name, root / name) for name in ['PRIVACY.md', 'LICENSE', 'CONTRIBUTING.md', 'docs/RECETTE.md', 'docs/INSTALLATION.md', f'docs/recette-{version}.json'])
files.extend([('icon-128.png', dist / 'icons/128.png'), (archive.name, archive)])
write_zip(dossier, files)
checksums = []
for file in [archive, dossier]:
    digest = hashlib.sha256(file.read_bytes()).hexdigest()
    checksums.append(f'{digest}  {file.name}\n')
    print(file)
    print('SHA-256:', digest)
(release / 'SHA256SUMS.txt').write_text(''.join(checksums))
