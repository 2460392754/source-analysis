'use strict';

var utils = require('./../utils');

// 实例化后创建一个拦截器容器
function InterceptorManager() {
    this.handlers = [];
}

/**
 * 添加新的拦截器
 *
 * @param {Function} fulfilled 处理`Promise`中的`resolve`回调
 * @param {Function} rejected 处理`Promise`中的``reject`回调
 * @return {Number} 返回一个注册拦截器后的容器索引，可以用于注销
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
    });
    return this.handlers.length - 1;
};

/**
 * 注销拦截器
 *
 * @param {Number} id 注册后返回的索引id
 */
InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
        this.handlers[id] = null;
    }
};

/**
 * 遍历容器中所有的拦截器
 *
 * @param {Function} fn 每次遍历时运行的回调函数
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
        // 跳过已注销的对象
        if (h !== null) {
            fn(h);
        }
    });
};

module.exports = InterceptorManager;
