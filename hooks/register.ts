import type { Register } from 'claude-code'

// Команды, которые удаляют файлы: перед ними мод спрашивает разрешения.
export const DELETES =
  /(^|[\s;&|(`])(rm|rmdir|unlink|shred|trash|del|erase|rd|Remove-Item)(\s|$)|git\s+(rm|clean)\b|find\b.*\s-delete\b/i

// Полоски контекста и лимитов рисует statusline.ps1 (см. README),
// потому что настоящую строку под вводом может занять только statusLine.

export const register: Register = on => {
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
