'use strict';

/**
 * 合并一些参数
 *
 * @param {function} fn
 * @param {Object} thisArg
 * @return {}
 */
module.exports = function bind(fn, thisArg) {
    // 返回闭包函数
    return function wrap() {
        // 创建一个数组并存入所有wrap运行时的参数（arguments）
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
        }

        // 运行并修改 `fn` 的`this`指向，值向为`thisArg`并导入原先的保存的数据`args`
        return fn.apply(thisArg, args);
    };
};
