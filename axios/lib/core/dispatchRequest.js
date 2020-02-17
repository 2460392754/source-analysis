'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

// 如果已取消请求，则抛出取消请求的消息内容
function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
    }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config 用于发送请求的配置数据
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    // 添加默认值为空对象，防止代码运行出现错误
    config.headers = config.headers || {};

    // 获取转换后的`data`数据
    config.data = transformData(config.data, config.headers, config.transformRequest);

    // 合并`headers`数据
    config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers || {}
    );

    // 删除`headers`中配置的自定义`method`属性数据
    utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
            delete config.headers[method];
        }
    );

    var adapter = config.adapter || defaults.adapter;

    return adapter(config).then(
        function onAdapterResolution(response) {
            throwIfCancellationRequested(config);

            // Transform response data
            response.data = transformData(
                response.data,
                response.headers,
                config.transformResponse
            );

            return response;
        },
        function onAdapterRejection(reason) {
            if (!isCancel(reason)) {
                throwIfCancellationRequested(config);

                // Transform response data
                if (reason && reason.response) {
                    reason.response.data = transformData(
                        reason.response.data,
                        reason.response.headers,
                        config.transformResponse
                    );
                }
            }

            return Promise.reject(reason);
        }
    );
};
