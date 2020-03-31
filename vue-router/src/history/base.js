import { _Vue } from '../install';
import { inBrowser } from '../util/dom';
import { runQueue } from '../util/async';
import { warn, isError, isExtendedError } from '../util/warn';
import { START, isSameRoute } from '../util/route';
import { flatten, flatMapComponents, resolveAsyncComponents } from '../util/resolve-components';
import { NavigationDuplicated } from './errors';

/** 给子类实现一些公共的属性和方法 */
export class History {
    /**
     * 构造函数
     * @param {Object} router `VueRouter`实例对象
     * @param {string|undefined} base 基路径
     */
    constructor(router, base) {
        // 实例上设置一个 `VueRouter`实例对象
        this.router = router;

        // 设置规范化的基路径
        this.base = normalizeBase(base);

        // 初始化的路由对象
        this.current = START;
        this.pending = null;

        // 路由是否已被初始化
        this.ready = false;

        // 初始化时调用的回调函数列表
        this.readyCbs = [];

        // 初始化失败时调用的回调函数列表
        this.readyErrorCbs = [];

        // 错误回调函数列表
        this.errorCbs = [];
    }

    // 注册 路由更新后运行的回调函数
    listen(cb) {
        this.cb = cb;
    }

    /**
     * 注册 初始化完成 回调函数
     * @param {Function} cb 由完成初始导航时运行的回调函数
     * @param {Function} errorCb 初始化路由解析运行出错时运行的回调函数
     */
    onReady(cb, errorCb) {
        if (this.ready) {
            cb();

            // 没初始化完成，则把回调函数存到队列中
        } else {
            this.readyCbs.push(cb);

            if (errorCb) {
                this.readyErrorCbs.push(errorCb);
            }
        }
    }

    /**
     * 注册 出现错误时运行的回调函数 [https://router.vuejs.org/zh/api/#router-onerror]
     * @param {Function} errorCb 回调函数
     */
    onError(errorCb) {
        this.errorCbs.push(errorCb);
    }

    /**
     * 核心跳转方法
     * @param {*} location 路由信息对象
     * @param {Function} onComplete 编译回调函数
     * @param {Function} onAbort 终止回调函数
     */
    transitionTo(location, onComplete, onAbort) {
        const route = this.router.match(location, this.current);

        this.confirmTransition(
            route,
            () => {
                // 更新route对象
                this.updateRoute(route);
                onComplete && onComplete(route);

                // 调用子类的方法更新url
                this.ensureURL();

                // 首次初始化路由
                if (!this.ready) {
                    this.ready = true;
                    this.readyCbs.forEach((cb) => {
                        cb(route);
                    });
                }
            },
            (err) => {
                if (onAbort) {
                    onAbort(err);
                }

                // 首次初始化路由，且运行出现错误
                if (err && !this.ready) {
                    this.ready = true;
                    this.readyErrorCbs.forEach((cb) => {
                        cb(err);
                    });
                }
            }
        );
    }

    /**
     * 二次封装，并处理钩子
     * @param {Object} route 路由信息对象
     * @param {Function} onComplete 编译回调函数
     * @param {Function} onAbort 终止回调函数
     */
    confirmTransition(route, onComplete, onAbort) {
        const current = this.current;

        // 运行 注册的错误回调函数，或控制台提示警告信息
        const abort = (err) => {
            // `err`不是`NavigationDuplicated`类实例化后的对象，且是 `Error`构造函数实例化后的对象
            if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
                // 错误回调函数列表中存有函数
                if (this.errorCbs.length) {
                    // 运行回调函数
                    this.errorCbs.forEach((cb) => {
                        cb(err);
                    });
                } else {
                    warn(false, 'uncaught error during route navigation:');
                    console.error(err);
                }
            }

            // 判断函数并运行
            onAbort && onAbort(err);
        };

        // 路由信息对象相同，且 路由记录列表相同
        if (isSameRoute(route, current) && route.matched.length === current.matched.length) {
            this.ensureURL();
            return abort(new NavigationDuplicated(route));
        }

        const { updated, deactivated, activated } = resolveQueue(
            this.current.matched,
            route.matched
        );

