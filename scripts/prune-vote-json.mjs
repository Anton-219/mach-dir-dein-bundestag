import { readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const dataDirectory = resolve('dist/data')

let entries
try {
  entries = await readdir(dataDirectory, { withFileTypes: true })
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    process.exit(0)
  }
  throw error
}

for (const entry of entries) {
  if (!entry.isDirectory() || !/^btw\d{4}$/.test(entry.name)) {
    continue
  }

  const electionDirectory = join(dataDirectory, entry.name)
  await Promise.all([
    rm(join(electionDirectory, 'first_votes.json'), { force: true }),
    rm(join(electionDirectory, 'second_votes.json'), { force: true }),
  ])
}
