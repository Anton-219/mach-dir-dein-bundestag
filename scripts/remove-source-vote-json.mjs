import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const sourceVoteFiles = [
  'dist/data/btw2021/first_votes.json',
  'dist/data/btw2021/second_votes.json',
  'dist/data/btw2025/first_votes.json',
  'dist/data/btw2025/second_votes.json',
]

await Promise.all(
  sourceVoteFiles.map((fileName) => rm(resolve(fileName), { force: true })),
)
