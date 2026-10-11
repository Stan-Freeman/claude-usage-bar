# Устанавливает строку состояния usage-bar в Claude Code (Windows).
# Запуск: powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/Stan-Freeman/claude-usage-bar/main/install-statusline.ps1 | iex"
$ErrorActionPreference = 'Stop'

$src = 'https://raw.githubusercontent.com/Stan-Freeman/claude-usage-bar/main/statusline.ps1'
if ($env:USAGEBAR_SRC) { $src = $env:USAGEBAR_SRC }

$dir = Join-Path $env:USERPROFILE '.claude'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

# 1. Скрипт строки состояния
$target = Join-Path $dir 'statusline.ps1'
if (Test-Path $src) { Copy-Item $src $target -Force }
else { Invoke-WebRequest -UseBasicParsing -Uri $src -OutFile $target }

# 2. Настройки: добавляем statusLine, остальное не трогаем
$settingsPath = Join-Path $dir 'settings.json'
$settings = $null
if (Test-Path $settingsPath) {
    Copy-Item $settingsPath ($settingsPath + '.bak') -Force
    $text = [IO.File]::ReadAllText($settingsPath)
    if ($text.Trim()) { $settings = $text | ConvertFrom-Json }
}
if ($null -eq $settings) { $settings = New-Object PSObject }

$command = 'powershell -NoProfile -ExecutionPolicy Bypass -File "' + ($target -replace '\\', '/') + '"'
$statusLine = [pscustomobject]@{ type = 'command'; command = $command; refreshInterval = 60 }
$settings | Add-Member -NotePropertyName 'statusLine' -NotePropertyValue $statusLine -Force

$json = $settings | ConvertTo-Json -Depth 64
[IO.File]::WriteAllText($settingsPath, $json, (New-Object System.Text.UTF8Encoding $false))

Write-Host ''
Write-Host 'Готово! Строка состояния установлена.' -ForegroundColor Green
Write-Host 'Перезапустите Claude Code (закройте и снова введите claude).'
if (Test-Path ($settingsPath + '.bak')) { Write-Host ('Копия прежних настроек: ' + $settingsPath + '.bak') }
