'use strict';

/**
 * 创建一个构造函数
 *
 * @class
 * @param {string=} message 取消消息
 */
function Cancel(message) {
    this.message = message;
}

// `Cancel`函数上扩展方法
Cancel.prototype.toString = function toString() {
    return 'Cancel' + (this.message ? ': ' + this.message : '');
};

// `Cancel`函数原型上添加标识属性
Cancel.prototype.__CANCEL__ = true;

// 导出`Cancel`
module.exports = Cancel;
