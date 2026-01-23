/**
 * Tap小游戏构建钩子
 * 用途：在构建完成后自动调用TypeScript转换器
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertWechatToTap } from './converter-ts';
import { spawn } from 'child_process';

/**
 * 检查Node.js版本是否兼容
 */
function checkNodeVersionCompatibility(): { compatible: boolean; version: string; message: string } {
    const nodeVersion = process.version; // e.g., "v14.17.0"
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

    if (majorVersion < 12) {
        return {
            compatible: false,
            version: nodeVersion,
            message: `Node.js版本过低（${nodeVersion}），需要12.0或更高版本。\n\n请升级Cocos Creator到3.8.0或更高版本。`
        };
    }

    return {
        compatible: true,
        version: nodeVersion,
        message: `Node.js版本兼容（${nodeVersion}）`
    };
}

/**
 * 检查Python环境是否可用
 */
async function checkPythonAvailable(): Promise<{ available: boolean; version: string }> {
    return new Promise((resolve) => {
        try {
            const python = process.platform === 'win32' ? 'python' : 'python3';
            const child = spawn(python, ['--version'], { stdio: 'pipe' });

            let output = '';
            let resolved = false;

            child.stdout.on('data', (data) => { output += data.toString(); });
            child.stderr.on('data', (data) => { output += data.toString(); });

            child.on('close', (code) => {
                if (resolved) return;
                resolved = true;
                if (code === 0 && output.includes('Python')) {
                    resolve({ available: true, version: output.trim() });
                } else {
                    resolve({ available: false, version: '' });
                }
            });

            child.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                console.log('[Tap小游戏] Python检测出错:', error.message);
                resolve({ available: false, version: '' });
            });

            // 超时处理
            setTimeout(() => {
                if (resolved) return;
                resolved = true;
                try {
                    child.kill();
                } catch (e) {
                    // 忽略kill错误
                }
                resolve({ available: false, version: '' });
            }, 3000);
        } catch (error: any) {
            // spawn本身可能失败
            console.log('[Tap小游戏] Python检测失败:', error.message);
            resolve({ available: false, version: '' });
        }
    });
}

/**
 * 构建前环境检查
 */
async function checkEnvironment(): Promise<{ ok: boolean; message: string; hasPythonFallback: boolean }> {
    console.log('[Tap小游戏] ========================================');
    console.log('[Tap小游戏] 🔍 开始环境检查...');
    console.log('[Tap小游戏] ========================================');

    // 1. 检查Node.js版本
    const nodeCheck = checkNodeVersionCompatibility();
    console.log('[Tap小游戏] Node.js版本:', nodeCheck.version);

    if (!nodeCheck.compatible) {
        console.log('[Tap小游戏] ❌ Node.js版本不兼容');

        // 检查是否有Python保底
        console.log('[Tap小游戏] 检查Python保底方案...');
        const pythonCheck = await checkPythonAvailable();

        if (pythonCheck.available) {
            console.log('[Tap小游戏] ✓ 检测到Python环境:', pythonCheck.version);
            console.log('[Tap小游戏] 将使用Python脚本作为保底方案');
            return {
                ok: true, // 有保底方案，可以继续
                message: `Node.js版本不兼容，但检测到${pythonCheck.version}，将使用Python脚本进行转换。`,
                hasPythonFallback: true
            };
        } else {
            console.log('[Tap小游戏] ❌ 未检测到Python环境');
            return {
                ok: false,
                message: nodeCheck.message + '\n\n备选方案：安装Python 3.6+作为保底转换工具。',
                hasPythonFallback: false
            };
        }
    }

    console.log('[Tap小游戏] ✓ Node.js版本兼容');

    // 2. 检查converter目录
    const converterDir = path.join(__dirname, 'converter');
    const packageJsonPath = path.join(converterDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        console.log('[Tap小游戏] ❌ 转换器配置文件缺失');
        return {
            ok: false,
            message: '插件安装不完整，缺少转换器配置文件。\n\n请重新安装插件。',
            hasPythonFallback: false
        };
    }

    console.log('[Tap小游戏] ✓ 转换器配置文件完整');
    console.log('[Tap小游戏] ========================================');
    console.log('[Tap小游戏] ✅ 环境检查通过');
    console.log('[Tap小游戏] ========================================');

    return {
        ok: true,
        message: '环境检查通过',
        hasPythonFallback: false
    };
}

