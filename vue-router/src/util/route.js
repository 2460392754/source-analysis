import { stringifyQuery } from './query';

// 正则匹配 URL 尾部斜杠
const trailingSlashRE = /\/?$/;

/**
 * 创建 路由信息对象 (this.$route)
 * @param {Object|null} record 路由记录
 * @param {Object} location
 * @param {null} redirectedFrom 来自重定向的源路径
 * @param {null|Object} router 路由对象
 */
export function createRoute(record, location, redirectedFrom, router) {
    // 判断`router`是否是 真值，并获取`stringifyQuery`函数
    const stringifyQuery = router && router.options.stringifyQuery;

    // 获取`query`,并设置默认值
    let query = location.query || {};

    // 深拷贝`query`,并捕获错误，防止程序因为异常而停止运行
    try {
        query = clone(query);
    } catch (e) {}

    // 封装 route(路由信息对象)
    const route = {
        name: location.name || (record && record.name),
        meta: (record && record.meta) || {},
        path: location.path || '/',
        hash: location.hash || '',
        query,
        params: location.params || {},
        fullPath: getFullPath(location, stringifyQuery),
        matched: record ? formatMatch(record) : []
    };

    if (redirectedFrom) {
        // 拼接并获取 来自重定向的源路径
        route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery);
    }

    // 冻结`route`对象
    return Object.freeze(route);
}

/**
 * 深拷贝
 * @param {any} value
 */
function clone(value) {
    // `value`是否是 数组类型
    if (Array.isArray(value)) {
        return value.map(clone);

        // `value`是否是对象类型，但不能是`null`
    } else if (value && typeof value === 'object') {
        const res = {};

        for (const key in value) {
            res[key] = clone(value[key]);
        }

        return res;
    } else {
        return value;
    }
}

// 初始化一个路由信息对象
export const START = createRoute(null, {
    path: '/'
});

/**
 * 遍历`record`对象
 * @param {*} record
 */
function formatMatch(record) {
    const res = [];

    // 遍历`record`属性链上的每个`parent`子对象
    while (record) {
        res.unshift(record);

        record = record.parent;
    }

    return res;
}

/**
 * 获取 完整的路径
 * @param {Object} param0
 * @param {string|null} param0.path 路径
 * @param {Object} param0.query query对象
 * @param {string} param0.hash hash路径
 * @param {Function} _stringifyQuery 自定义格式化函数
 */
function getFullPath({ path, query = {}, hash = '' }, _stringifyQuery) {
    // 添加 默认query反解析函数
    const stringify = _stringifyQuery || stringifyQuery;

    // 添加默认`path`默认值，并拼接合并成完整的路径
    return (path || '/') + stringify(query) + hash;
}

/**
 * 是否是 相同的路由信息对象
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
export function isSameRoute(a, b) {
    // 路由对象`b`是否时初始化的路由对象
    if (b === START) {
        // 判断和`a`路由对象是否同一引用
        return a === b;

        // 判断 路由对象`b` 是否是不是对象类型
    } else if (!b) {
        return false;

        // 判断 对象`a`和对象`b`是否都有`path`属性
    } else if (a.path && b.path) {
        // `path`属性都删除尾字符后相同，且 `hash`属性也相同，且 对象相等
        return (
            a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
            a.hash === b.hash &&
            isObjectEqual(a.query, b.query)
        );

        // 判断 都配置了`name`属性
    } else if (a.name && b.name) {
        // `name`和`hash`属性都相同，且`query`和`params`对象也相等
        return (
            a.name === b.name &&
            a.hash === b.hash &&
            isObjectEqual(a.query, b.query) &&
            isObjectEqual(a.params, b.params)
        );
    } else {
        return false;
    }
}

/**
 * 判断 对象是否相等（包括嵌套）
 * @param {any} a 对象
 * @param {any} b 对象
 * @returns {boolean}
 */
function isObjectEqual(a = {}, b = {}) {
    // handle null value #1566
    // TODO：猜测 query对象主动设置为`null`类型
    if (!a || !b) return a === b;

    // 获取对象的键名列表
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    // 判断 键名列表长度是否不相等
    if (aKeys.length !== bKeys.length) {
        return false;
    }

    return aKeys.every((key) => {
        // 获取对应的键名
        const aVal = a[key];
        const bVal = b[key];

        // 判断是否都是 对象类型，则进行 对象递归判断
        if (typeof aVal === 'object' && typeof bVal === 'object') {
            return isObjectEqual(aVal, bVal);
        }

        // 强制转换为字符串类型进行判断
        return String(aVal) === String(bVal);
    });
}

/**
 *
 * @param {*} current
 * @param {*} target
 */
export function isIncludedRoute(current, target) {
    return (
        current.path
            // `current`尾部去重添加斜杠
            .replace(trailingSlashRE, '/')
            // `target`尾部去重添加斜杠，且`current`具有相同的字符串并存在与字符头部
            .indexOf(target.path.replace(trailingSlashRE, '/')) === 0 &&
        // `target`
        (!target.hash || current.hash === target.hash) &&
        queryIncludes(current.query, target.query)
    );
}

/**
 * 判断`current`是否有target`的所有键名
 * @param {Object} current
 * @param {Object} target
 * @returns {boolean}
 */
function queryIncludes(current, target) {
    // 遍历键名
    for (const key in target) {
        // 判断 `current` 对象中是否没有当前键名
        if (!(key in current)) {
            return false;
        }
    }

    return true;
}
