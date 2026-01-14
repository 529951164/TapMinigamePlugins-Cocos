"use strict";
/**
 * Tap小游戏构建钩子
 * 用途：在构建完成后自动调用TypeScript转换器
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBeforeBuild = onBeforeBuild;
exports.onAfterBuild = onAfterBuild;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const converter_ts_1 = require("./converter-ts");
async function onBeforeBuild(options) {
    console.log('[Tap小游戏] 开始构建微信小游戏...');
    // 检查是否启用了Tap转换
    const enableTapConvert = options.packages?.['tap-minigame']?.enableTapConvert;
    if (enableTapConvert) {
        console.log('[Tap小游戏] 已启用Tap小游戏转换');
    }
}
async function onAfterBuild(options, result) {
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
        await (0, converter_ts_1.convertWechatToTap)({
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
        }
        else {
            console.warn('[Tap小游戏] ⚠️ game.zip未生成');
        }
        // 不弹出对话框，只在控制台输出
    }
    catch (error) {
        console.error('[Tap小游戏] ❌ 转换失败:', error);
        console.error('[Tap小游戏] 错误详情:', error.message);
        // 只在真正失败时弹出简短提示
        Editor.Dialog.error('Tap小游戏转换失败，请查看控制台日志', {
            title: 'Tap小游戏',
            buttons: ['确定']
        });
    }
}