export async function onBeforeBuild(options: any) {
    try {
        console.log('[Tap小游戏] 开始构建微信小游戏...');

        // 检查是否启用了Tap转换
        const tapOptions = options.packages?.['taptap-minigame-tools'];
        if (!tapOptions || !tapOptions.enableTapConvert) {
            console.log('[Tap小游戏] 未启用Tap转换，跳过环境检查');
            return;
        }

        console.log('[Tap小游戏] 已启用Tap小游戏转换');

        // ⚠️ 关键：构建前环境检查
        try {
            const envCheck = await checkEnvironment();

            if (!envCheck.ok) {
                // 环境不满足，记录警告（不阻止构建，在转换时处理）
                console.log('[Tap小游戏] ========================================');
                console.log('[Tap小游戏] ⚠️  环境检查警告');
                console.log('[Tap小游戏] ========================================');
                console.log('[Tap小游戏]', envCheck.message);
                console.log('[Tap小游戏] ========================================');
                console.log('[Tap小游戏] 将继续构建，但转换可能失败');
                console.log('[Tap小游戏] 请查看上述警告信息并安装必要的环境');
                console.log('[Tap小游戏] ========================================');
            } else if (envCheck.hasPythonFallback) {
                // 有Python保底，记录信息
                console.log('[Tap小游戏] ⚠️ ', envCheck.message);
            } else {
                console.log('[Tap小游戏] ✓ 环境检查通过');
            }
        } catch (checkError: any) {
            // 环境检查本身出错，记录但不阻止构建
            console.log('[Tap小游戏] ⚠️  环境检查遇到错误:', checkError.message);
            console.log('[Tap小游戏] 将继续构建，如果转换失败会自动尝试Python保底方案');
        }

    } catch (error: any) {
        // 最外层捕获，确保不会因为钩子失败导致构建崩溃
        console.log('[Tap小游戏] onBeforeBuild钩子执行出错:', error.message);
        console.log('[Tap小游戏] 将继续构建，但可能需要手动处理转换');
    }
}

/**
 * 使用Python脚本进行转换（保底方案）
 */
async function convertWithPython(wechatBuildPath: string, tapBuildPath: string): Promise<void> {
    console.log('[Tap小游戏] ========================================');
    console.log('[Tap小游戏] 🐍 使用Python脚本进行转换');
    console.log('[Tap小游戏] ========================================');

    const converterDir = path.join(__dirname, 'converter');
    const pythonScript = path.join(converterDir, 'wx_converter.py');

    // 检查Python脚本是否存在
    if (!fs.existsSync(pythonScript)) {
        throw new Error('Python转换脚本不存在: ' + pythonScript);
    }

    const python = process.platform === 'win32' ? 'python' : 'python3';

    return new Promise((resolve, reject) => {
        console.log('[Tap小游戏] 执行Python脚本:', pythonScript);
        console.log('[Tap小游戏] 源路径:', wechatBuildPath);
        console.log('[Tap小游戏] 目标路径:', tapBuildPath);

        const child = spawn(python, [
            pythonScript,
            '--source', wechatBuildPath,
            '--target', tapBuildPath
        ], {
            cwd: converterDir,
            stdio: 'pipe'
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const output = data.toString();
            stdout += output;
            console.log('[Python]', output.trim());
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            console.log('[Python]', output.trim());
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('[Tap小游戏] ✓ Python转换完成');
                resolve();
            } else {
                console.log('[Tap小游戏] ✗ Python转换失败，退出码:', code);
                reject(new Error(`Python转换失败（退出码: ${code}）\n${stderr || stdout}`));
            }
        });

        child.on('error', (error) => {
            console.log('[Tap小游戏] ✗ Python脚本执行失败:', error.message);
            reject(new Error(`Python脚本执行失败: ${error.message}`));
        });
    });
}

