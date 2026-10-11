import { expect, test } from 'claude-code/testing'

import { formatLine } from './register'

test('строка: контекст и оба лимита со сбросом', () => {
  const now = Date.parse('2026-10-11T15:00:00Z')
  const line = formatLine(
    { tokens: 76000, window: 200000, percent: 38 },
    [
      { kind: 'five_hour', percentUsed: 72.4, resetsAt: '2026-10-11T16:30:00Z' },
      { kind: 'seven_day', percentUsed: 41, resetsAt: '2026-10-14T12:00:00Z' },
    ],
    now,
  )
  expect(line).toContain(' 62% свободно')
  expect(line).toContain('62% свободно | 76k / 200k')
  expect(line).toContain('5 часов')
  expect(line.split('\n')).toHaveLength(3)
  expect(line).not.toContain('использовано')
  expect(line).not.toContain('Лимит')
  expect(line).toContain('▰▰▰▰▰▰▰▰▰▱▱▱  72% | 1 ч 30 мин')
  expect(line).toContain('Неделя   ▰▰▰▰▰▱▱▱▱▱▱▱  41% | 2 д 21 ч')
})

test('строка: без данных', () => {
  const line = formatLine({ window: 200000 }, [], 0)
  expect(line).toContain('ждём первый ответ')
  expect(line).toContain('Неделя')
})
