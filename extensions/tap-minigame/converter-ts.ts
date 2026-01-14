/**
 * Tap小游戏转换器 - TypeScript版本
 * 用途：替代Python脚本，实现微信小游戏到Tap小游戏的转换
 * 无需Python环境，完全基于Node.js
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import archiver from 'archiver';
import { spawn } from 'child_process';

const CONVERTER_VERSION = "2.0.4-ts";
const DEFAULT_COMPANY = "DefaultCompany";
const DEFAULT_PRODUCT = "My Project";
const DEFAULT_VERSION = "0.1";

let COVERVIEW_CUSTOMIZED = false;

interface ConvertOptions {
    source: string;      // 微信小游戏路径
    target: string;      // Tap小游戏输出路径
    useSubpackage?: boolean;  // 是否分包
}

interface GameConfig {
    deviceOrientation?: string;
    orientation?: string;
    companyName?: string;
    productName?: string;
    productVersion?: string;
    convertScriptVersion?: string;
    coverviewCustomized?: boolean;
    plugins?: Record<string, any>;
    subPackages?: any[];
    subpackages?: any[];
    [key: string]: any;
}

/**
 * 步骤1: 验证源路径
 */
function validateSourcePath(sourcePath: string): void {
    if (!fs.existsSync(sourcePath)) {
        throw new Error(`源路径不存在: ${sourcePath}`);
    }
    console.log('[Tap小游戏] ✓ 源路径验证通过:', sourcePath);
}

/**
 * 步骤2: 创建目标路径
 */
function ensureTargetPath(targetPath: string): string {
    const targetParent = targetPath;
    const gameDir = path.join(targetParent, 'game');

    // 如果目标目录存在且不为空，先删除
    if (fs.existsSync(targetParent)) {
        console.log('[Tap小游戏] 删除旧的目标目录...');
        fs.removeSync(targetParent);
    }

    // 创建目录
    fs.ensureDirSync(gameDir);
    console.log('[Tap小游戏] ✓ 创建目标目录:', gameDir);

    return gameDir;
}

/**
 * 步骤3: 复制文件（排除特定文件）
 */
function copyAssets(source: string, target: string): void {
    console.log('[Tap小游戏] 复制文件...');

    // 复制文件，排除 .* __pycache__ *.meta *.bak
    fs.copySync(source, target, {
        filter: (src: string) => {
            const basename = path.basename(src);
            // 排除隐藏文件、meta文件、备份文件、缓存目录
            if (basename.startsWith('.')) return false;
            if (basename === '__pycache__') return false;
            if (basename.endsWith('.meta')) return false;
            if (basename.endsWith('.bak')) return false;
            return true;
        }
    });

    console.log('[Tap小游戏] ✓ 文件复制完成');
}

/**
 * 步骤4: 处理game.json配置
 */
function handleGameConfig(targetFolder: string): GameConfig {
    console.log('[Tap小游戏] 处理game.json配置...');

    let configPath = path.join(targetFolder, 'game.json');

    // 如果game.json不存在，尝试manifest.json
    if (!fs.existsSync(configPath)) {
        configPath = path.join(targetFolder, 'manifest.json');
        if (!fs.existsSync(configPath)) {
            throw new Error('缺少game.json或manifest.json配置文件');
        }
    }

    // 读取配置
    const config: GameConfig = fs.readJsonSync(configPath);

    // 更新配置
    config.companyName = DEFAULT_COMPANY;
    config.productName = DEFAULT_PRODUCT;
    config.productVersion = DEFAULT_VERSION;
    config.convertScriptVersion = CONVERTER_VERSION;

    // 记录coverviewCustomized设置
    COVERVIEW_CUSTOMIZED = config.coverviewCustomized || false;

    // 处理orientation字段
    if (config.orientation) {
        config.deviceOrientation = config.orientation;
        delete config.orientation;
    }

    // 写回配置
    fs.writeJsonSync(configPath, config, { spaces: 2, encoding: 'utf-8' });

    console.log('[Tap小游戏] 游戏配置:');
    console.log('  companyName:', config.companyName);
    console.log('  productName:', config.productName);
    console.log('  productVersion:', config.productVersion);
    console.log('[Tap小游戏] ✓ 配置处理完成');

    return config;
}

/**
 * 步骤5: 复制插件文件
 */
