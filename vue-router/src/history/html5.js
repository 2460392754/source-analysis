import { History } from './base';
import { cleanPath } from '../util/path';
import { START } from '../util/route';
import { setupScroll, handleScroll } from '../util/scroll';
import { pushState, replaceState, supportsPushState } from '../util/push-state';

export class HTML5History extends History {
    /**
     * 构造函数
     * @param {Object} router `VueRouter`实例对象
     * @param {string|undefined} base 基路径
     */
    constructor(router, base) {
        // 运行父类的构造函数
        super(router, base);

        // 缩短变量名
        const expectScroll = router.options.scrollBehavior;

        // 是否支持`history`, 且开发者配置中添加了`scrollBehavior`函数
        const supportsScroll = supportsPushState && expectScroll;

        // `supportsScroll`为真值，就设置滚动条
        if (supportsScroll) {
            setupScroll();
        }

        // 初始化 完整路径
        const initLocation = getLocation(this.base);

        // 绑定事件
        window.addEventListener('popstate', (e) => {
            const current = this.current;
            const location = getLocation(this.base);

            // 如果 路由是初始状态，且路径也没有发生改变 就停止继续运行函数
            if (this.current === START && location === initLocation) {
                return;
            }

            // 调用父类的路由跳转
            this.transitionTo(location, (route) => {
                if (supportsScroll) {
                    handleScroll(router, route, current, true);
                }
            });
        });
    }

    /**
     * 加载对应的历史记录
     * @param {numbre} n 跳转历史记录的位置
     */
    go(n) {
        window.history.go(n);
    }

    /**
     * 添加 新的历史记录，并跳转
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    push(location, onComplete, onAbort) {
        const { current: fromRoute } = this;

        // 调用父类的路由跳转
        this.transitionTo(
            location,
            (route) => {
                // 添加新记录
                pushState(cleanPath(this.base + route.fullPath));
                // 处理滚动条
                handleScroll(this.router, route, fromRoute, false);
                // 运行回调函数
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    /**
     * 修改 当前历史记录
     * @param {*} location
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    replace(location, onComplete, onAbort) {
        const { current: fromRoute } = this;

        // 调用父类的路由跳转
        this.transitionTo(
            location,
            (route) => {
                // 修改新记录
                replaceState(cleanPath(this.base + route.fullPath));
                // 处理滚动条
                handleScroll(this.router, route, fromRoute, false);
                // 运行回调函数
                onComplete && onComplete(route);
            },
            onAbort
        );
    }

    /**
     * 确保路径相同
     * @param {undefined|boolean} push 是添加新历史记录或修改记录
     */
    ensureURL(push) {
        // 判断 当前路由的完整路径（路径 + params参数 + hash路径） 是否和 开发者填写的`base`参数相同
        // 避免修改的路径和当前路由路径相同
        if (getLocation(this.base) !== this.current.fullPath) {
            // 路径拼接，并格式化
            const current = cleanPath(this.base + this.current.fullPath);

            // 添加或更新历史记录
            push ? pushState(current) : replaceState(current);
        }
    }

    // 获取当前地址
    getCurrentLocation() {
        return getLocation(this.base);
    }
}

/**
 * 获取 完整地址（路径 + params参数 + hash路径）
 * @param {string} base 基路径
 * @return {string}
 */
export function getLocation(base) {
    // 获取 URL中PATH的URI解码后的字符串
    let path = decodeURI(window.location.pathname);

    // `base`为 真值，URL中有`base`字符串，且`base`是位于路径的头部字符串
    if (base && path.indexOf(base) === 0) {
        // PATH中删除`base`字符串后的字符串
        path = path.slice(base.length);
    }

    // path设置默认值（URL中没有路径只有域名）
    return (path || '/') + window.location.search + window.location.hash;
}
