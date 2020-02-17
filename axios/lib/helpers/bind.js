'use strict';

/**
 * 合并一些参数
 * 功能类似于`Function.prototype.apply`
 *
 * @param {function} fn
 * @param {Object} thisArg
 * @return {}
 */
module.exports = function bind(fn, thisArg) {
    // 返回一个闭包函数
    return function wrap() {
        // 创建一个数组并存入`wrap`函数运行时所有的参数（arguments）
        var args = new Array(arguments.length);

        // 遍历获取
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
        }

        // 运行并修改 `fn` 的`this`指向，使其指向为`thisArg，并传入原先的保存的`args`数据
        return fn.apply(thisArg, args);
    };
};