export async function onAfterBuild(options: any, result: any) {
    console.log('[Tap小游戏] 微信小游戏构建完成！');

    // 检查是否启用了Tap转换
    const tapOptions = options.packages?.['taptap-minigame-tools'];
    if (!tapOptions || !tapOptions.enableTapConvert) {
        console.log('[Tap小游戏] 未启用Tap转换，跳过');
        console.log('[Tap小游戏] 调试信息 - packages:', Object.keys(options.packages || {}));
        return;
    }

    console.log('[Tap小游戏] 开始转换为Tap小游戏...');

    try {
        // 获取微信小游戏构建路径
        const wechatBuildPath = result.dest;
        console.log('[Tap小游戏] 微信小游戏路径:', wechatBuildPath);

        // 创建TapBuild目录（与微信小游戏目录同级）
        const buildDir = path.dirname(wechatBuildPath);
        const tapBuildPath = path.join(buildDir, 'TapBuild');

        // 如果TapBuild目录存在，先删除
        if (fs.existsSync(tapBuildPath)) {
            console.log('[Tap小游戏] 删除旧的TapBuild目录...');
            fs.rmSync(tapBuildPath, { recursive: true, force: true });
        }

        // 创建新的TapBuild目录
        fs.mkdirSync(tapBuildPath, { recursive: true });
        console.log('[Tap小游戏] 创建TapBuild目录:', tapBuildPath);

        let conversionSuccess = false;
        let tsError: Error | null = null;

        // 尝试1: 使用TypeScript转换器
        try {
            console.log('[Tap小游戏] ========================================');
            console.log('[Tap小游戏] 📦 尝试使用TypeScript转换器...');
            console.log('[Tap小游戏] ========================================');

            await convertWechatToTap({
                source: wechatBuildPath,
                target: tapBuildPath,
                useSubpackage: false
            });

            conversionSuccess = true;
            console.log('[Tap小游戏] ✅ TypeScript转换器执行成功');

        } catch (error: any) {
            tsError = error;
            console.log('[Tap小游戏] ========================================');
            console.log('[Tap小游戏] ⚠️  TypeScript转换器执行失败');
            console.log('[Tap小游戏] ========================================');
            console.log('[Tap小游戏] 错误信息:', error.message);

            // 尝试2: 使用Python保底方案
            try {
                console.log('[Tap小游戏] 🔄 切换到Python保底方案...');

                await convertWithPython(wechatBuildPath, tapBuildPath);

                conversionSuccess = true;
                console.log('[Tap小游戏] ✅ Python保底方案执行成功');

            } catch (pythonError: any) {
                console.log('[Tap小游戏] ❌ Python保底方案也失败了');
                console.log('[Tap小游戏] Python错误:', pythonError.message);

                // 两种方案都失败，抛出详细错误
                throw new Error(
                    `转换失败！\n\n` +
                    `TypeScript转换器错误：\n${error.message}\n\n` +
                    `Python保底方案错误：\n${pythonError.message}`
                );
            }
        }

        if (conversionSuccess) {
            console.log('[Tap小游戏] ========================================');
            console.log('[Tap小游戏] ✅ 转换完成！');
            console.log('[Tap小游戏] ========================================');

            // 验证zip文件是否生成
            const gameZipPath = path.join(tapBuildPath, 'game.zip');
            if (fs.existsSync(gameZipPath)) {
                const stats = fs.statSync(gameZipPath);
                const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
                console.log('[Tap小游戏] game.zip已生成:', gameZipPath);
                console.log('[Tap小游戏] 文件大小:', sizeMB, 'MB');
            } else {
                console.log('[Tap小游戏] ⚠️  game.zip未生成');
            }

            // 如果使用了Python保底方案，给用户提示
            if (tsError) {
                Editor.Dialog.info(
                    'TypeScript转换器失败，已自动使用Python保底方案完成转换。\n\n建议升级Cocos Creator以获得更好的性能。',
                    {
                        title: 'Tap小游戏 - 使用了保底方案',
                        buttons: ['确定']
                    }
                );
            }
        }

    } catch (error: any) {
        console.log('[Tap小游戏] ========================================');
        console.log('[Tap小游戏] ❌ 转换失败');
        console.log('[Tap小游戏] ========================================');
        console.log('[Tap小游戏] 错误详情:', error.message);

        // 弹出错误提示
        Editor.Dialog.error(
            '转换失败，请查看控制台日志获取详细信息。\n\n' + error.message,
            {
                title: 'Tap小游戏',
                buttons: ['确定']
            }
        );

        throw error;
    }
}
