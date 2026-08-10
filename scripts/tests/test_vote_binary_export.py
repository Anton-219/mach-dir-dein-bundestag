from __future__ import annotations

import json
from pathlib import Path
import struct
import tempfile
import unittest

from scripts.export_vote_binary import (
    AGE_GROUPS,
    ELECTION_METHODS,
    GENDERS,
    HEADER_STRUCT,
    MAGIC,
    SCHEMA_VERSION,
    export_election_directory,
)


class VoteBinaryExportTests(unittest.TestCase):
    def test_exports_columnar_binary_and_manifest_to_separate_runtime_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            source_directory = root / "generated" / "btw2025"
            output_directory = root / "public" / "data" / "btw2025"
            source_directory.mkdir(parents=True)
            first_entries = [
                {
                    "districtId": 1,
                    "state": "State A",
                    "gender": "m",
                    "ageGroup": "18-24",
                    "party": "AAA",
                    "voteType": "1",
                    "electionMethod": "in-person",
                    "votes": 12.5,
                },
                {
                    "districtId": 1,
                    "state": "State A",
                    "gender": "w",
                    "ageGroup": "70+",
                    "party": "BBB",
                    "voteType": "1",
                    "electionMethod": "postal",
                    "votes": 3.25,
                },
            ]
            second_entries = [
                {**entry, "voteType": "2", "votes": entry["votes"] + 1}
                for entry in first_entries
            ]
            (source_directory / "first_votes.json").write_text(
                json.dumps(first_entries), encoding="utf-8"
            )
            (source_directory / "second_votes.json").write_text(
                json.dumps(second_entries), encoding="utf-8"
            )

            manifest = export_election_directory(source_directory, output_directory)

            self.assertEqual(manifest["schemaVersion"], SCHEMA_VERSION)
            self.assertEqual(manifest["genders"], list(GENDERS))
            self.assertEqual(manifest["ageGroups"], list(AGE_GROUPS))
            self.assertEqual(
                manifest["electionMethods"], list(ELECTION_METHODS)
            )
            first_metadata = manifest["files"]["firstVotes"]
            self.assertEqual(first_metadata["recordCount"], 2)
            self.assertEqual(first_metadata["parties"], ["AAA", "BBB"])
            self.assertEqual(first_metadata["districtStates"], [None, "State A"])
            self.assertFalse((source_directory / "first_votes.bin").exists())
            self.assertTrue((output_directory / "vote_data.json").is_file())

            binary = (output_directory / "first_votes.bin").read_bytes()
            header = HEADER_STRUCT.unpack_from(binary, 0)
            (
                magic,
                version,
                vote_type,
                _reserved,
                record_count,
                district_offset,
                party_offset,
                group_offset,
                votes_offset,
            ) = header
            self.assertEqual(magic, MAGIC)
            self.assertEqual(version, SCHEMA_VERSION)
            self.assertEqual(vote_type, 1)
            self.assertEqual(record_count, 2)
            self.assertEqual(struct.unpack_from("<H", binary, district_offset)[0], 1)
            self.assertEqual(struct.unpack_from("<H", binary, party_offset)[0], 0)
            self.assertEqual(binary[group_offset], 12)
            self.assertEqual(
                struct.unpack_from("<d", binary, votes_offset)[0], 12.5
            )

    def test_normalizes_legacy_age_aliases_during_export(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            base = {
                "districtId": 1,
                "state": "State A",
                "gender": "m",
                "ageGroup": "65+",
                "party": "AAA",
                "electionMethod": "postal",
                "votes": 1.0,
            }
            (directory / "first_votes.json").write_text(
                json.dumps([{**base, "voteType": "1"}]), encoding="utf-8"
            )
            (directory / "second_votes.json").write_text(
                json.dumps([{**base, "voteType": "2"}]), encoding="utf-8"
            )

            manifest = export_election_directory(directory)
            first_metadata = manifest["files"]["firstVotes"]
            binary = (directory / "first_votes.bin").read_bytes()
            header = HEADER_STRUCT.unpack_from(binary, 0)
            group_offset = header[-2]

            self.assertEqual(binary[group_offset], 5)
            self.assertEqual(first_metadata["recordCount"], 1)

    def test_rejects_different_district_state_coverage(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            common = {
                "districtId": 1,
                "gender": "m",
                "ageGroup": "18-24",
                "party": "AAA",
                "electionMethod": "postal",
                "votes": 1.0,
            }
            (directory / "first_votes.json").write_text(
                json.dumps([{**common, "state": "State A", "voteType": "1"}]),
                encoding="utf-8",
            )
            (directory / "second_votes.json").write_text(
                json.dumps([{**common, "state": "State B", "voteType": "2"}]),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(ValueError, "constituency-to-state coverage"):
                export_election_directory(directory)


if __name__ == "__main__":
    unittest.main()
