# TapTap小游戏插件开发项目（Cocos Creator版本）

本项目原本是 Cocos Creator 的 UI Demo，现已转变为 **TapTap小游戏插件（Cocos Creator版本）** 的专用开发和测试验证项目。

## 项目用途

- **插件开发**：开发和维护 TapTap小游戏 Cocos Creator 插件
- **测试验证**：使用 Cocos Creator 项目验证插件功能
- **构建测试**：测试微信小游戏到 Tap小游戏的转换流程

---

## 插件源代码

### 源代码目录

```
taptap-minigame-tools/
├── builder.ts              # 构建器入口
├── hooks.ts                # 构建钩子（微信小游戏构建后处理）
├── converter-ts.ts         # TypeScript 转换器（主要转换逻辑）
├── main.ts                 # 插件主入口
├── asset-handlers.ts       # 资源处理器
├── global.d.ts             # TypeScript 类型定义
├── converter/              # Babel 转换器依赖（6.6MB）
├── dist/                   # TypeScript 编译输出目录
├── package.json            # 插件配置文件
└── tsconfig.json           # TypeScript 配置
```

### 关键文件说明

- **converter-ts.ts**：核心转换逻辑，实现微信小游戏到 Tap小游戏的 11 步转换流程
- **hooks.ts**：监听 Cocos Creator 构建完成事件，自动触发转换流程
- **converter/**：内置完整的 Babel 依赖，实现零配置使用

---

## 构建和打包流程

### 1. 开发插件代码

在 `taptap-minigame-tools/` 目录下修改 TypeScript 源代码

### 2. 编译 TypeScript

```bash
cd taptap-minigame-tools
npx tsc
```

**编译输出**：将所有 `.ts` 文件编译为 `.js` 文件，输出到 `dist/` 目录

### 3. 打包插件 ZIP

将整个 `taptap-minigame-tools/` 目录打包为 `tap-minigame-ts.zip`：

```bash
# 在项目根目录执行
cd /Volumes/Q/cocos/UIDemo
zip -r tap-minigame-ts.zip taptap-minigame-tools/ -x "*.DS_Store" "*/node_modules/.cache/*"
```

**打包规则**：
- ✅ 包含所有源代码文件（`.ts`、`.js`）
- ✅ 包含 `converter/` 完整依赖（必须）
- ✅ 包含 `node_modules/` 运行时依赖
- ✅ 包含 `dist/` 编译后的 JS 文件
- ✅ 包含 `package.json` 和配置文件
- ❌ 排除 `.DS_Store` 等系统文件

### 4. 导出路径

**最终产物**：`/Volumes/Q/cocos/UIDemo/tap-minigame-ts.zip`

---

## 插件安装和使用

### 安装插件

1. 打开 Cocos Creator 编辑器
2. **扩展 → 扩展管理器**
3. 点击 **导入本地扩展** 按钮
4. 选择 `tap-minigame-ts.zip` 文件
5. 启用插件

### 使用插件

1. **项目 → 构建发布**
2. 选择平台：**微信小游戏**
3. ☑️ 勾选 **"转换为Tap小游戏"**
4. 点击 **构建**

### 构建输出

- **微信小游戏**：`build/wechatgame/`
- **Tap小游戏目录**：`build/TapBuild/game/`
- **Tap小游戏ZIP包**：`build/TapBuild/game.zip` ⭐（可直接上传）

---

## 技术栈

- **Cocos Creator**: 3.8.1+（推荐 3.8.8）
- **TypeScript**: 5.9.3
- **Node.js**: 12.0+
- **核心依赖**:
  - `archiver`: ZIP 打包
  - `fs-extra`: 文件操作增强
  - `@babel/core`: JavaScript 代码转换

---

## 开发规范

### Git 分支管理

- **主分支**：保持稳定，用于发布
- **开发分支**：日常开发和测试
- **typescript-converter**：当前开发分支（TypeScript 转换器优化）

### 版本记录

查看 `taptap-minigame-tools/CHANGELOG.md` 了解版本更新历史

---

## 相关文档

- [TapTap小游戏插件使用文档](./TapTap小游戏插件使用文档.md)
- [插件 README](./taptap-minigame-tools/README.md)
- [环境检查文档](./taptap-minigame-tools/ENVIRONMENT_CHECK.md)
- [更新日志](./taptap-minigame-tools/CHANGELOG.md)

---

## 技术支持

- **开发者**：梁栋
- **插件版本**：1.0.0
- **支持平台**：Cocos Creator 3.0.0+
- **目标平台**：TapTap小游戏（兼容微信小游戏）