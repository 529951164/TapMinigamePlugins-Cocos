/**
 * Tap小游戏构建扩展
 * 用途：在Cocos Creator中添加构建Tap小游戏的功能
 */

export function load() {
    console.log('[Tap小游戏] 扩展已加载');
}

export function unload() {
    console.log('[Tap小游戏] 扩展已卸载');
}

export const methods = {
    onBuildTapGame() {
        console.log('[Tap小游戏] 点击了构建Tap小游戏菜单');
        Editor.Dialog.info('成功', {
            title: 'Tap小游戏',
            detail: '菜单功能正常！下一步将实现构建功能。'
        });
    }
};
