# TapTap小游戏重新封包工具 (PowerShell版本)
# 完全独立，不依赖 Python

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TapTap 小游戏重新封包工具 (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$gameDir = Join-Path $scriptDir "game"

# 检查同级目录是否存在 game 文件夹
if (Test-Path $gameDir -PathType Container) {
    Write-Host "[检测] 找到 game 文件夹: $gameDir" -ForegroundColor Green
    $useDir = $gameDir
} else {
    Write-Host "[检测] 当前目录未找到 game 文件夹" -ForegroundColor Yellow
    Write-Host ""

    # 提示用户输入路径
    Write-Host "请输入 game 文件夹的完整路径:" -ForegroundColor White
    Write-Host "提示: 可以直接拖拽 game 文件夹到此窗口" -ForegroundColor Gray
    Write-Host ""

    $userInput = Read-Host "请输入路径"

    # 去除可能的引号
    $userInput = $userInput.Trim('"')

    # 检查用户输入是否为空
    if ([string]::IsNullOrWhiteSpace($userInput)) {
        Write-Host ""
        Write-Host "[错误] 路径不能为空！" -ForegroundColor Red
        Write-Host ""
        Write-Host "按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }

    # 检查输入的路径是否存在
    if (-not (Test-Path $userInput)) {
        Write-Host ""
        Write-Host "[错误] 路径不存在: $userInput" -ForegroundColor Red
        Write-Host ""
        Write-Host "按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }

    # 检查是否是目录
    if (-not (Test-Path $userInput -PathType Container)) {
        Write-Host ""
        Write-Host "[错误] 路径不是一个文件夹: $userInput" -ForegroundColor Red
        Write-Host ""
        Write-Host "按任意键退出..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }

    $useDir = $userInput
    Write-Host ""
    Write-Host "[确认] 使用目录: $useDir" -ForegroundColor Green
    Write-Host ""
}

# 验证 game 文件夹
Write-Host "[检查] 验证 game 文件夹..." -ForegroundColor Cyan

$gameJs = Join-Path $useDir "game.js"
$gameJson = Join-Path $useDir "game.json"

if (-not (Test-Path $gameJs)) {
    Write-Host "[警告] 未找到 game.js" -ForegroundColor Yellow
}

if (-not (Test-Path $gameJson)) {
    Write-Host "[警告] 未找到 game.json" -ForegroundColor Yellow
}

Write-Host "[检查] game 文件夹验证完成" -ForegroundColor Green
Write-Host ""

# 确定输出路径
$parentDir = Split-Path -Parent $useDir
$outputZip = Join-Path $parentDir "game.zip"

# 删除旧的 ZIP 文件
if (Test-Path $outputZip) {
    Write-Host "[信息] 删除旧的 game.zip..." -ForegroundColor Gray
    Remove-Item $outputZip -Force
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "开始打包..." -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "源目录: $useDir" -ForegroundColor White
Write-Host "输出文件: $outputZip" -ForegroundColor White
Write-Host ""

# 获取所有文件
Write-Host "[信息] 扫描文件..." -ForegroundColor Gray
$files = Get-ChildItem -Path $useDir -Recurse -File
$totalFiles = $files.Count
Write-Host "[信息] 总文件数: $totalFiles" -ForegroundColor Gray
Write-Host ""

# 创建 ZIP 文件
Write-Host "[信息] 创建 ZIP 包，请稍候..." -ForegroundColor Cyan
Write-Host ""

try {
    # 加载 .NET 压缩库
    Add-Type -AssemblyName System.IO.Compression.FileSystem

    # 创建 ZIP 文件
    $zip = [System.IO.Compression.ZipFile]::Open($outputZip, 'Create')

    $count = 0
    foreach ($file in $files) {
        # 计算相对路径
        $relativePath = $file.FullName.Substring($useDir.Length + 1)

        # 关键：ZIP 标准要求使用正斜杠 /，而不是 Windows 的反斜杠 \
        $relativePath = $relativePath.Replace('\', '/')

        # 添加文件到 ZIP（使用最优压缩）
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath, 'Optimal') | Out-Null

        $count++
        if ($count % 100 -eq 0) {
            Write-Host "  进度: $count / $totalFiles 个文件" -ForegroundColor Gray
        }
    }

    # 关闭 ZIP 文件
    $zip.Dispose()

    # 获取文件大小
    $zipSize = (Get-Item $outputZip).Length / 1MB
    $zipSizeRounded = [math]::Round($zipSize, 2)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "[成功] 打包完成！" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "文件数量: $count" -ForegroundColor White
    Write-Host "ZIP 大小: $zipSizeRounded MB" -ForegroundColor White
    Write-Host "输出路径: $outputZip" -ForegroundColor White
    Write-Host ""
    Write-Host "game.zip 已生成，可以上传到 TapTap 开发者中心" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "[错误] 打包失败！" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
exit 0
