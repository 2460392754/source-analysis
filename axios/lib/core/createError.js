'use strict';

var enhanceError = require('./enhanceError');

/**
 * 创建错误控制器
 *
 * @param {string} message 错误消息
 * @param {Object} config 抛出错误时的`config`数据
 * @param {string} [code] 错误代码, 例如 'ECONNABORTED'
 * @param {Object} [request]
 * @param {Object} [response]
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
    var error = new Error(message);

    return enhanceError(error, config, code, request, response);
};
