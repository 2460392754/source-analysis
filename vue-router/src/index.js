import { install } from './install';
import { START } from './util/route';
import { assert } from './util/warn';
import { inBrowser } from './util/dom';
import { cleanPath } from './util/path';
import { createMatcher } from './create-matcher';
import { normalizeLocation } from './util/location';
import { supportsPushState } from './util/push-state';

import { HashHistory } from './history/hash';
import { HTML5History } from './history/html5';
import { AbstractHistory } from './history/abstract';

export default class VueRouter {
    constructor(options = {}) {
        this.app = null;
        this.apps = [];

        // VueRouter 配置项数据
        this.options = options;

        // 3个全局钩子容器
        this.beforeHooks = [];
        this.resolveHooks = [];
        this.afterHooks = [];

        // 创建路由匹配器对象
        this.matcher = createMatcher(options.routes || [], this);

        // 设置默认值
        let mode = options.mode || 'hash';

        // 在浏览器环境中设置的`mode`是`history`，且浏览器版本不支持历史记录，且设置了 自动回调`hash`
        this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false;

        // 判断 回退来替换`mode`
        if (this.fallback) {
            mode = 'hash';
        }

        // 非浏览器环境
        if (!inBrowser) {
            mode = 'abstract';
        }

        this.mode = mode;

        // 设置 路由模式
        switch (mode) {
            // 浏览器的`window.history`模式
            case 'history':
                this.history = new HTML5History(this, options.base);
                break;

            // 浏览器的`hash`
            case 'hash':
                this.history = new HashHistory(this, options.base, this.fallback);
                break;

            // 非浏览器环境
            case 'abstract':
                this.history = new AbstractHistory(this, options.base);
                break;

            // `mode`配置错误
            default:
                if (process.env.NODE_ENV !== 'production') {
                    assert(false, `invalid mode: ${mode}`);
                }
        }
    }

    /**
     * 路由匹配器
     * @param {string} raw URL字符串
     * @param {Router} current 当前路由对象
     * @param {undefined} redirectedFrom
     */
    match(raw, current, redirectedFrom) {
        return this.matcher.match(raw, current, redirectedFrom);
    }

    /**
     * 获取 当前路由路径下的信息对象
     * 等同于 `this.$router.currentRoute` === `this.$router.current` === `this.$route`
     */
    get currentRoute() {
        return this.history && this.history.current;
    }

