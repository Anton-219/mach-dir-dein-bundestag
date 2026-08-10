"""Convert prepared VoteEntry JSON files into compact runtime binary files.

The Jupyter notebooks remain the canonical, human-readable preparation path.
This module only creates deterministic deployment artifacts for the web app.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import gc
import hashlib
import json
import math
from pathlib import Path
import struct
from typing import Any


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_ROOT = REPOSITORY_ROOT / "scripts" / "data" / "generated"
DEFAULT_OUTPUT_ROOT = REPOSITORY_ROOT / "public" / "data"
DEFAULT_ELECTION_DIRECTORIES = ("btw2021", "btw2025")

MAGIC = b"MDBVOTE\0"
SCHEMA_VERSION = 1
FORMAT_NAME = "mdb-vote-columnar"
HEADER_STRUCT = struct.Struct("<8sHBBIIIII")
HEADER_BYTES = HEADER_STRUCT.size

GENDERS = ("m", "w")
AGE_GROUPS = ("18-24", "25-34", "35-44", "45-59", "60-69", "70+")
LEGACY_AGE_GROUP_ALIASES = {
    "45-54": "45-59",
    "55-64": "60-69",
    "65+": "70+",
}
ELECTION_METHODS = ("postal", "in-person")


@dataclass(frozen=True)
class BinaryFileMetadata:
    file: str
    voteType: str
    recordCount: int
    byteLength: int
    parties: list[str]
    districtStates: list[str | None]
    sourceSha256: str
    binarySha256: str

    def to_json(self) -> dict[str, Any]:
        return {
            "file": self.file,
            "voteType": self.voteType,
            "recordCount": self.recordCount,
            "byteLength": self.byteLength,
            "parties": self.parties,
            "districtStates": self.districtStates,
            "sourceSha256": self.sourceSha256,
            "binarySha256": self.binarySha256,
        }


def _align(value: int, alignment: int) -> int:
    return (value + alignment - 1) // alignment * alignment


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _load_entries(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, list):
        raise ValueError(f"{path} must contain a top-level JSON array")
    if not all(isinstance(entry, dict) for entry in value):
        raise ValueError(f"{path} must contain JSON objects only")
    return value


def _normalized_age_group(value: Any) -> str:
    if value in AGE_GROUPS:
        return str(value)
    if isinstance(value, str) and value in LEGACY_AGE_GROUP_ALIASES:
        return LEGACY_AGE_GROUP_ALIASES[value]
    raise ValueError(f"unsupported ageGroup {value!r}")


def _validate_entry(
    entry: dict[str, Any],
    expected_vote_type: str,
    index: int,
) -> tuple[int, str, str, str, str, str, float]:
    district_id = entry.get("districtId")
    state = entry.get("state")
    gender = entry.get("gender")
    party = entry.get("party")
    vote_type = entry.get("voteType")
    election_method = entry.get("electionMethod")
    votes = entry.get("votes")

    if isinstance(district_id, bool) or not isinstance(district_id, int):
        raise ValueError(f"record {index}: districtId must be an integer")
    if district_id <= 0 or district_id > 65535:
        raise ValueError(f"record {index}: districtId is outside uint16 range")
    if not isinstance(state, str) or not state:
        raise ValueError(f"record {index}: state must be a non-empty string")
    if gender not in GENDERS:
        raise ValueError(f"record {index}: unsupported gender {gender!r}")
    age_group = _normalized_age_group(entry.get("ageGroup"))
    if not isinstance(party, str) or not party:
        raise ValueError(f"record {index}: party must be a non-empty string")
    if vote_type != expected_vote_type:
        raise ValueError(
            f"record {index}: expected voteType {expected_vote_type!r}, got {vote_type!r}"
        )
    if election_method not in ELECTION_METHODS:
        raise ValueError(
            f"record {index}: unsupported electionMethod {election_method!r}"
        )
    if isinstance(votes, bool) or not isinstance(votes, (int, float)):
        raise ValueError(f"record {index}: votes must be numeric")
    numeric_votes = float(votes)
    if not math.isfinite(numeric_votes) or numeric_votes < 0:
        raise ValueError(f"record {index}: votes must be finite and non-negative")

    return (
        district_id,
        state,
        str(gender),
        age_group,
        party,
        str(election_method),
        numeric_votes,
    )


def _group_id(gender: str, age_group: str, election_method: str) -> int:
    age_index = AGE_GROUPS.index(age_group)
    gender_index = GENDERS.index(gender)
    method_index = ELECTION_METHODS.index(election_method)
    return age_index + len(AGE_GROUPS) * (
        gender_index + len(GENDERS) * method_index
    )


def export_vote_file(
    source_path: Path,
    output_path: Path,
    expected_vote_type: str,
) -> BinaryFileMetadata:
    entries = _load_entries(source_path)
    validated: list[tuple[int, str, str, str, str, str, float]] = []
    parties: set[str] = set()
    states_by_district: dict[int, str] = {}

    for index, entry in enumerate(entries):
        parsed = _validate_entry(entry, expected_vote_type, index)
        district_id, state, _gender, _age_group, party, _method, _votes = parsed
        previous_state = states_by_district.get(district_id)
        if previous_state is not None and previous_state != state:
            raise ValueError(
                f"{source_path}: district {district_id} belongs to both "
                f"{previous_state!r} and {state!r}"
            )
        states_by_district[district_id] = state
        parties.add(party)
        validated.append(parsed)

    party_names = sorted(parties)
    if len(party_names) > 65535:
        raise ValueError(f"{source_path}: more than 65535 distinct parties")
    party_ids = {party: index for index, party in enumerate(party_names)}

    record_count = len(validated)
    district_offset = HEADER_BYTES
    party_offset = district_offset + record_count * 2
    group_offset = party_offset + record_count * 2
    votes_offset = _align(group_offset + record_count, 8)
    byte_length = votes_offset + record_count * 8

    payload = bytearray(byte_length)
    HEADER_STRUCT.pack_into(
        payload,
        0,
        MAGIC,
        SCHEMA_VERSION,
        int(expected_vote_type),
        0,
        record_count,
        district_offset,
        party_offset,
        group_offset,
        votes_offset,
    )

    for index, (
        district_id,
        _state,
        gender,
        age_group,
        party,
        election_method,
        votes,
    ) in enumerate(validated):
        struct.pack_into("<H", payload, district_offset + index * 2, district_id)
        struct.pack_into("<H", payload, party_offset + index * 2, party_ids[party])
        payload[group_offset + index] = _group_id(
            gender,
            age_group,
            election_method,
        )
        struct.pack_into("<d", payload, votes_offset + index * 8, votes)

    max_district = max(states_by_district, default=0)
    district_states: list[str | None] = [None] * (max_district + 1)
    for district_id, state in states_by_district.items():
        district_states[district_id] = state

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(payload)

    metadata = BinaryFileMetadata(
        file=output_path.name,
        voteType=expected_vote_type,
        recordCount=record_count,
        byteLength=byte_length,
        parties=party_names,
        districtStates=district_states,
        sourceSha256=_sha256_file(source_path),
        binarySha256=hashlib.sha256(payload).hexdigest(),
    )

    del entries
    del validated
    del payload
    gc.collect()
    return metadata


def export_election_directory(
    source_directory: Path,
    output_directory: Path | None = None,
) -> dict[str, Any]:
    output_directory = source_directory if output_directory is None else output_directory
    first_source = source_directory / "first_votes.json"
    second_source = source_directory / "second_votes.json"
    if not first_source.is_file() or not second_source.is_file():
        missing = [
            str(path)
            for path in (first_source, second_source)
            if not path.is_file()
        ]
        raise FileNotFoundError(f"missing prepared vote JSON: {', '.join(missing)}")

    first_metadata = export_vote_file(
        first_source,
        output_directory / "first_votes.bin",
        "1",
    )
    second_metadata = export_vote_file(
        second_source,
        output_directory / "second_votes.bin",
        "2",
    )

    first_districts = {
        index: state
        for index, state in enumerate(first_metadata.districtStates)
        if state is not None
    }
    second_districts = {
        index: state
        for index, state in enumerate(second_metadata.districtStates)
        if state is not None
    }
    if first_districts != second_districts:
        raise ValueError(
            f"{source_directory}: first- and second-vote files do not have identical "
            "constituency-to-state coverage"
        )

    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "format": FORMAT_NAME,
        "genders": list(GENDERS),
        "ageGroups": list(AGE_GROUPS),
        "electionMethods": list(ELECTION_METHODS),
        "files": {
            "firstVotes": first_metadata.to_json(),
            "secondVotes": second_metadata.to_json(),
        },
    }
    output_directory.mkdir(parents=True, exist_ok=True)
    manifest_path = output_directory / "vote_data.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Convert prepared VoteEntry JSON files into compact binary runtime "
            "assets without changing the notebook output format."
        )
    )
    parser.add_argument(
        "--source-root",
        type=Path,
        default=DEFAULT_SOURCE_ROOT,
        help="Root containing generated btw2021/, btw2025/, ... JSON directories",
    )
    parser.add_argument(
        "--output-root",
        type=Path,
        default=DEFAULT_OUTPUT_ROOT,
        help="Root receiving the runtime btw2021/, btw2025/, ... assets",
    )
    parser.add_argument(
        "--election",
        action="append",
        dest="elections",
        help="Election directory to export, e.g. btw2025 (repeatable)",
    )
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    elections = tuple(args.elections or DEFAULT_ELECTION_DIRECTORIES)
    for election in elections:
        source_directory = args.source_root / election
        output_directory = args.output_root / election
        manifest = export_election_directory(source_directory, output_directory)
        first = manifest["files"]["firstVotes"]
        second = manifest["files"]["secondVotes"]
        source_bytes = (
            (source_directory / "first_votes.json").stat().st_size
            + (source_directory / "second_votes.json").stat().st_size
        )
        binary_bytes = first["byteLength"] + second["byteLength"]
        reduction = 0 if source_bytes == 0 else 1 - binary_bytes / source_bytes
        print(
            f"{election}: {source_bytes / 1024 / 1024:.1f} MiB JSON -> "
            f"{binary_bytes / 1024 / 1024:.1f} MiB binary "
            f"({reduction:.1%} smaller)"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
