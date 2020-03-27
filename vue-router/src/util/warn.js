/**
 * 抛出异常，代码断言
 * @param { boolean } condition 状态
 * @param { string } message 提示消息
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(`[vue-router] ${message}`);
    }
}

/**
 * 控制台打印警告
 * @param { boolean } condition 状态
 * @param { string } message 提示消息
 */
export function warn(condition, message) {
    if (process.env.NODE_ENV !== 'production' && !condition) {
        typeof console !== 'undefined' && console.warn(`[vue-router] ${message}`);
    }
}

/**
 * 判断`err`对象是否是`Error`对象构造出来的
 * @param {*} err
 * @return { boolean }
 */
export function isError(err) {
    return Object.prototype.toString.call(err).indexOf('Error') > -1;
}

/**
 * 判断 `err` 对象的原型链上的对象是否有 `constructor` 这个构造函数（判断`err`是否由`constructor`实例化出来的对象）
 * @param {Class} constructor 构造函数
 * @param {Object} err 错误对象
 * @returns {boolean}
 */
export function isExtendedError(constructor, err) {
    return (
        err instanceof constructor ||
        // _name is to support IE9 too
        (err && (err.name === constructor.name || err._name === constructor._name))
    );
}
