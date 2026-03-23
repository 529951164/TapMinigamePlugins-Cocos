# TapTap小游戏插件开发项目（Cocos Creator版本）

本项目原本是 Cocos Creator 的 UI Demo，现已转变为 **TapTap小游戏插件（Cocos Creator版本）** 的专用开发和测试验证项目。

## 项目用途

- **插件开发**：开发和维护 TapTap小游戏 Cocos Creator 构建插件
- **测试验证**：使用 Cocos Creator 项目验证插件功能
- **构建测试**：测试微信小游戏到 Tap小游戏的转换流程

---

## 项目目录结构

```
UIDemo/
├── extensions/
│   └── taptap-minigame-tools/       # 插件唯一源代码目录（开发 + 运行 + 打包都在这里）
│       ├── builder.ts               # 构建器入口（构建面板选项定义）
│       ├── hooks.ts                 # 构建钩子（构建后自动转换）
│       ├── converter-ts.ts          # 核心转换逻辑（微信→Tap 11步转换）
│       ├── main.ts                  # 插件主入口
│       ├── asset-handlers.ts        # 资源处理器
│       ├── global.d.ts              # TypeScript 类型定义
│       ├── converter/               # Babel 转换器 + 依赖
│       ├── dist/                    # TypeScript 编译输出（Cocos 加载此目录）
│       ├── node_modules/            # 运行时依赖
│       ├── package.json             # 插件配置（版本、入口等）
│       ├── tsconfig.json            # TypeScript 配置
│       ├── CHANGELOG.md             # 版本更新日志
│       └── ENVIRONMENT_CHECK.md     # 环境检查说明
│
├── 微信小游戏转换tap小游戏工具/       # 原始 Python 转换脚本（核心参考，勿删）
│
├── repack_game.py                   # 重新封包脚本（macOS/Linux）
├── repack_game.bat                  # 重新封包脚本（Windows 批处理）
├── repack_game.ps1                  # 重新封包脚本（Windows PowerShell）
├── 重新封包说明.md                   # 重新封包工具使用文档
├── TapTap小游戏插件使用文档.md       # 插件安装和使用文档
│
├── assets/                          # Cocos Creator 项目资源（用于测试验证）
├── build/                           # 构建输出目录
├── settings/                        # Cocos Creator 项目设置
└── ...
```

### 重要规则

- **插件源代码只有一份**，位于 `extensions/taptap-minigame-tools/`
- **禁止**在项目根目录创建插件代码的副本
- 所有插件功能开发、编译、打包 ZIP 都在 `extensions/` 目录内完成

---

## 插件开发流程

### 1. 修改代码

直接修改 `extensions/taptap-minigame-tools/` 下的 TypeScript 源代码

### 2. 编译 TypeScript

```bash
cd /Volumes/Q/cocos/UIDemo/extensions/taptap-minigame-tools
npx tsc
```

编译输出到 `dist/` 目录，Cocos Creator 加载的是 `dist/` 中的 JS 文件。

### 3. 打包分发 ZIP

```bash
cd /Volumes/Q/cocos/UIDemo/extensions
zip -r ../taptap-minigame-tools-v<版本号>.zip taptap-minigame-tools/ \
  -x "*.DS_Store" "*/node_modules/.cache/*" "*/logs/*"
```

打包产物输出到项目根目录，文件名格式：`taptap-minigame-tools-v<版本号>.zip`

---

## 插件安装和使用

详见 [TapTap小游戏插件使用文档](./TapTap小游戏插件使用文档.md)

---

## 重新封包工具

构建后需要手动修改代码再重新打包时使用，详见 [重新封包说明](./重新封包说明.md)

---

## 技术栈

- **Cocos Creator**: 3.8.0+
- **TypeScript**: 5.9.3
- **Node.js**: 12.0+
- **核心依赖**: archiver（ZIP打包）、fs-extra（文件操作）、@babel/core（JS转换）

---

## 相关文档

- [插件使用文档](./TapTap小游戏插件使用文档.md)
- [重新封包说明](./重新封包说明.md)
- [插件更新日志](./extensions/taptap-minigame-tools/CHANGELOG.md)
- [环境检查文档](./extensions/taptap-minigame-tools/ENVIRONMENT_CHECK.md)

---

## 技术支持

- **开发者**：梁栋
- **插件版本**：1.1.0
- **支持平台**：Cocos Creator 3.8.0+
- **目标平台**：TapTap小游戏
