import { _Vue } from '../install';
import { warn, isError } from './warn';

/**
 * 解析异步组件
 * @param {*} matched 路由记录
 * @returns {Function} 返回一个闭包函数
 */
export function resolveAsyncComponents(matched) {
    return (to, from, next) => {
        let hasAsync = false;
        let pending = 0;
        let error = null;

        flatMapComponents(matched, (def, _, match, key) => {
            //// if it's a function and doesn't have cid attached,
            //// assume it's an async component resolve function.
            //// we are not using Vue's default async resolving mechanism because
            //// we want to halt the navigation until the incoming component has been
            //// resolved.
            // TODO: cid是什么
            // 判断组件是否是异步组件
            if (typeof def === 'function' && def.cid === undefined) {
                hasAsync = true;
                pending++;

                const resolve = once((resolvedDef) => {
                    // 获取 es module下的默认导出对象
                    if (isESModule(resolvedDef)) {
                        resolvedDef = resolvedDef.default;
                    }
                    // save resolved on async factory in case it's used elsewhere
                    def.resolved =
                        typeof resolvedDef === 'function' ? resolvedDef : _Vue.extend(resolvedDef);
                    // 当前的路由记录列表上添加上记录
                    match.components[key] = resolvedDef;
                    pending--;
                    if (pending <= 0) {
                        next();
                    }
                });

                const reject = once((reason) => {
                    const msg = `Failed to resolve async component ${key}: ${reason}`;
                    process.env.NODE_ENV !== 'production' && warn(false, msg);
                    if (!error) {
                        error = isError(reason) ? reason : new Error(msg);
                        next(error);
                    }
                });

                let res;
                try {
                    res = def(resolve, reject);
                } catch (e) {
                    reject(e);
                }
                if (res) {
                    if (typeof res.then === 'function') {
                        res.then(resolve, reject);
                    } else {
                        // new syntax in Vue 2.3
                        const comp = res.component;
                        if (comp && typeof comp.then === 'function') {
                            comp.then(resolve, reject);
                        }
                    }
                }
            }
        });

        if (!hasAsync) next();
    };
}

/**
 * 扁平化
 * @param {*} matched 路由记录列表
 * @param {Function} fn 回调函数
 * @returns
 */
export function flatMapComponents(matched, fn) {
    return flatten(
        matched.map((m) => {
            // 遍历每个路由记录中的每个命名视图
            return Object.keys(m.components).map((key) =>
                // m.components[key]：路由加载的组件属性
                // m.instances[key]：路由加载组件后的实例对象，
                // m: 遍历的当前路由记录
                // key: 路由命名视图的键名
                fn(m.components[key], m.instances[key], m, key)
            );
        })
    );
}

/**
 * 数组扁平化、浅拷贝
 * @param {any[]} arr
 * @return {any[]}
 */
export function flatten(arr) {
    return Array.prototype.concat.apply([], arr);
}

// 判断当前环境是否支持 Symbol 对象
const hasSymbol = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

/**
 * 判断对象是否是 es6 module 对象
 * @param {*} obj
 * @returns {Boolean}
 */
function isESModule(obj) {
    // __esModule: es6 module对象被转化为 commonjs 对象
    return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module');
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once(fn) {
    let called = false;
    return function(...args) {
        if (called) return;
        called = true;
        return fn.apply(this, args);
    };
}
