# Строка состояния Claude Code: контекст, лимит на 5 часов, недельный лимит.
# Совместим с Windows PowerShell 5.1. Файл сохранён в UTF-8 с BOM.
$ErrorActionPreference = 'SilentlyContinue'
[Console]::InputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

$data = [Console]::In.ReadToEnd() | ConvertFrom-Json

function Round0([double]$x) { [int][Math]::Round($x, [MidpointRounding]::AwayFromZero) }

function Bar([double]$p) {
    $p = [Math]::Max(0, [Math]::Min(100, $p))
    $filled = Round0 ($p * 12 / 100)
    ([string][char]0x25B0 * $filled) + ([string][char]0x25B1 * (12 - $filled))
}

function Pct([double]$n) { ("{0}%" -f (Round0 $n)).PadLeft(4) }

function ResetIn($epoch) {
    if (-not $epoch) { return '' }
    $left = [long]$epoch - [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    if ($left -le 0) { return '' }
    $d = [Math]::Floor($left / 86400)
    $h = [Math]::Floor(($left % 86400) / 3600)
    $m = [Math]::Floor(($left % 3600) / 60)
    if ($d -gt 0) { return " | $d д $h ч" }
    if ($h -gt 0) { return " | $h ч $m мин" }
    return " | $m мин"
}

function Row([string]$label, [string]$rest) { $label.PadRight(8) + ' ' + $rest }

$lines = @()

$ctx = $data.context_window
if ($null -eq $ctx -or $null -eq $ctx.used_percentage) {
    $lines += Row 'Контекст' 'ждём первый ответ…'
} else {
    $used = [double]$ctx.used_percentage
    $tok = ''
    if ($ctx.context_window_size) {
        $tok = " | {0}k / {1}k" -f (Round0 ($ctx.total_input_tokens / 1000)), (Round0 ($ctx.context_window_size / 1000))
    }
    $lines += Row 'Контекст' ("{0} {1} свободно{2}" -f (Bar $used), (Pct (100 - $used)), $tok)
}

foreach ($w in @(@('five_hour', '5 часов'), @('seven_day', 'Неделя'))) {
    $win = $null
    if ($data.rate_limits) { $win = $data.rate_limits.($w[0]) }
    if ($null -eq $win -or $null -eq $win.used_percentage) {
        $lines += Row $w[1] 'нет данных (после первого ответа)'
    } else {
        $p = [double]$win.used_percentage
        $lines += Row $w[1] ("{0} {1}{2}" -f (Bar $p), (Pct $p), (ResetIn $win.resets_at))
    }
}

$lines -join "`n"
