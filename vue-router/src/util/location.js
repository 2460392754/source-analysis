import { parsePath, resolvePath } from './path';
import { resolveQuery } from './query';
import { fillParams } from './params';
import { warn } from './warn';
import { extend } from './misc';

/**
 * 规范化并处理 地址
 * @param {string|Object} raw
 * @param {Route|null} current
 * @param {boolean|null} append 路径是否和基路径合并
 * @param {VueRouter} router
 */
export function normalizeLocation(raw, current, append, router) {
    // 规范化
    let next = typeof raw === 'string' ? { path: raw } : raw;

    // 是否 格式化相同路由属性对象
    if (next._normalized) {
        return next;
    } else if (next.name) {
        // 浅拷贝分离引用并重新赋值
        next = extend({}, raw);

        // 缩短变量名
        const params = next.params;

        // 开发者配置中填写了`params`，且`params`是对象类型
        if (params && typeof params === 'object') {
            next.params = extend({}, params);
        }

        return next;
    }

    // 没有配置`path`和`name`配置
    if (!next.path && next.params && current) {
        // 浅拷贝分离引用并重新赋值
        next = extend({}, next);
        next._normalized = true;

        // 分离引用，`next.params`和`current.params`合并到空对象上，`current.params`数据优先级更高
        const params = extend(extend({}, current.params), next.params);

        // 当前路由页面配置中是否配置了 `name`
        if (current.name) {
            next.name = current.name;
            next.params = params;

            // 是否有 当前路由有保存之前路由操作后的历史记录（页面加载后进入的首页）
        } else if (current.matched.length) {
            // 从历史记录中最后一条 `path`未编译的(添加正则的`path`) 数据的`path`
            const rawPath = current.matched[current.matched.length - 1].path;

            next.path = fillParams(rawPath, params, `path ${current.path}`);
        } else if (process.env.NODE_ENV !== 'production') {
            warn(false, `relative params navigation requires a current route.`);
        }

        return next;
    }

    // 获取 地址解析后的对象参数
    const parsedPath = parsePath(next.path || '');

    // 获取 基地址
    const basePath = (current && current.path) || '/';

    // 获取 完整地址
    const path = parsedPath.path
        ? resolvePath(parsedPath.path, basePath, append || next.append)
        : basePath;

    // 解析query
    const query = resolveQuery(parsedPath.query, next.query, router && router.options.parseQuery);

    let hash = next.hash || parsedPath.hash;

    // 去重添加
    if (hash && hash.charAt(0) !== '#') {
        hash = `#${hash}`;
    }

    return {
        _normalized: true,
        path,
        query,
        hash
    };
}
