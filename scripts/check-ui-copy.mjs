import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const sourceRoot = path.resolve('src')
const userFacingAttributes = new Set([
  'alt',
  'aria-description',
  'aria-label',
  'placeholder',
  'title',
])
const violations = []

function collectTsxFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      return collectTsxFiles(entryPath)
    }

    return entry.isFile() && entry.name.endsWith('.tsx') ? [entryPath] : []
  })
}

function containsWords(value) {
  return /\p{L}/u.test(value)
}

function record(sourceFile, node, value, kind) {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  violations.push({
    file: path.relative(process.cwd(), sourceFile.fileName),
    line: position.line + 1,
    column: position.character + 1,
    value: value.trim(),
    kind,
  })
}

for (const file of collectTsxFiles(sourceRoot)) {
  const source = fs.readFileSync(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )

  function visit(node) {
    if (ts.isJsxText(node) && containsWords(node.text)) {
      record(sourceFile, node, node.text, 'JSX text')
    }

    if (ts.isJsxAttribute(node)) {
      const attributeName = node.name.getText(sourceFile)
      if (
        userFacingAttributes.has(attributeName) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        containsWords(node.initializer.text)
      ) {
        record(
          sourceFile,
          node.initializer,
          node.initializer.text,
          attributeName,
        )
      }
    }

    if (
      ts.isJsxExpression(node) &&
      node.expression &&
      (ts.isStringLiteral(node.expression) ||
        ts.isNoSubstitutionTemplateLiteral(node.expression)) &&
      containsWords(node.expression.text)
    ) {
      record(sourceFile, node.expression, node.expression.text, 'JSX expression')
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

if (violations.length > 0) {
  console.error('Hardcoded user-facing JSX copy was found:')
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} ` +
        `[${violation.kind}] ${JSON.stringify(violation.value)}`,
    )
  }
  console.error('Move the copy to src/i18n/messages.ts and reference it through useI18n().')
  process.exitCode = 1
}
