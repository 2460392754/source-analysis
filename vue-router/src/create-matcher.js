import { resolvePath } from './util/path';
import { assert, warn } from './util/warn';
import { createRoute } from './util/route';
import { fillParams } from './util/params';
import { createRouteMap } from './create-route-map';
import { normalizeLocation } from './util/location';

/**
 * 创建 路由匹配器对象
 * @param {Array} routes 路径属性列表
 * @param {*} router 路由
 */
export function createMatcher(routes, router) {
    const { pathList, pathMap, nameMap } = createRouteMap(routes);

    /**
     * 动态添加更多的路由规则
     * @param {*} routes 路由属性列表
     */
    function addRoutes(routes) {
        createRouteMap(routes, pathList, pathMap, nameMap);
    }

    /**
     * 获取 路由信息对象
     * @param {string|Object} raw 类`route`对象(当前激活的路由信息对象)
     * @param {*} currentRoute 当前路由
     * @param {*} redirectedFrom 来自重定向的源路径
     */
    function match(raw, currentRoute, redirectedFrom) {
        // 规范化地址
        const location = normalizeLocation(raw, currentRoute, false, router);

        // 对象解构获取`name`
        const { name } = location;

        // `name`是真值
        if (name) {
            // 获取 路由记录
            const record = nameMap[name];

            // 非生产环境中，判断 `record` 是否是假值
            if (process.env.NODE_ENV !== 'production') {
                warn(record, `Route with name '${name}' does not exist`);
            }

            // 如果`record`是假值
            if (!record) return _createRoute(null, location);

            // TODO: `regex`的`keys`对象生成来源
            // 遍历`path`通过`path-to-regexp`正则匹配后获取的正则路由列表
            const paramNames = record.regex.keys
                // 过滤掉 可选匹配规则(?)
                .filter((key) => !key.optional)
                .map((key) => key.name);

            // 按照规范进行初始化
            if (typeof location.params !== 'object') {
                location.params = {};
            }

            // `currentRoute`是否是真值，并且配置了`params`
            if (currentRoute && typeof currentRoute.params === 'object') {
                // 遍历`params`对象
                for (const key in currentRoute.params) {
                    // `location.params`对象中没有当前的键名，
                    if (!(key in location.params) && paramNames.indexOf(key) > -1) {
                        location.params[key] = currentRoute.params[key];
                    }
                }
            }

            location.path = fillParams(record.path, location.params, `named route "${name}"`);

            return _createRoute(record, location, redirectedFrom);

            // `path`时真值
        } else if (location.path) {
            // 初始化空对象
            location.params = {};

            // 遍历 所有配置路由路径
            for (let i = 0; i < pathList.length; i++) {
                const path = pathList[i];

                // 遍历的路由路径所对应的路由记录
                const record = pathMap[path];

                // 判断 URL上的路径是否符合匹配 路由路径规则
                if (matchRoute(record.regex, location.path, location.params)) {
                    return _createRoute(record, location, redirectedFrom);
                }
            }
        }

        // no match
        return _createRoute(null, location);
    }

    /**
     * 创建 重定向的 路由信息对象
     * @param {Object} record
     * @param {*} location
     */
    function redirect(record, location) {
        // 缩短变量名
        const originalRedirect = record.redirect;

        // 获取 需要重定向的地址
        let redirect =
            typeof originalRedirect === 'function'
                ? // routes: [{path:'/xxx', redirect: to => { return '/need-redirect-path'; } }]
                  originalRedirect(createRoute(record, location, null, router))
                : originalRedirect;

        // 格式统一
        if (typeof redirect === 'string') {
            redirect = { path: redirect };
        }

        // 开发者在配置中`redirect`属性格式不正确
        if (!redirect || typeof redirect !== 'object') {
            if (process.env.NODE_ENV !== 'production') {
                warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`);
            }

            return _createRoute(null, location);
        }

        // 缩短变量名
        const re = redirect;

        // 对象解构
        const { name, path } = re;
        let { query, hash, params } = location;

        // 重定向中配置的参数优先级高于`location`
        query = re.hasOwnProperty('query') ? re.query : query;
        hash = re.hasOwnProperty('hash') ? re.hash : hash;
        params = re.hasOwnProperty('params') ? re.params : params;

        // `name`是否是真值，`name`比`path`的优先级更高
        if (name) {
            // 获取 路由记录对象中的`name`相对应的对象
            const targetRecord = nameMap[name];

            // 在非生产环境中，代码断言 重定向配置`name`错误
            if (process.env.NODE_ENV !== 'production') {
                assert(targetRecord, `redirect failed: named route "${name}" not found.`);
            }

            return match(
                {
                    _normalized: true,
                    name,
                    query,
                    hash,
                    params
                },
                undefined,
                location
            );

            // `path`是否是真值
        } else if (path) {
            // 把父子路由的相对地址合并
            const rawPath = resolveRecordPath(path, record);
            const resolvedPath = fillParams(
                rawPath,
                params,
                `redirect route with path "${rawPath}"`
            );

            return match(
                {
                    _normalized: true,
                    path: resolvedPath,
                    query,
                    hash
                },
                undefined,
                location
            );

            // `name`和`name`都未配置
        } else {
            if (process.env.NODE_ENV !== 'production') {
                warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`);
            }

            return _createRoute(null, location);
        }
    }

    /**
     * 创建 路径别名的 路由信息对象
     * @param {Object} record 路由记录
     * @param {Object} location
     * @param {undefined|string} matchAs 别名路径指向的真实路径
     */
    function alias(record, location, matchAs) {
        const aliasedPath = fillParams(
            matchAs,
            location.params,
            `aliased route with path "${matchAs}"`
        );

        // 创建一个alias的路由信息对象
        const aliasedMatch = match({
            _normalized: true,
            path: aliasedPath
        });

        if (aliasedMatch) {
            const matched = aliasedMatch.matched;
            const aliasedRecord = matched[matched.length - 1];
            location.params = aliasedMatch.params;

            return _createRoute(aliasedRecord, location);
        }

        return _createRoute(null, location);
    }

    /**
     * 封装创建 路由信息对象 方法
     * @param {null} record 路由记录
     * @param {Object} location
     * @param {undefined} redirectedFrom 来自重定向的源路径
     */
    function _createRoute(record, location, redirectedFrom) {
        // `record`是对象类型，且 `record.redirect`是真值
        if (record && record.redirect) {
            return redirect(record, redirectedFrom || location);
        }

        // `record`是对象类型，且添加了`matchAs`属性（别名路径指向的真实路径）
        if (record && record.matchAs) {
            return alias(record, location, record.matchAs);
        }

        return createRoute(record, location, redirectedFrom, router);
    }

    return {
        match,
        addRoutes
    };
}

/**
 * 判断 URL上的路径是否符合匹配 路由路径规则
 * @param {string} regex 路由页面路径匹配规则
 * @param {string} path 路径
 * @param {Object|} params
 * @returns {boolean}
 */
function matchRoute(regex, path, params) {
    // 获取 正则的匹配结果
    const m = path.match(regex);

    // 正则匹配失败
    if (!m) {
        return false;

        // 未填写`param`对象
    } else if (!params) {
        return true;
    }

    // 遍历 正则匹配的结果列表
    for (let i = 1, len = m.length; i < len; ++i) {
        const key = regex.keys[i - 1];
        const val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i];
        if (key) {
            //// Fix #1994: using * with props: true generates a param named 0
            // 当路径匹配规则为'*'字符串时，匹配返回的结果中的`name`属性为 0 (假值)
            params[key.name || 'pathMatch'] = val;
        }
    }

    return true;
}

/**
 * 组合 `record`(路由记录) 地址
 * @param {string} path
 * @param {} record
 */
function resolveRecordPath(path, record) {
    // 判断 当前的路由记录 是否有 父路由，并添加默认 路径
    return resolvePath(path, record.parent ? record.parent.path : '/', true);
}
