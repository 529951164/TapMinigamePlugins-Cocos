#!/bin/bash
# TapTap 小游戏插件打包脚本
# 用法: bash build.sh
# 输出: 上级目录的 taptap-minigame-tools-v{版本号}.zip

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 从 package.json 读取版本号
VERSION=$(node -p "require('./package.json').version")
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="$(basename "$SCRIPT_DIR")"
OUTPUT_FILE="$OUTPUT_DIR/taptap-minigame-tools-v${VERSION}.zip"

echo "========================================"
echo "TapTap 小游戏插件打包 v${VERSION}"
echo "========================================"

# 1. 编译 TypeScript
echo "[1/3] 编译 TypeScript..."
node node_modules/typescript/bin/tsc
echo "  ✓ 编译完成"

# 2. 删除旧 ZIP
if [ -f "$OUTPUT_FILE" ]; then
    rm "$OUTPUT_FILE"
    echo "[2/3] 已删除旧版本 ZIP"
else
    echo "[2/3] 无旧版本 ZIP"
fi

# 3. 打包
# 排除 .ts 源码但保留 .d.ts 类型定义，排除开发文件
echo "[3/3] 打包中..."
cd "$OUTPUT_DIR"

# 生成排除列表：所有 .ts 文件，但不包含 .d.ts
EXCLUDE_FILE=$(mktemp)
find "$PLUGIN_DIR" -name "*.ts" ! -name "*.d.ts" > "$EXCLUDE_FILE"

zip -r "$OUTPUT_FILE" "$PLUGIN_DIR/" \
    -x@"$EXCLUDE_FILE" \
    -x "*/.DS_Store" \
    -x "*/.git/*" \
    -x "*/tsconfig.json" \
    -x "*/node_modules/.package-lock.json" \
    -x "*/build.sh" \
    -x "*/v1.2.0-release-notes.md" \
    > /dev/null 2>&1

rm "$EXCLUDE_FILE"

# 验证 tap-minigame.d.ts 在 ZIP 中
if zipinfo "$OUTPUT_FILE" 2>/dev/null | grep -q "tap-minigame.d.ts"; then
    echo "  ✓ tap-minigame.d.ts 已包含"
else
    echo "  ✗ 警告: tap-minigame.d.ts 未包含在 ZIP 中！"
fi

SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo "========================================"
echo "✓ 打包完成: $OUTPUT_FILE ($SIZE)"
echo "========================================"
