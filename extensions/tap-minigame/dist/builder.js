"use strict";
/**
 * Tap小游戏构建插件配置
 * 用途：扩展微信小游戏构建，添加Tap小游戏转换功能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetHandlers = exports.configs = void 0;
exports.configs = {
    'wechatgame': {
        hooks: './hooks',
        options: {
            enableTapConvert: {
                label: '转换为Tap小游戏',
                description: '构建完成后自动转换为Tap小游戏格式',
                default: false,
                render: {
                    ui: 'ui-checkbox',
                },
            },
            tapAppid: {
                label: 'Tap小游戏AppID',
                description: '请输入Tap小游戏的AppID',
                default: '',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: '请输入Tap小游戏AppID',
                    },
                },
            },
        },
    },
};
// Cocos Creator需要的空处理器
exports.assetHandlers = './asset-handlers';
