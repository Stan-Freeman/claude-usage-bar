import type { EngineInterface, Register, SessionContextUsage, SessionRateLimit, Timer } from 'claude-code'

// Команды, которые удаляют файлы: перед ними мод спрашивает разрешения.
const DELETES =
  /(^|[\s;&|(`])(rm|rmdir|unlink|shred|trash|del|erase|rd|Remove-Item)(\s|$)|git\s+(rm|clean)\b|find\b.*\s-delete\b/i

const LABEL = 8

function bar(pct: number, width = 12): string {
  const p = Math.max(0, Math.min(100, pct))
  const filled = Math.round((p * width) / 100)
  return '▰'.repeat(filled) + '▱'.repeat(width - filled)
}

function pctText(n: number): string {
  return `${Math.round(n)}%`.padStart(4)
}

function resetIn(resetsAt: string | undefined, now: number): string {
  if (!resetsAt) return ''
  const left = Math.floor((Date.parse(resetsAt) - now) / 1000)
  if (!(left > 0)) return ''
  const d = Math.floor(left / 86400)
  const h = Math.floor((left % 86400) / 3600)
  const m = Math.floor((left % 3600) / 60)
  return ` | ${d ? `${d} д ${h} ч` : h ? `${h} ч ${m} мин` : `${m} мин`}`
}

function row(label: string, rest: string): string {
  return `${label.padEnd(LABEL)} ${rest}`
}

export function formatLine(
  context: SessionContextUsage,
  rateLimits: readonly SessionRateLimit[],
  now: number,
): string {
  const lines: string[] = []

  if (context.percent === undefined) {
    lines.push(row('Контекст', 'ждём первый ответ…'))
  } else {
    const used = context.percent
    const tok =
      context.tokens !== undefined
        ? ` | ${Math.round(context.tokens / 1000)}k / ${Math.round(context.window / 1000)}k`
        : ''
    lines.push(row('Контекст', `${bar(used)} ${pctText(100 - used)} свободно${tok}`))
  }

  for (const [kind, title] of [
    ['five_hour', '5 часов'],
    ['seven_day', 'Неделя'],
  ] as const) {
    const w = rateLimits.find(r => r.kind === kind)
    lines.push(
      w
        ? row(title, `${bar(w.percentUsed)} ${pctText(w.percentUsed)}${resetIn(w.resetsAt, now)}`)
        : row(title, 'нет данных (только Pro/Max, после первого ответа)'),
    )
  }

  return lines.join('\n')
}

async function refresh($: EngineInterface): Promise<void> {
  const usage = await $.session.usage()
  $.ui.status(formatLine(usage.context, usage.rateLimits, await $.clock.now()))
}

export const register: Register = on => {
  let tick: Timer | undefined

  on('session.start', async ($, e, next) => {
    const result = await next(e)
    await refresh($).catch(() => undefined)
    // обновлять таймер сброса раз в минуту
    tick?.cancel()
    tick = $.clock.every(60_000, () => void refresh($).catch(() => undefined))
    return result
  })

  on('session.measure', async ($, e, next) => {
    $.ui.status(formatLine(e.context, e.rateLimits, await $.clock.now()))
    return next(e)
  })

  // Приятный звук, когда задача готова
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    $.audio.play({ asset: 'sounds/done.wav' }).catch(() => undefined)
    return result
  })

  // Не удалять файлы без спроса
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    if (!DELETES.test(e.command)) return next(e)

    let answer: string
    try {
      answer = await $.ui.ask(`Claude хочет удалить файлы:\n${e.command.slice(0, 300)}\nРазрешить?`, [
        'Разрешить',
        'Запретить',
      ])
    } catch {
      answer = 'Запретить'
    }

    return answer === 'Разрешить'
      ? next(e)
      : { deny: 'Пользователь запретил удаление. Не удаляй файлы и спроси, что делать дальше.' }
  }).catch(($, e, next) =>
    next.called ? next(e) : { deny: 'Проверка удаления не сработала, поэтому удаление остановлено. Спроси пользователя.' },
  )
}
