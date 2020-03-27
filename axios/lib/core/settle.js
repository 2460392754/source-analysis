'use strict';

var createError = require('./createError');

/**
 * 验证http状态码
 *
 * @param {Function} resolve `Promise`的`resolve`的回调函数
 * @param {Function} reject `Promise`的`reject`的回调函数
 * @param {object} response 请求的响应内容
 */
module.exports = function settle(resolve, reject, response) {
    var validateStatus = response.config.validateStatus;

    // 运行自定义验证http状态码函数
    if (!validateStatus || validateStatus(response.status)) {
        resolve(response);
    } else {
        reject(
            createError(
                'Request failed with status code ' + response.status,
                response.config,
                null,
                response.request,
                response
            )
        );
    }
};