    /**
     * 初始化
     * @param {Vue} app 组件实例对象
     */
    init(app) {
        // 在非生产环境中判断 'VueRouter'插件 是否已经注册'Vue'实例对象中
        process.env.NODE_ENV !== 'production' &&
            assert(
                install.installed,
                `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
                    `before creating root instance.`
            );

        // 保存组件实例对象
        this.apps.push(app);

        // 注册Vue的destroyed生命钩子，当组件销毁时，删除apps栈中的引用
        app.$once('hook:destroyed', () => {
            // 销毁apps栈中的这个实例
            const index = this.apps.indexOf(app);
            if (index > -1) this.apps.splice(index, 1);
            // 当销毁的栈时最新的，则添加主栈或空
            if (this.app === app) this.app = this.apps[0] || null;
        });

        // 当路由不是首次运行，就结束
        if (this.app) {
            return;
        }

        // 保存 vm
        this.app = app;

        // 获取当前已设置的路由模式
        const history = this.history;

        // history模式
        if (history instanceof HTML5History) {
            history.transitionTo(history.getCurrentLocation());

            // hash模式
        } else if (history instanceof HashHistory) {
            // 运行成功或失败时运行的函数
            const setupHashListener = () => {
                history.setupListeners();
            };

            history.transitionTo(
                history.getCurrentLocation(),
                setupHashListener,
                setupHashListener
            );
        }

        // 注册 路由更新后运行的回调函数，更新路由记录
        history.listen((route) => {
            this.apps.forEach((app) => {
                app._route = route;
            });
        });
    }

    // 注册 路由进入时组件解析之前的全局钩子
    beforeEach(fn) {
        return registerHook(this.beforeHooks, fn);
    }

    // 注册 组件和路由全部解析完后运行的全局钩子
    beforeResolve(fn) {
        return registerHook(this.resolveHooks, fn);
    }

    // 注册 路由离开之前的全局钩子
    afterEach(fn) {
        return registerHook(this.afterHooks, fn);
    }

    // 注册 初始化完成 回调函数
    onReady(cb, errorCb) {
        this.history.onReady(cb, errorCb);
    }

    // 注册 出现错误时运行的回调函数 [https://router.vuejs.org/zh/api/#router-onerror]
    onError(errorCb) {
        this.history.onError(errorCb);
    }

    /**
     * 添加并跳转 新的路由记录
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    push(location, onComplete, onAbort) {
        // 在没有添加`onComplete`和`onAbort`回调函数的情况下，且浏览器支持`Promise`函数，在返回一个Promise实例对象
        if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
            return new Promise((resolve, reject) => {
                this.history.push(location, resolve, reject);
            });
        } else {
            this.history.push(location, onComplete, onAbort);
        }
    }

    /**
     * 修改 当前的历史记录
     * @param {*} location 路由信息
     * @param {Function} onComplete 所有钩子运行完成之后再运行的回调函数
     * @param {Function} onAbort 当前路由被终止运行时运行的回调函数
     */
    replace(location, onComplete, onAbort) {
        // 在没有添加`onComplete`和`onAbort`回调函数的情况下，且浏览器支持`Promise`函数，在返回一个Promise实例对象
        if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
            return new Promise((resolve, reject) => {
                this.history.replace(location, resolve, reject);
            });
        } else {
            this.history.replace(location, onComplete, onAbort);
        }
    }

    // 加载对应的历史记录
    go(n) {
        this.history.go(n);
    }

    // 历史记录 后退
    back() {
        this.go(-1);
    }

    // 历史记录 前进
    forward() {
        this.go(1);
    }

    /**
     * 获取 目标位置或是当前路由匹配的组件数组
     * @param {*} to 路由信息对象
     */
    getMatchedComponents(to) {
        const route = to ? (to.matched ? to : this.resolve(to).route) : this.currentRoute;
        if (!route) {
            return [];
        }
        return [].concat.apply(
            [],
            route.matched.map((m) => {
                return Object.keys(m.components).map((key) => {
                    return m.components[key];
                });
            })
        );
    }

    /**
     * 解析目标位置
     * @param {*} to 路由信息对象
     * @param {*} current 当前默认的路由
     * @param {Boolean} append 路径是否和基路径合并
     */
    resolve(to, current, append) {
        current = current || this.history.current;
        const location = normalizeLocation(to, current, append, this);
        const route = this.match(location, current);
        const fullPath = route.redirectedFrom || route.fullPath;
        const base = this.history.base;
        const href = createHref(base, fullPath, this.mode);

        return {
            location,
            route,
            href,
            // for backwards compat
            normalizedTo: location,
            resolved: route
        };
    }

    /**
     * 动态添加更多的路由规则
     * @param {*} routes
     */
    addRoutes(routes) {
        this.matcher.addRoutes(routes);

        // 判断路由钩子是否运行完成
        if (this.history.current !== START) {
            this.history.transitionTo(this.history.getCurrentLocation());
        }
    }
}

/**
 * 注册 钩子
 * @param {any[]} list 钩子容器
 * @param {*} fn 钩子运行时运行的回调函数
 * @returns {Function} 注销钩子
 */
function registerHook(list, fn) {
    list.push(fn);

    // 返回一个闭包函数，用于注销当前的已注册的全局钩子
    return () => {
        const i = list.indexOf(fn);
        if (i > -1) list.splice(i, 1);
    };
}

/**
 * 获取 完整的href
 * @param {string} base 基地址
 * @param {string} fullPath 完整地址
 * @param {string} mode Router实例使用的模式
 */
function createHref(base, fullPath, mode) {
    var path = mode === 'hash' ? '#' + fullPath : fullPath;
    return base ? cleanPath(base + '/' + path) : path;
}

VueRouter.install = install;
VueRouter.version = '__VERSION__';

if (inBrowser && window.Vue) {
    window.Vue.use(VueRouter);
}