        // 待运行的队列列表
        const queue = [].concat(
            // 离开路由守卫列表
            extractLeaveGuards(deactivated),
            // 路由进入之前的全局钩子
            this.router.beforeHooks,
            // vue页面组件被复用的路由守卫列表
            extractUpdateHooks(updated),
            // 过滤掉新添加的路由记录中没有注册私有的路由守卫
            activated.map((m) => m.beforeEnter),
            // 获取异步路由组件
            resolveAsyncComponents(activated)
        );

        // 更新状态
        this.pending = route;

        /**
         * 创建 路由守卫运行迭代器
         * @param {*} hook 路由守卫
         * @param {*} next 运行下一个路由守卫
         */
        const iterator = (hook, next) => {
            if (this.pending !== route) {
                return abort();
            }

            try {
                hook(route, current, (to) => {
                    // 中断当前的路径跳转，或中断且注册错误回调
                    // next(false) -> abort navigation, ensure current URL
                    if (to === false || isError(to)) {
                        this.ensureURL(true);
                        abort(to);
                    } else if (
                        // 添加或修改 路由
                        // next('/') or next({ path: '/' }) -> redirect
                        typeof to === 'string' ||
                        (typeof to === 'object' &&
                            (typeof to.path === 'string' || typeof to.name === 'string'))
                    ) {
                        // 提示警告，并跳转路由
                        abort();
                        if (typeof to === 'object' && to.replace) {
                            this.replace(to);
                        } else {
                            this.push(to);
                        }
                    } else {
                        // 运行下一个路由守卫
                        next(to);
                    }
                });
                // 捕获开发者配置`next(err)`错误回调
            } catch (e) {
                abort(e);
            }
        };

        // 运行队列函数
        runQueue(queue, iterator, () => {
            // 函数回调容器
            const postEnterCbs = [];
            // 判断路由是否更新
            const isValid = () => this.current === route;
            // 获取 路由进入的路由守卫列表
            const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid);
            // 列表尾部追加 组件和路由全部解析完后运行的全局钩子
            const queue = enterGuards.concat(this.router.resolveHooks);

            // 运行新队列
            runQueue(queue, iterator, () => {
                // TODO: 在怎样的状态下，队列运行之前的route会和现在的route不同
                if (this.pending !== route) {
                    return abort();
                }

                this.pending = null;
                onComplete(route);

                if (this.router.app) {
                    // 确保next(vm => {})运行的回调函数中的vm参数指向的是vue实例化后且能访问mounted钩子的对象
                    this.router.app.$nextTick(() => {
                        postEnterCbs.forEach((cb) => {
                            cb();
                        });
                    });
                }
            });
        });
    }

    // 路由更新后运行的一些处理
    updateRoute(route) {
        const prev = this.current;
        this.current = route;

        // 运行 注册的回调函数
        this.cb && this.cb(route);

        // 运行 路由离开之前的全局钩子
        this.router.afterHooks.forEach((hook) => {
            hook && hook(route, prev);
        });
    }
}

/**
 * 规范化 基路径
 * @param {string} base 基路径
 * @returns {string}
 */
function normalizeBase(base) {
    // 判断 `base`是否是 "虚值"
    if (!base) {
        // 运行环境是否是浏览器
        if (inBrowser) {
            // 可以从html中base标签的href属性获取到默认的基地址（注意vue渲染和vueRouter的加载时间）
            const baseEl = document.querySelector('base');
            base = (baseEl && baseEl.getAttribute('href')) || '/';
            // 删除掉可能存在的origin数据
            base = base.replace(/^https?:\/\/[^\/]+/, '');
        } else {
            base = '/';
        }
    }

    // `base`添加头部斜杠
    if (base.charAt(0) !== '/') {
        base = '/' + base;
    }

    // `base`删除尾部斜杠
    return base.replace(/\/$/, '');
}

/**
 * 获取队列
 * @param {*} current 旧路由记录
 * @param {*} next 新路由记录
 * @returns {Object}
 */
