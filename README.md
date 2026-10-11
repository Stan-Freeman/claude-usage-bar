# usage-bar для Claude Code

Под строкой ввода:

```
Контекст ▰▰▰▰▰▱▱▱▱▱▱▱  62% свободно | 76k / 200k
5 часов  ▰▰▰▰▰▰▰▰▰▱▱▱  72% | 1 ч 30 мин
Неделя   ▰▰▰▰▰▱▱▱▱▱▱▱  41% | 2 д 21 ч
```

У лимитов после `|` — время до их обновления. Лимиты видны на подписке Pro/Max после первого ответа.

Плюс:
- приятный звук, когда задача готова;
- вопрос «Разрешить / Запретить» перед любой командой удаления (`rm`, `rmdir`, `git rm`, `git clean`, `find -delete`, `del`, `Remove-Item`…).

## Установка (Windows)

**1. Строка под вводом.** В PowerShell или командной строке:

```
powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Stan-Freeman/claude-usage-bar/main/install-statusline.ps1 | iex"
```

Установщик сохранит копию ваших настроек в `settings.json.bak`.

**2. Звук и защита от удаления.** В Claude Code:

```
/plugin install usage-bar --marketplace Stan-Freeman/claude-usage-bar
```

На вопрос `Add marketplace?` ответьте `y`, затем выберите **user**.

Перезапустите Claude Code.

## Удаление

```
/plugin uninstall usage-bar
```

Строку состояния уберите из `%USERPROFILE%\.claude\settings.json` (блок `statusLine`) или верните копию `settings.json.bak`.