function copyPlugins(targetFolder: string, config: GameConfig, converterDir: string): void {
    console.log('[Tap小游戏] 复制插件文件...');

    const plugins = config.plugins || {};
    const cacheDir = path.join(converterDir, 'wx_unity_converter');

    for (const [pluginName, pluginInfo] of Object.entries(plugins)) {
        const version = (pluginInfo as any).version;
        const provider = (pluginInfo as any).provider;

        // 处理UnityPlugin
        if (pluginName === 'UnityPlugin') {
            handleUnityPlugin(targetFolder, converterDir);
            continue;
        }

        // 处理特殊插件（不需要版本号）
        let pluginPath: string;
        if (['MinigameLoading', 'MiniGameCommon', 'MiniGameCenter'].includes(pluginName)) {
            pluginPath = path.join(cacheDir, pluginName);
        } else {
            pluginPath = path.join(cacheDir, `${pluginName}-${version}`);
        }

        // 复制插件
        if (fs.existsSync(pluginPath)) {
            const targetPluginDir = path.join(targetFolder, 'cachedPlugin', pluginName);
            copyCachedPlugin(pluginPath, targetPluginDir);
            console.log('  ✓ 复制插件:', pluginName);
        } else {
            console.log('  - 跳过不支持的插件:', pluginName);
        }
    }

    console.log('[Tap小游戏] ✓ 插件复制完成');
}

/**
 * 复制缓存的插件目录
 */
function copyCachedPlugin(source: string, target: string): void {
    if (fs.existsSync(target)) {
        fs.removeSync(target);
    }
    fs.copySync(source, target);
}

/**
 * 处理UnityPlugin
 */
function handleUnityPlugin(targetFolder: string, converterDir: string): void {
    const pluginDir = path.join(targetFolder, 'cachedPlugin', 'UnityPlugin');
    fs.ensureDirSync(pluginDir);

    const defaultPlugin = path.join(converterDir, 'libs', 'UnityPlugin', 'dist', 'index.js');
    if (!fs.existsSync(defaultPlugin)) {
        throw new Error('UnityPlugin不存在: ' + defaultPlugin);
    }

    fs.copySync(defaultPlugin, path.join(pluginDir, 'index.js'));
    console.log('  ✓ 复制UnityPlugin');
}

/**
 * 步骤6: 运行Babel转换
 */
