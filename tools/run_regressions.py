"""Run the complete offline regression suite against the project or extracted APK assets."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory
import argparse
import os
import subprocess
import sys

from make_preview import preview


def main():
    tools = Path(__file__).resolve().parent
    root = tools.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--assets', type=Path, default=root / 'app/src/main/assets')
    parser.add_argument('--logs', type=Path, help='Optional directory for complete suite logs')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if args.workers < 1:
        parser.error('--workers must be positive')
    if args.logs:
        args.logs.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix='pocket-years-tests-') as directory:
        standalone = Path(directory) / 'Pocket-Years-Play.html'
        preview(standalone, args.assets.resolve())
        env = {**os.environ, 'POCKET_ASSET_DIR': str(args.assets.resolve()),
               'POCKET_PREVIEW': str(standalone)}
        suites = (sorted(tools.glob('test_*.cjs')) + sorted((root / 'qa/v1.3').glob('test_*.cjs'))
                  + [tools / 'test_backup_picker.py'])

        def run(suite):
            command = ['node' if suite.suffix == '.cjs' else sys.executable, str(suite)]
            result = subprocess.run(command, cwd=root, env=env, stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT)
            if args.logs:
                (args.logs / (suite.stem + '.log')).write_bytes(result.stdout)
            return suite.stem, result

        failed = []
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            for name, result in pool.map(run, suites):
                print(('FAIL' if result.returncode else 'PASS'), name, flush=True)
                if result.returncode:
                    failed.append(name)
                    if not args.logs:
                        sys.stdout.buffer.write(result.stdout)
        print(f'{len(suites) - len(failed)}/{len(suites)} suites passed.')
        return int(bool(failed))


if __name__ == '__main__':
    sys.exit(main())
