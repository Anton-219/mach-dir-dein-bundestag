from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Gender = Literal["m", "w"]
AgeGroup = Literal["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
VoteType = Literal["1", "2"]
ElectionMethod = Literal["postal", "in-person"]


@dataclass(frozen=True)
class VoteEntry:
    districtId: int
    state: str
    gender: Gender
    ageGroup: AgeGroup
    party: str
    voteType: VoteType
    electionMethod: ElectionMethod
    votes: float


@dataclass(frozen=True)
class ValidationReport:
    entryCount: int
    sourceGroupCount: int
    maxDistrictMethodError: float
    maxStateDemographicError: float
