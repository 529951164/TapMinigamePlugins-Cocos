// Cocos Creator 编辑器全局类型声明
declare namespace Editor {
    namespace Dialog {
        function info(message: string, options?: {
            title?: string;
            detail?: string;
            buttons?: string[];
        }): void;
        function error(message: string, options?: {
            title?: string;
            detail?: string;
            buttons?: string[];
        }): void;
    }
}
