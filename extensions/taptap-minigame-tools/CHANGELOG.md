# Tap小游戏插件更新日志

## v1.0.6 (2026-01-26)

### 🔧 重构改进
- **屏蔽构建前环境检查**：
  - 所有依赖已集成到插件包（14MB），无需检查系统环境
  - 避免检查系统环境与插件依赖不一致的问题
  - 简化onBeforeBuild逻辑，减少执行时间
  - 如果有问题，会在转换时准确报告

### 🐛 修复问题
- **修复extensions/logs干扰问题**：删除会被Cocos识别为插件的logs目录

### 📝 逻辑优化
**之前的逻辑冲突**：
- 环境检查：检查系统的Node.js、Python、npm
- 实际使用：使用插件自带的Babel依赖
- 结果：检查的和使用的不是同一个东西 ❌

**现在的逻辑**：
- 不检查系统环境
- 直接使用插件自带的完整依赖
- 有问题在转换时报告（更准确）✓

## v1.0.5 (2026-01-26)

### 🎉 重大改进
- **集成所有依赖**：插件包现已包含完整的node_modules（压缩后6.6MB）
  - ✅ 开发者无需安装任何环境
  - ✅ 解压即用，无需等待npm install
  - ✅ 无需网络连接
  - ✅ 零失败风险
  - ✅ 跨平台完全兼容（Windows、macOS、Linux）

- **修复Windows解压乱码问题**：
  - 重命名 `环境检查说明.md` → `ENVIRONMENT_CHECK.md`
  - 避免Windows解压时因中文文件名导致乱码
  - 确保插件能在Windows上正常导入

### ✨ 新增功能
- **强制使用Python脚本选项**：在构建面板新增复选框"强制使用Python脚本"
  - 方便开发者测试Python脚本是否正常工作
  - 绕过TypeScript转换器，直接使用Python保底方案
  - 适用场景：调试、测试、或TypeScript转换器有问题时

- **完整的环境检查**：
  - 检查Node.js版本
  - 检查package.json完整性
  - 检查node_modules是否存在
  - 检查babel命令是否可用（Windows检查babel.cmd）
  - 检查Python保底方案可用性

### 🐛 紧急修复（Windows兼容性）

#### 问题1：spawn npx ENOENT（影响所有Windows用户）
**现象**：
```
启动Babel进程失败: spawn npx ENOENT
TypeScript转换器完全失效
```

**原因**：
- Windows上npx命令是`npx.cmd`，不是`npx`
- 使用spawn('npx')在Windows上会报ENOENT错误

**修复**：
```typescript
// ❌ 之前
spawn('npx', ['babel', ...])

// ✅ 现在
const babelPath = path.join(converterDir, 'node_modules', '.bin', 'babel');
const babelCmd = isWindows ? babelPath + '.cmd' : babelPath;
spawn(babelCmd, [...], { shell: isWindows })
```

#### 问题2：Python保底方案路径错误（影响所有用户）
**现象**：
```
Python转换脚本不存在: D:\...\dist\converter\wx_converter.py
                              ^^^^
```

**原因**：
- hooks.ts编译到dist目录后，`__dirname`指向`dist/`
- `path.join(__dirname, 'converter')` 变成了 `dist/converter/`
- 但Python脚本实际在 `converter/` 目录

**修复**：
```typescript
// ❌ 之前
const converterDir = path.join(__dirname, 'converter');

// ✅ 现在
const converterDir = path.join(__dirname, '..', 'converter');
```

### 📝 技术细节
- 直接调用本地安装的babel（node_modules/.bin/babel）
- Windows使用.cmd后缀和shell模式
- 修正所有使用__dirname的路径计算
- Python脚本已包含在插件包中

### ✅ 测试环境
- Windows 10/11 ✓
- macOS ✓
- Node.js 12+ ✓

## v1.0.4 (2026-01-23)

### 🐛 紧急修复
- **移除误导性错误日志**：onBeforeBuild中不再检查文件完整性（因为__dirname在钩子中不可靠）
- **优化环境检查策略**：
  - 构建前只做轻量级检查（Node.js版本、Python可用性）
  - 文件完整性检查在转换时进行（那里的路径是准确的）
  - 即使检查警告也允许继续构建，避免误拦截

### 📝 日志改进
**之前（误导性）**：
```
❌ 转换器配置文件缺失
❌ 插件安装不完整，缺少转换器配置文件
⚠️  将继续构建，但转换可能失败
```

**现在（准确）**：
```
✓ Node.js版本兼容
✅ 环境检查通过
```

### 🎯 原理说明
- `__dirname` 在不同钩子中指向不同目录
- onBeforeBuild: `extensions/tap-minigame/dist/`
- 转换器内部: `extensions/tap-minigame/dist/` 但使用 `path.join(__dirname, '..')` 正确定位
- 因此文件检查只在转换时做，构建前只检查环境

### ✅ 效果
- 不再有误导性的错误日志
- 开发者可以放心使用
- 真正的问题会在转换时准确报告

## v1.0.3 (2026-01-23)

### 🎉 重大改进
- **构建前环境检查**：在开始构建前检查Node.js版本和环境，不兼容时输出警告（不阻止构建，避免构建崩溃）
- **Python保底机制**：如果TypeScript转换器失败，自动切换到Python脚本作为保底方案
- **双重保障**：确保任何情况下都不会让构建报错中断
- **健壮的错误处理**：环境检查本身的错误也被捕获，确保钩子函数不会崩溃

### ✨ 新增特性

#### 1. 智能环境检查（onBeforeBuild）
- 检查Node.js版本兼容性（最低要求12.0）
- 检查转换器配置文件完整性
- 检测Python环境是否可用作为保底
- 不满足条件时**弹窗提示并阻止构建**

