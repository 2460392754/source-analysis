import { History } from './base';
import { cleanPath } from '../util/path';
import { getLocation } from './html5';
import { setupScroll, handleScroll } from '../util/scroll';
import { pushState, replaceState, supportsPushState } from '../util/push-state';

export class HashHistory extends History {
    /**
     * 构造函数
     * @param {*} router `VueRouter`实例对象
     * @param {string} base 基路径
     * @param {Boolean} fallback
     */
    constructor(router, base, fallback) {
        // 运行父类的构造函数
        super(router, base);

        //// check history fallback deeplinking
        // 运行环境不兼容其他路由模式被切换到`hash`模式，并验证地址
        if (fallback && checkFallback(this.base)) {
            return;
        }

        ensureSlash();
    }

    //// this is delayed until the app mounts
    //// to avoid the hashchange listener being fired too early
    /**
     * 设置监听事件
     */
    setupListeners() {
        const router = this.router;

        // 缩短变量名
        const expectScroll = router.options.scrollBehavior;

        // 是否支持`history`, 且开发者配置中添加了`scrollBehavior`函数
        const supportsScroll = supportsPushState && expectScroll;

        // `supportsScroll`为真值，就设置滚动条
        if (supportsScroll) {
            setupScroll();
        }

        // 根据浏览器兼容性绑定不同的事件
        window.addEventListener(supportsPushState ? 'popstate' : 'hashchange', () => {
            const current = this.current;

            // 确保路径是已斜杠开头
            if (!ensureSlash()) {
                return;
            }

            this.transitionTo(getHash(), (route) => {
                // 处理滚动条
                if (supportsScroll) {
                    handleScroll(this.router, route, current, true);
                }

                // 浏览器不兼容路由的push方法，则切换repalce
                if (!supportsPushState) {
                    replaceHash(route.fullPath);
                }
            });
        });
    }

    /**
     * 添加 新的历史记录，并跳转
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    push(location, onComplete, onAbort) {
        const { current: fromRoute } = this;
        this.transitionTo(
            location,
            (route) => {
                // 添加新记录
                pushHash(route.fullPath);
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
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    replace(location, onComplete, onAbort) {
        const { current: fromRoute } = this;
        this.transitionTo(
            location,
            (route) => {
                // 添加新记录
                replaceHash(route.fullPath);
                // 处理滚动条
                handleScroll(this.router, route, fromRoute, false);
                // 运行回调函数
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
        window.history.go(n);
    }

    /**
     * 确保路径相同
     * @param {boolean} push 是否添加路由记录
     */
    ensureURL(push) {
        const current = this.current.fullPath;

        if (getHash() !== current) {
            push ? pushHash(current) : replaceHash(current);
        }
    }

    // 获取当前地址
    getCurrentLocation() {
        return getHash();
    }
}

/**
 * 验证地址，并修改当前当前的历史记录
 * @param {string} base 基路径
 */
function checkFallback(base) {
    const location = getLocation(base);

    // 判断当前URL是否是hash地址为开头
    if (!/^\/#/.test(location)) {
        // 修改地址
        window.location.replace(cleanPath(base + '/#' + location));
        return true;
    }
}

/**
 * 判断路径是否已斜杠开头，否则修改路由记录，确保路径是已斜杠开头的
 * @returns {boolean}
 */
function ensureSlash() {
    const path = getHash();
    if (path.charAt(0) === '/') {
        return true;
    }

    replaceHash('/' + path);
    return false;
}

/**
 * 获取地址
 * @returns {string}
 */
export function getHash() {
    //// We can't use window.location.hash here because it's not
    //// consistent across browsers - Firefox will pre-decode it!
    let href = window.location.href;
    const index = href.indexOf('#');

    // 相对路径是空（首页 => '/'）
    if (index < 0) return '';

    href = href.slice(index + 1);
    //// decode the hash but not the search or hash
    //// as search(query) is already decoded
    //// https://github.com/vuejs/vue-router/issues/2708
    const searchIndex = href.indexOf('?');

    // URL上没有query参数对象
    if (searchIndex < 0) {
        const hashIndex = href.indexOf('#');

        // 不给URL尾部的 hash参数进行URL解码
        if (hashIndex > -1) {
            href = decodeURI(href.slice(0, hashIndex)) + href.slice(hashIndex);
        } else href = decodeURI(href);
    } else {
        // 不给URL上的query对象进行解码
        href = decodeURI(href.slice(0, searchIndex)) + href.slice(searchIndex);
    }

    return href;
}

/**
 * 获取 完整的相对路径
 * @param {string} path
 * @returns {string}
 */
function getUrl(path) {
    const href = window.location.href;
    const i = href.indexOf('#');
    const base = i >= 0 ? href.slice(0, i) : href;
    return `${base}#${path}`;
}

/**
 * 新增 hash模式和下的路由记录
 * @param {*} path
 */
function pushHash(path) {
    if (supportsPushState) {
        pushState(getUrl(path));
    } else {
        window.location.hash = path;
    }
}

/**
 * 修改 hash模式和下的路由记录
 * @param {string} path
 */
function replaceHash(path) {
    if (supportsPushState) {
        replaceState(getUrl(path));
    } else {
        window.location.replace(getUrl(path));
    }
}
