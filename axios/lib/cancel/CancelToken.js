'use strict';

var Cancel = require('./Cancel');

/**
 * 取消请求
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
    // `executor`必须是函数
    if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
    }

    var resolvePromise;
    // 添加了一个 状态为`pending`的`promise`实例对象
    this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
    });

    var token = this;
    executor(function cancel(message) {
        // Cancel 只能实例化一次，已取消请求
        if (token.reason) {
            return;
        }

        // 实例上添加一个`Cancel`实例对象
        token.reason = new Cancel(message);
        resolvePromise(token.reason);
    });
}

/**
 * 如果已终止请求，则抛出`Cancel`实例对象
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
    if (this.reason) {
        throw this.reason;
    }
};

/**
 * 创建一个工厂函数
 *
 * @return 返回`CancelToken`实例对象和`Cancel`实例对象
 */
CancelToken.source = function source() {
    var cancel;

    // 传入一个回调函数获取实例化后的`Cancel`对象
    var token = new CancelToken(function executor(c) {
        cancel = c;
    });

    return {
        token: token,
        cancel: cancel
    };
};

// 导出`CancelToken`函数
module.exports = CancelToken;
