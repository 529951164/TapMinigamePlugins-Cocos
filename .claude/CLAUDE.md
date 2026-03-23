# UIDemo 项目 - Claude Code 指令

## 项目概述

TapTap小游戏 Cocos Creator 构建插件的开发和测试项目。

## 插件开发规则（必须遵守）

### 唯一源代码位置

- 插件代码**只有一份**，位于 `extensions/taptap-minigame-tools/`
- **禁止**在项目根目录或其他位置创建插件代码的副本或复制品
- 所有插件功能开发、修改、编译都直接在 `extensions/taptap-minigame-tools/` 内操作

### 编译流程

修改 `.ts` 源码后，需要编译才能在 Cocos Creator 中生效：

```bash
cd /Volumes/Q/cocos/UIDemo/extensions/taptap-minigame-tools && npx tsc
```

### 打包分发 ZIP

从 `extensions/` 目录打包，输出到项目根目录：

```bash
cd /Volumes/Q/cocos/UIDemo/extensions && zip -r ../taptap-minigame-tools-v<版本号>.zip taptap-minigame-tools/ -x "*.DS_Store" "*/node_modules/.cache/*" "*/logs/*"
```

版本号从 `extensions/taptap-minigame-tools/package.json` 的 `version` 字段读取。

## 目录说明

| 目录/文件 | 用途 | 备注 |
|-----------|------|------|
| `extensions/taptap-minigame-tools/` | 插件源代码（唯一） | 开发+运行+打包都在这里 |
| `微信小游戏转换tap小游戏工具/` | 原始 Python 转换脚本 | 核心参考，勿删 |
| `repack_game.py/.bat/.ps1` | 重新封包工具 | 构建后手动修改代码再打包用 |
| `assets/` | Cocos Creator 项目资源 | 用于测试验证插件 |
| `build/` | 构建输出 | 构建产物目录 |

## 插件关键文件

| 文件 | 用途 |
|------|------|
| `converter-ts.ts` | 核心转换逻辑（微信→Tap 11步转换） |
| `hooks.ts` | 构建钩子（构建后自动触发转换） |
| `builder.ts` | 构建面板选项定义 |
| `main.ts` | 插件主入口 |
| `converter/` | Babel 转换器 + 内置依赖 |
| `dist/` | TS 编译输出，Cocos 加载此目录 |