async function runBabelTransform(targetFolder: string, converterDir: string): Promise<void> {
    console.log('[Tap小游戏] 运行Babel转换...');

    // 检查是否已经转换过
    const babelDir = path.join(targetFolder, '@babel');
    if (fs.existsSync(babelDir)) {
        console.log('[Tap小游戏] ✓ Babel已转换，跳过');
        return;
    }

    // 执行Babel转换
    const babelrcPath = path.join(converterDir, '.babelrc');
    const babelCmd = `npx babel --config-file "${babelrcPath}" "${targetFolder}" -d "${targetFolder}"`;

    console.log('[Tap小游戏] 执行Babel命令...');

    await new Promise<void>((resolve, reject) => {
        const child = spawn('npx', ['babel', '--config-file', babelrcPath, targetFolder, '-d', targetFolder], {
            cwd: converterDir,
            stdio: 'pipe'
        });

        child.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) console.log('[Babel]', output);
        });

        child.stderr.on('data', (data) => {
            const output = data.toString().trim();
            if (output) console.log('[Babel]', output);
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('[Tap小游戏] ✓ Babel转换完成');
                resolve();
            } else {
                reject(new Error(`Babel转换失败，退出码: ${code}`));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * 步骤7: 注入运行时代码到game.js
 */
function injectRuntimeCode(targetFolder: string, converterDir: string): void {
    console.log('[Tap小游戏] 注入运行时代码...');

    const gameJsPath = path.join(targetFolder, 'game.js');
    if (!fs.existsSync(gameJsPath)) {
        throw new Error('game.js不存在');
    }

    const injectionFile = path.join(converterDir, 'wx_unity_converter', 'wx_unity.js');
    if (!fs.existsSync(injectionFile)) {
        console.log('[Tap小游戏] ⚠️ wx_unity.js不存在，跳过注入');
        return;
    }

    const injectionCode = fs.readFileSync(injectionFile, 'utf-8');
    const originalContent = fs.readFileSync(gameJsPath, 'utf-8');

    const newContent = `/* Unity Converter Injection */\n${injectionCode}\n${originalContent}`;
    fs.writeFileSync(gameJsPath, newContent, 'utf-8');

    console.log('[Tap小游戏] ✓ 运行时代码注入完成');
}

/**
 * 步骤8: 处理wasm-split.js
 */
function handleWasmSplit(targetFolder: string): void {
    console.log('[Tap小游戏] 处理WASM兼容性...');

    const wasmSplitPath = path.join(targetFolder, 'wasm-split.js');
    if (!fs.existsSync(wasmSplitPath)) {
        console.log('[Tap小游戏] - wasm-split.js不存在，跳过');
        return;
    }

    console.log('[Tap小游戏] 处理wasm-split.js替换...');

    let content = fs.readFileSync(wasmSplitPath, 'utf-8');

    // 替换字符串
    const replacements = [
        { old: 'GameGlobal.isIOSHighPerformanceMode', new: '__rep_isIOSHighPerformanceMode' },
        { old: 'GameGlobal.canUseH5Renderer', new: '__rep_canUseH5Renderer' }
    ];

    let replacedCount = 0;
    let prependCode = '';

    for (const { old, new: newStr } of replacements) {
        if (content.includes(old)) {
            content = content.replace(new RegExp(old, 'g'), newStr);
            prependCode += `var ${newStr} = false;\n`;
            replacedCount++;
            console.log(`  - 替换: ${old} -> ${newStr}`);
        }
    }

    // 如果有替换，添加变量声明到文件开头
    if (replacedCount > 0) {
        content = prependCode + content;
        fs.writeFileSync(wasmSplitPath, content, 'utf-8');
    }

    console.log(`[Tap小游戏] ✓ WASM处理完成，替换了${replacedCount}个模式`);
}

/**
 * 步骤9: 处理coverviewCustomized
 */
function handleCustomizedCoverview(targetFolder: string): void {
    console.log('[Tap小游戏] 处理coverviewCustomized设置...');

    const indexJsPath = path.join(targetFolder, 'cachedPlugin', 'UnityPlugin', 'index.js');
    if (!fs.existsSync(indexJsPath)) {
        console.log('[Tap小游戏] - UnityPlugin/index.js不存在，跳过');
        return;
    }

    const coverviewValue = COVERVIEW_CUSTOMIZED ? 'true' : 'false';
    const coverviewCode = `GameGlobal.pluginEnv.coverviewCustomized = ${coverviewValue};`;

    const originalContent = fs.readFileSync(indexJsPath, 'utf-8');
    const newContent = `${coverviewCode}\n${originalContent}`;
    fs.writeFileSync(indexJsPath, newContent, 'utf-8');

    console.log('[Tap小游戏] ✓ coverviewCustomized设置完成');
}

/**
 * 步骤10: 复制check-version.js
 */
function copyVersionChecker(targetFolder: string, converterDir: string): void {
    console.log('[Tap小游戏] 复制版本检查文件...');

    const sourceFile = path.join(converterDir, 'wx_unity_converter', 'check-version.js');
    const targetFile = path.join(targetFolder, 'check-version.js');

    if (fs.existsSync(sourceFile)) {
        fs.copySync(sourceFile, targetFile);
        console.log('[Tap小游戏] ✓ 版本检查文件复制完成');
    } else {
        console.log('[Tap小游戏] - check-version.js不存在，跳过');
    }
}

/**
 * 步骤11: 打包成ZIP
 */
async function packGame(targetFolder: string, config: GameConfig, useSubpackage: boolean): Promise<void> {
    console.log('[Tap小游戏] 创建ZIP包...');

    const targetParent = path.dirname(targetFolder);
    const mainZipPath = path.join(targetParent, 'game.zip');

    // 删除旧的zip文件
    if (fs.existsSync(mainZipPath)) {
        fs.removeSync(mainZipPath);
    }

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(mainZipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // 最大压缩
        });

        output.on('close', () => {
            const sizeBytes = archive.pointer();
            const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
            console.log(`[Tap小游戏] ✓ game.zip创建完成: ${sizeMB} MB`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        // 添加game目录下的所有文件
        archive.directory(targetFolder, false);

        archive.finalize();
    });
}

/**
 * 主转换流程
 */
export async function convertWechatToTap(options: ConvertOptions): Promise<void> {
    console.log('\n=== Tap小游戏转换器 (TypeScript版本) ===\n');

    const converterDir = path.join(__dirname, '..', 'converter');

    try {
        // 1. 验证路径
        console.log('[1/10] 验证路径...');
        validateSourcePath(options.source);
        const targetFolder = ensureTargetPath(options.target);

        // 2. 复制文件
        console.log('\n[2/10] 复制项目文件...');
        copyAssets(options.source, targetFolder);

        // 3. 处理配置
        console.log('\n[3/10] 处理game.json配置...');
        const config = handleGameConfig(targetFolder);

        // 4. 复制插件
        console.log('\n[4/10] 注入插件...');
        copyPlugins(targetFolder, config, converterDir);

        // 5. Babel转换
        console.log('\n[5/10] 运行Babel转换...');
        await runBabelTransform(targetFolder, converterDir);

        // 6. 注入运行时代码
        console.log('\n[6/10] 注入运行时代码...');
        injectRuntimeCode(targetFolder, converterDir);

        // 7. 处理WASM
        console.log('\n[7/10] 处理WASM兼容性...');
        handleWasmSplit(targetFolder);

        // 8. 处理Coverview
        console.log('\n[8/10] 处理coverviewCustomized设置...');
        handleCustomizedCoverview(targetFolder);

        // 9. 复制版本检查
        console.log('\n[9/10] 复制版本检查文件...');
        copyVersionChecker(targetFolder, converterDir);

        // 10. 打包ZIP
        console.log('\n[10/10] 创建分发包...');
        await packGame(targetFolder, config, options.useSubpackage || false);

        console.log('\n✅ 转换完成！');
        console.log('输出目录:', options.target);

    } catch (error: any) {
        console.error('\n❌ 转换失败:', error.message);
        throw error;
    }
}
