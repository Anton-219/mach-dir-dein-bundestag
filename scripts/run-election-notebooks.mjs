import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const notebooks = [
  'scripts/notebooks/btw2021/01_prepare_btw2021_vote_entries.ipynb',
  'scripts/notebooks/btw2021/02_validate_btw2021_vote_entries.ipynb',
  'scripts/notebooks/btw2025/01_prepare_btw2025_vote_entries.ipynb',
  'scripts/notebooks/btw2025/02_validate_btw2025_vote_entries.ipynb',
]

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

function findPythonWithJupyter() {
  for (const [command, prefixArguments] of candidates) {
    const result = spawnSync(
      command,
      [...prefixArguments, '-m', 'jupyter', '--version'],
      { stdio: 'ignore' },
    )

    if (result.error?.code === 'ENOENT') {
      continue
    }
    if (!result.error && result.status === 0) {
      return [command, prefixArguments]
    }
  }

  console.error(
    'Python 3 with Jupyter is required to execute the election notebooks. ' +
      'Install the notebook dependencies and rerun npm run prepare:vote-json.',
  )
  process.exit(1)
}

const [pythonCommand, pythonPrefixArguments] = findPythonWithJupyter()
const temporaryOutputDirectory = mkdtempSync(join(tmpdir(), 'mdb-notebooks-'))

try {
  for (const [index, notebook] of notebooks.entries()) {
    console.log(`\nExecuting ${notebook}`)
    const result = spawnSync(
      pythonCommand,
      [
        ...pythonPrefixArguments,
        '-m',
        'jupyter',
        'nbconvert',
        '--to',
        'notebook',
        '--execute',
        '--ExecutePreprocessor.timeout=-1',
        '--output-dir',
        temporaryOutputDirectory,
        '--output',
        `${index + 1}-${basename(notebook)}`,
        notebook,
      ],
      { stdio: 'inherit' },
    )

    if (result.error) {
      console.error(`Could not execute ${notebook}: ${result.error.message}`)
      process.exit(1)
    }
    if (result.status !== 0) {
      process.exit(result.status ?? 1)
    }
  }
} finally {
  rmSync(temporaryOutputDirectory, { recursive: true, force: true })
}

console.log('\nElection VoteEntry JSON files were prepared and validated successfully.')