function resolveQueue(current, next) {
    let i;
    // 获取最新的路由记录
    const max = Math.max(current.length, next.length);

    // 获取不相同的路由记录下标位置
    for (i = 0; i < max; i++) {
        if (current[i] !== next[i]) {
            break;
        }
    }

    return {
        // vue组件实例对象被复用的路由记录
        updated: next.slice(0, i),
        // 新添加的路由记录
        activated: next.slice(i),
        // 离开当前vue组件实例对象的路由记录
        deactivated: current.slice(i)
    };
}

/**
 * 获取 路由守卫列表
 * @param {*} records 路由记录列表
 * @param {string} name 路由名称
 * @param {Function} bind 处理绑定函数
 * @param {Boolean} reverse 数组颠倒
 * @returns 路由守卫列表
 */
function extractGuards(records, name, bind, reverse) {
    // 获取 路由守卫处理this后返回的闭包函数列表
    const guards = flatMapComponents(records, (def, instance, match, key) => {
        const guard = extractGuard(def, name);

        // 判断当前组件内是否有注册过组件路由守卫
        if (guard) {
            return Array.isArray(guard)
                ? guard.map((guard) => bind(guard, instance, match, key))
                : bind(guard, instance, match, key);
        }
    });

    // 颠倒 路由守卫的运行顺序
    return flatten(reverse ? guards.reverse() : guards);
}

/**
 * 获取 组件内的路由守卫
 * @param {*} def vue组件属性对象
 * @param {string} key 路由守卫名称
 */
function extractGuard(def, key) {
    // 通过vue组件构造器，把属性对象转化为实例对象
    if (typeof def !== 'function') {
        // 创建一个组件构造器
        def = _Vue.extend(def);
    }

    return def.options[key];
}

/**
 * 获取 离开路由守卫列表
 * @param {*} deactivated
 */
function extractLeaveGuards(deactivated) {
    return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true);
}

/**
 * 获取 vue页面组件被复用的路由守卫列表
 * @param {*} updated
 */
function extractUpdateHooks(updated) {
    return extractGuards(updated, 'beforeRouteUpdate', bindGuard);
}

/**
 * 绑定 路由守卫
 * @param {*} guard 路由守卫
 * @param {*} instance vue组件实例
 * @returns {Function} 返回一个路由守卫的实例对象指向的是instance的闭包函数
 */
function bindGuard(guard, instance) {
    // TODO：什么情况下 isntance 是一个否值
    if (instance) {
        return function boundRouteGuard() {
            return guard.apply(instance, arguments);
        };
    }
}

/**
 * 获取 vue路由组件实例化后的路由守卫列表
 * @param {*} activated
 * @param {any[]} cbs
 * @param {Function} isValid
 */
function extractEnterGuards(activated, cbs, isValid) {
    return extractGuards(activated, 'beforeRouteEnter', (guard, _, match, key) => {
        return bindEnterGuard(guard, match, key, cbs, isValid);
    });
}

/**
 * 绑定 vue路由组件实例化后的路由守卫
 * @param {*} guard 路由守卫
 * @param {*} match 路由记录
 * @param {string} key 路由命名视图的键名
 * @param {Function[]} cbs 存储函数回调的容器
 * @param {Function} isValid
 * @returns {Function} 返回了一个闭包函数
 */
function bindEnterGuard(guard, match, key, cbs, isValid) {
    return function routeEnterGuard(to, from, next) {
        return guard(to, from, (cb) => {
            if (typeof cb === 'function') {
                cbs.push(() => {
                    poll(cb, match.instances, key, isValid);
                });
            }

            next(cb);
        });
    };
}

/**
 * 实现 路由守卫中的next中添加回调函数访问组件实例
 * next(vm => {})
 * @param {Function} cb 路由守卫中添加的回调函数
 * @param {any[]} instances vue组件实例列表
 * @param {string} key 路由命名视图的键名
 * @param {*} isValid
 */
function poll(cb, instances, key, isValid) {
    // vue组件实例存在，且没有正在被销毁
    if (instances[key] && !instances[key]._isBeingDestroyed) {
        // next传入组件实例
        cb(instances[key]);
    } else if (isValid()) {
        // 已屏幕刷新率为60帧率进行递归调用
        setTimeout(() => {
            poll(cb, instances, key, isValid);
        }, 16);
    }
}
