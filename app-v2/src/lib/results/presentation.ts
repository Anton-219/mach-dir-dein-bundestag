import type { CoalitionResult } from '../coalitions/index.ts'
import type {
    ElectionResult,
    SeatResult,
} from '../../models/calculation-results.ts'
import type { Party } from '../../models/json-contracts.ts'

const FALLBACK_PARTY_COLOR = '#71838c'

export interface PartyIdentity {
    abbreviation: string
    name: string
    color: string
}

export interface PresentedPartyResult extends PartyIdentity {
    seatPosition: number
    votes: number
    percentage: number
    seats: number
}

export interface ParliamentSegment extends PresentedPartyResult {
    startPercentage: number
    sharePercentage: number
}

export function getPartyIdentity(
    abbreviation: string,
    parties: readonly Party[],
): PartyIdentity {
    const party = parties.find((candidate) => candidate.abbreviation === abbreviation)

    return {
        abbreviation,
        name: party?.name ?? abbreviation,
        color: party?.color ?? FALLBACK_PARTY_COLOR,
    }
}

export function buildPresentedPartyResults(
    parties: readonly Party[],
    electionResults: readonly ElectionResult[],
    seatResults: readonly SeatResult[],
): PresentedPartyResult[] {
    const partiesByAbbreviation = new Map(
        parties.map((party) => [party.abbreviation, party]),
    )
    const electionResultsByAbbreviation = new Map(
        electionResults.map((result) => [result.partyAbbreviation, result]),
    )

    return seatResults
        .filter((result) => Number.isFinite(result.seats) && result.seats > 0)
        .map((seatResult) => {
            const party = partiesByAbbreviation.get(seatResult.partyAbbreviation)
            const electionResult = electionResultsByAbbreviation.get(
                seatResult.partyAbbreviation,
            )

            return {
                abbreviation: seatResult.partyAbbreviation,
                name: party?.name ?? seatResult.partyAbbreviation,
                color: party?.color ?? FALLBACK_PARTY_COLOR,
                seatPosition: seatResult.seatPosition,
                votes: electionResult?.votes ?? 0,
                percentage: electionResult?.percentage ?? 0,
                seats: seatResult.seats,
            }
        })
        .sort(
            (left, right) =>
                left.seatPosition - right.seatPosition ||
                left.abbreviation.localeCompare(right.abbreviation, 'en'),
        )
}

export function sortPartyResultsBySeats(
    results: readonly PresentedPartyResult[],
): PresentedPartyResult[] {
    return [...results].sort(
        (left, right) =>
            right.seats - left.seats ||
            right.votes - left.votes ||
            left.seatPosition - right.seatPosition ||
            left.abbreviation.localeCompare(right.abbreviation, 'en'),
    )
}

export function buildParliamentSegments(
    results: readonly PresentedPartyResult[],
): ParliamentSegment[] {
    const totalSeats = results.reduce((total, result) => total + result.seats, 0)
    if (!Number.isFinite(totalSeats) || totalSeats <= 0) {
        return []
    }

    let startPercentage = 0

    return results.map((result) => {
        const sharePercentage = (result.seats / totalSeats) * 100
        const segment = {
            ...result,
            startPercentage,
            sharePercentage,
        }

        startPercentage += sharePercentage
        return segment
    })
}

export function prioritizeCoalitions(
    coalitions: readonly CoalitionResult[],
    limit = 5,
): CoalitionResult[] {
    if (!Number.isInteger(limit) || limit <= 0) {
        return []
    }

    return coalitions
        .filter(
            (coalition) =>
                coalition.members.length > 0 &&
                Number.isFinite(coalition.seats) &&
                coalition.seats > 0 &&
                Number.isFinite(coalition.surplus) &&
                coalition.surplus >= 0,
        )
        .sort(
            (left, right) =>
                left.members.length - right.members.length ||
                right.surplus - left.surplus ||
                right.seats - left.seats ||
                left.members
                    .map((member) => member.partyAbbreviation)
                    .join('+')
                    .localeCompare(
                        right.members.map((member) => member.partyAbbreviation).join('+'),
                        'en',
                    ),
        )
        .slice(0, limit)
}
