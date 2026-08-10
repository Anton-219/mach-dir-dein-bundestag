import { spawnSync } from 'node:child_process'

const candidates =
  process.platform === 'win32'
    ? [
        ['py', ['-3']],
        ['python', []],
        ['python3', []],
      ]
    : [
        ['python3', []],
        ['python', []],
      ]

for (const [command, prefixArguments] of candidates) {
  const result = spawnSync(
    command,
    [...prefixArguments, 'scripts/export_vote_binary.py'],
    { stdio: 'inherit' },
  )

  if (result.error?.code === 'ENOENT') {
    continue
  }
  if (result.error) {
    console.error(`Could not start ${command}: ${result.error.message}`)
    process.exit(1)
  }
  process.exit(result.status ?? 1)
}

console.error(
  'Python 3 is required to generate the compact runtime vote data. ' +
    'Install Python 3 or run the exporter before starting the app.',
)
process.exit(1)
