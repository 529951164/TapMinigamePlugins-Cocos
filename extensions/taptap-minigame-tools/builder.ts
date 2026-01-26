/**
 * Tap小游戏构建插件配置
 * 用途：扩展微信小游戏构建，添加Tap小游戏转换功能
 */

export const configs = {
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
            usePythonScript: {
                label: '强制使用Python脚本',
                description: '跳过TypeScript转换器，直接使用Python脚本（需要本地安装Python 3.6+）',
                default: false,
                render: {
                    ui: 'ui-checkbox',
                },
            },
        },
    },
};

// Cocos Creator需要的空处理器
export const assetHandlers = './asset-handlers';