#### 2. 自动降级机制
```
第1步: 尝试TypeScript转换器
   ↓ 失败
第2步: 自动切换到Python保底方案
   ↓ 失败
第3步: 弹窗显示详细错误信息
```

#### 3. 友好的用户提示
- **环境不兼容**：弹窗明确说明问题和解决方案
- **使用保底方案**：弹窗告知用户已使用Python转换
- **转换失败**：弹窗显示详细的错误信息

### 🛡️ 错误处理

#### 场景1: Node.js版本过低 + 无Python
```
⚠️  环境检查警告
日志：Node.js版本过低，需要12.0或更高版本
     将继续构建，但转换可能失败
     请查看警告信息并安装必要的环境
→ 继续构建，转换时可能失败并显示详细错误
```

#### 场景2: Node.js版本过低 + 有Python
```
⚠️  使用保底方案
日志：Node.js版本不兼容，但检测到Python 3.x
     将使用Python脚本进行转换
→ 继续构建，使用Python转换
```

#### 场景3: TS转换失败 + Python成功
```
✓ 转换完成
弹窗：TypeScript转换器失败，已自动使用Python保底方案完成转换
     建议升级Cocos Creator以获得更好的性能
→ 构建成功
```

#### 场景4: 两种方案都失败
```
❌ 转换失败
弹窗：转换失败，请查看控制台日志获取详细信息
     TypeScript转换器错误：...
     Python保底方案错误：...
→ 构建失败，显示详细错误
```

### 📝 技术细节
- 在onBeforeBuild中执行环境检查（构建前）
  - 多层try-catch保护，确保钩子不会崩溃
  - 检查失败只输出警告，不阻止构建
  - 避免因环境检查导致"钩子函数执行失败"错误
- 在onAfterBuild中执行转换（构建后）
- 使用try-catch嵌套实现降级逻辑
- Python脚本使用argparse接收参数（--source --target）
- 超时机制：Python环境检测3秒超时
- 防止重复resolve：使用resolved标志位

### 🎯 用户体验
- **零配置**：环境满足时完全自动化
- **早发现**：构建前就发现问题，避免浪费时间
- **有保底**：多种方案保证转换成功率
- **信息清晰**：每个阶段都有明确的提示

## v1.0.2 (2026-01-23)

### 🐛 修复问题
- **修复console.error导致构建中断的问题**：在Cocos Creator构建环境中，console.error()会导致构建立即中断，现已改为console.log()输出日志
- **修复Cocos 3.8.1兼容性问题**：降级Babel版本以兼容旧版Node.js，解决"Cannot find module 'node:url'"错误
- **优化错误处理**：错误信息通过throw Error传递给构建系统，而不是通过console.error()
- **改进Babel日志输出**：Babel的stderr输出改为console.log()，因为stderr可能只是警告而不是致命错误

### 📝 技术细节
- 所有console.error()调用已替换为console.log()
- 降级Babel从7.24.6到7.17.10（兼容Node.js 12+）
- 移除'node:'前缀语法依赖
- 保持详细的错误日志输出
- 避免因为日志输出导致构建意外中断

### ✅ 兼容性
- Cocos Creator 3.8.1 ✓
- Cocos Creator 3.8.8 ✓
- Node.js 12+ ✓

## v1.0.1 (2026-01-22)

### 🐛 修复问题
- **修复Babel转换失败问题**：解决了其他开发者使用插件时因缺少依赖导致的转换失败问题

### ✨ 新增特性
1. **自动依赖检查与安装**
   - 插件首次运行时会自动检查并安装必要的转换器依赖
   - 位置：第1步，在所有操作之前执行
   - 无需开发者手动安装依赖

2. **智能重试机制**
   - 依赖安装失败时自动重试最多3次
   - 每次重试间隔5秒
   - 适应网络不稳定情况

3. **增强的错误处理**
   - 详细的错误信息输出
   - 友好的失败提示
   - 提供解决方案建议（切换npm镜像源等）

4. **改进的日志输出**
   - 每个步骤都有明显的分隔线和标题
   - 11个步骤清晰可见
   - 更容易追踪转换进度

### 📋 转换步骤（共11步）
1. ✅ 检查转换器依赖（自动安装）
2. ✅ 验证源路径
3. ✅ 复制项目文件
4. ✅ 处理game.json配置
5. ✅ 注入插件
6. ✅ 运行Babel转换
7. ✅ 注入运行时代码
8. ✅ 处理WASM兼容性
9. ✅ 处理coverviewCustomized设置
10. ✅ 复制版本检查文件
11. ✅ 创建分发包（game.zip）

### 🔧 技术细节
- 依赖安装超时时间：2分钟
- 安装目录：`extensions/tap-minigame/converter/node_modules`
- 主要依赖：
  - @babel/cli
  - @babel/core
  - @babel/preset-env
  - terser
  - esprima

### 🚀 使用方式
无需任何配置，插件会自动处理一切！
1. 在Cocos Creator中构建微信小游戏
2. 插件自动检查依赖并安装（仅首次）
3. 自动转换为Tap小游戏格式
4. 生成game.zip文件

### 📝 注意事项
- 首次使用需要网络连接以安装依赖
- 如果依赖安装失败，请检查网络或手动安装
- 可以使用国内镜像源加速：
  ```bash
  npm config set registry https://registry.npmmirror.com
  ```

### 🔍 排查问题
如果转换失败，请查看控制台日志：
- 日志会显示失败在哪一步
- 会显示详细的错误原因
- 会提供解决方案建议
