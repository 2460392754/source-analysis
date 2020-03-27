import Regexp from 'path-to-regexp';
import { cleanPath } from './util/path';
import { assert, warn } from './util/warn';

/**
 * 动态路由匹配
 * @param {Array} routes 路由属性列表
 * @param {undefined|any[]} oldPathList 路由记录中的`path`属性去重后的`path`数组容器
 * @param {undefined|*} oldPathMap 路由记录中的`path`属性做为键名去重后的路由记录对象容器
 * @param {undefined|*} oldNameMap 路由记录中的`name`属性做为键名去重后的路由记录对象对象容器
 * @returns {Object}
 */
export function createRouteMap(routes, oldPathList, oldPathMap, oldNameMap) {
    // 初始化，创建默认值
    const pathList = oldPathList || [];
    const pathMap = oldPathMap || Object.create(null);
    const nameMap = oldNameMap || Object.create(null);

    // 遍历 `routes` 数组
    routes.forEach((route) => {
        addRouteRecord(pathList, pathMap, nameMap, route);
    });

    // 遍历所有路径（包括递归的子路由后获取的路径）
    // 判断路径是否为'*'字符，最终排序到数组的结尾
    for (let i = 0, l = pathList.length; i < l; i++) {
        if (pathList[i] === '*') {
            pathList.push(pathList.splice(i, 1)[0]);
            l--;
            i--;
        }
    }

    // 开发环境
    if (process.env.NODE_ENV === 'development') {
        // 过滤掉 首字符不为'*'和'/'的路径
        const found = pathList.filter(
            (path) => path && path.charAt(0) !== '*' && path.charAt(0) !== '/'
        );

        // 打印 路径不规范 的警告
        if (found.length > 0) {
            const pathNames = found.map((path) => `- ${path}`).join('\n');
            warn(
                false,
                `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`
            );
        }
    }

    return {
        pathList,
        pathMap,
        nameMap
    };
}

/**
 * 添加 路由记录
 * @param {Array} pathList 路由记录中的`path`属性去重后的`path`数组容器
 * @param {Object} pathMap 路由记录中的`path`属性做为键名去重后的路由记录对象容器
 * @param {Object} nameMap 路由记录中的`name`属性做为键名去重后的路由记录对象对象容器
 * @param {Object} route 路由页面属性对象
 * @param {undefined | Object} parent 父路由
 * @param {undefined | string} matchAs 别名路径指向的真实路径
 */
function addRouteRecord(pathList, pathMap, nameMap, route, parent, matchAs) {
    // 解构对象
    const { path, name } = route;

    // 在生产环境中打印一些因为 路由页面属性配置不完整的 警告
    if (process.env.NODE_ENV !== 'production') {
        assert(path != null, `"path" is required in a route configuration.`);
        assert(
            typeof route.component !== 'string',
            `route config "component" for path: ${String(path || name)} cannot be a ` +
                `string id. Use an actual component instead.`
        );
    }

    // 给 路由页面属性的路由匹配对象 添加默认值
    const pathToRegexpOptions = route.pathToRegexpOptions || {};

    // 获取 规范化后的路径
    const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict);

    // 路由路径是否开启 “区分大小写”
    if (typeof route.caseSensitive === 'boolean') {
        pathToRegexpOptions.sensitive = route.caseSensitive;
    }

    // 封装 路由记录 (this.$route.matched列表中的路由记录)
    const record = {
        path: normalizedPath,
        regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
        // 设置默认的命名视图
        components: route.components || { default: route.component },
        instances: {},
        name,
        parent,
        matchAs,
        redirect: route.redirect,
        beforeEnter: route.beforeEnter,
        meta: route.meta || {},
        props: route.props == null ? {} : route.components ? route.props : { default: route.props }
    };

    if (route.children) {
        //// Warn if route is named, does not redirect and has a default child route.
        //// If users navigate to this route by name, the default child will
        //// not be rendered (GH Issue #629)
        if (process.env.NODE_ENV !== 'production') {
            // 配置了`name`属性，且没有配置访问后重定向的路径，且子路由的配置的路径是'/'（会和父路由的路径冲突），则抛出警告
            if (
                route.name &&
                !route.redirect &&
                route.children.some((child) => /^\/?$/.test(child.path))
            ) {
                warn(
                    false,
                    `Named Route '${route.name}' has a default child route. ` +
                        `When navigating to this named route (:to="{name: '${route.name}'"), ` +
                        `the default child route will not be rendered. Remove the name from ` +
                        `this route and use the name of the default child route for named ` +
                        `links instead.`
                );
            }
        }

        // 递归 子路由
        route.children.forEach((child) => {
            // 判断 子路由是否有配置路径别名
            const childMatchAs = matchAs ? cleanPath(`${matchAs}/${child.path}`) : undefined;

            // 添加 路由记录
            addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
        });
    }

    // 去重添加
    if (!pathMap[record.path]) {
        pathList.push(record.path);
        pathMap[record.path] = record;
    }

    if (route.alias !== undefined) {
        // 格式统一
        const aliases = Array.isArray(route.alias) ? route.alias : [route.alias];

        // 遍历`aliases`数组
        for (let i = 0; i < aliases.length; ++i) {
            const alias = aliases[i];

            // 非生产环境中，路径别名和真实路径相同，
            if (process.env.NODE_ENV !== 'production' && alias === path) {
                warn(
                    false,
                    `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
                );

                // 非生产环境跳过单次循环
                continue;
            }

            // 创建一个新的 路由属性对象
            const aliasRoute = {
                path: alias,
                children: route.children
            };

            // 添加一个 新的路由记录，拷贝原型的路由属性，为`alias`路径基本的别名路径路由记录
            addRouteRecord(pathList, pathMap, nameMap, aliasRoute, parent, record.path || '/');
        }
    }

    // 配置的`name`属性为真值
    if (name) {
        // 去重添加
        if (!nameMap[name]) {
            nameMap[name] = record;
            // 非生产环境
        } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
            warn(
                false,
                `Duplicate named routes definition: ` +
                    `{ name: "${name}", path: "${record.path}" }`
            );
        }
    }
}

/**
 * 获取 计算路由匹配对象的 正则路径
 * @param {string} path 规范化后的路径
 * @param {Object} pathToRegexpOptions 路由页面属性配置的`pathToRegexpOptions`路由正则匹配对象
 * @returns {string}
 */
function compileRouteRegex(path, pathToRegexpOptions) {
    const regex = Regexp(path, [], pathToRegexpOptions);

    if (process.env.NODE_ENV !== 'production') {
        const keys = Object.create(null);

        regex.keys.forEach((key) => {
            warn(!keys[key.name], `Duplicate param keys in route with path: "${path}"`);
            keys[key.name] = true;
        });
    }

    return regex;
}

/**
 * 规范化路径
 * @param {string} path 路由页面属性的`path`对象
 * @param {undefined|Object} parent 当前路由信息对象的父路由
 * @param {boolean} strict 是否开启 严格模式
 */
function normalizePath(path, parent, strict) {
    // 非严格模式下，正则匹配删除 `path`的尾字符'/'
    if (!strict) path = path.replace(/\/$/, '');

    // 判断 `path`的首字符是否是'\'
    if (path[0] === '/') return path;

    // 判断 当前路由是否不是 子路由（根路由）
    if (parent == null) return path;

    // 拼接父路由和当前路由的路径，再进行格式转换
    return cleanPath(`${parent.path}/${path}`);
}
