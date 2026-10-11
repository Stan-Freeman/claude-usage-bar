import { expect, test } from 'claude-code/testing'

import { DELETES } from './register'

test('ловит команды удаления', () => {
  for (const cmd of ['rm -rf build', 'cd x && rm a.txt', 'rmdir old', 'git rm file.ts', 'git clean -fd', 'find . -name "*.tmp" -delete', 'del /q a.txt', 'Remove-Item a.txt']) {
    expect(DELETES.test(cmd)).toBe(true)
  }
})

test('не мешает обычным командам', () => {
  for (const cmd of ['ls -la', 'git status', 'npm run format', 'echo confirm', 'cat readme.md']) {
    expect(DELETES.test(cmd)).toBe(false)
  }
})
