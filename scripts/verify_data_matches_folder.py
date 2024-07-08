import datetime
from argparse import Namespace, ArgumentParser
from pathlib import Path
import re
import sys

import frontmatter


def main() -> None:
    args = parse_args()
    paths = args.paths

    errors_per_path = {}

    for path in paths:
        if not path.exists() or path.is_dir() or path.suffix != ".md":
            continue

        errors = []
        folder_date = _get_folder_data(path)
        publish_date = _get_publish_date(path)
        creation_data = _get_data(path)



        if folder_date is None:
            errors.append(f"Folder name does not contain a date: {path.parent.name}")

        if publish_date is None:
            errors.append("Publish date not found in metadata")

        if creation_data is None:
            errors.append("Creation date not found in metadata")

        if folder_date != creation_data:
            errors.append(f"Folder date ({folder_date}) does not match creation date ({creation_data})")


        if publish_date is not None and creation_data is not None:
            if creation_data > publish_date:
                errors.append(f"Publish date ({publish_date}) is before creation date ({creation_data})")

        if len(errors) > 0:
            errors_per_path[path] = errors

    if len(errors_per_path) > 0:
        for path, errors in errors_per_path.items():
            print(f"Errors in {path}")
            for error in errors:
                print(f"- {error}")
        sys.exit(1)


def parse_args() -> Namespace:
    parser = ArgumentParser()
    parser.add_argument("paths", type=Path, nargs='+', help="Paths to the files to verify")

    return parser.parse_args()

def _get_folder_data(path: Path) -> datetime.date:
    folder_name = path.parent.name

    match = re.match(r"(\d{4}-\d{2}-\d{2})", folder_name)
    if match is None:
        raise None

    return datetime.datetime.strptime(match.group(1), "%Y-%m-%d").date()

def _get_publish_date(path: Path) -> datetime.date:
    assert path.suffix == ".md", "File must be a markdown file"

    with path.open() as file:
        meta_data = frontmatter.load(file)


    if "publishdate" in meta_data:
        try:
            return _parse_metadata_date(meta_data["publishdate"]).date()
        except Exception:
            return None


    raise None

def _get_data(path: Path) -> datetime.date:
    with path.open() as file:
        meta_data = frontmatter.load(file)

    if "date" in meta_data:
        try:
            return _parse_metadata_date(meta_data["date"]).date()
        except Exception:
            return None


    raise None

def _parse_metadata_date(date: str|datetime.datetime) -> datetime.datetime:
    if isinstance(date, datetime.datetime):
        return date
    return datetime.datetime.strptime(date, "%Y-%m-%dT%H:%M:%S%z")

if __name__ == "__main__":
    main()
