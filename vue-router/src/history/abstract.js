import { History } from './base';
import { NavigationDuplicated } from './errors';
import { isExtendedError } from '../util/warn';

export class AbstractHistory extends History {
    /**
     *构造函数
     * @param {*} router `VueRouter`实例对象
     * @param {string} base 基路径
     */
    constructor(router, base) {
        super(router, base);
        this.stack = [];
        this.index = -1;
    }

    /**
     * 添加 新的历史记录，并跳转
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    push(location, onComplete, onAbort) {
        this.transitionTo(
            location,
            (route) => {
                // 添加到栈尾部
                this.stack = this.stack.slice(0, this.index + 1).concat(route);
                this.index++;
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    /**
     * 修改 当前历史记录，并跳转
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    replace(location, onComplete, onAbort) {
        this.transitionTo(
            location,
            (route) => {
                // 替换 栈尾的数据
                this.stack = this.stack.slice(0, this.index).concat(route);
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    /**
     * 加载对应的历史记录
     * @param {numbre} n 跳转历史记录的位置
     */
    go(n) {
        const targetIndex = this.index + n;

        // 跳过不在范围内的
        if (targetIndex < 0 || targetIndex >= this.stack.length) {
            return;
        }

        // 获取当前栈
        const route = this.stack[targetIndex];
        this.confirmTransition(
            route,
            () => {
                // 更新栈的下标（可以删除无效的栈）
                this.index = targetIndex;
                this.updateRoute(route);
            },
            (err) => {
                if (isExtendedError(NavigationDuplicated, err)) {
                    this.index = targetIndex;
                }
            }
        );
    }

    // 获取当前地址
    getCurrentLocation() {
        const current = this.stack[this.stack.length - 1];
        return current ? current.fullPath : '/';
    }

    // 确保路径相同（空内容，不处理）
    ensureURL() {}
}
