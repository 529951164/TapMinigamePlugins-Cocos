/**
 * Tap小游戏构建钩子
 * 用途：在构建完成后自动调用TypeScript转换器
 */

import * as fs from 'fs';
import * as path from 'path';
import { convertWechatToTap } from './converter-ts';

export async function onBeforeBuild(options: any) {
    console.log('[Tap小游戏] 开始构建微信小游戏...');

    // 检查是否启用了Tap转换
    const enableTapConvert = options.packages?.['tap-minigame']?.enableTapConvert;
    if (enableTapConvert) {
        console.log('[Tap小游戏] 已启用Tap小游戏转换');
    }
}

export async function onAfterBuild(options: any, result: any) {
    console.log('[Tap小游戏] 微信小游戏构建完成！');

    // 检查是否启用了Tap转换
    const tapOptions = options.packages?.['tap-minigame'];
    if (!tapOptions || !tapOptions.enableTapConvert) {
        console.log('[Tap小游戏] 未启用Tap转换，跳过');
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

        console.log('[Tap小游戏] 开始执行TypeScript转换器...');

        // 调用TypeScript转换器
        await convertWechatToTap({
            source: wechatBuildPath,
            target: tapBuildPath,
            useSubpackage: false
        });

        console.log('[Tap小游戏] ✅ 转换完成！');

        // 验证zip文件是否生成
        const gameZipPath = path.join(tapBuildPath, 'game.zip');
        if (fs.existsSync(gameZipPath)) {
            const stats = fs.statSync(gameZipPath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log('[Tap小游戏] game.zip已生成:', gameZipPath);
            console.log('[Tap小游戏] 文件大小:', sizeMB, 'MB');
        } else {
            console.warn('[Tap小游戏] ⚠️ game.zip未生成');
        }

        // 不弹出对话框，只在控制台输出

    } catch (error: any) {
        console.error('[Tap小游戏] ❌ 转换失败:', error);
        console.error('[Tap小游戏] 错误详情:', error.message);

        // 只在真正失败时弹出简短提示
        Editor.Dialog.error('Tap小游戏转换失败，请查看控制台日志', {
            title: 'Tap小游戏',
            buttons: ['确定']
        });
    }
}
