'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

// 默认配置
var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
};

// 设置`headers`中的`content-type`
function setContentTypeIfUnset(headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
    }
}

function getDefaultAdapter() {
    var adapter;
    // Only Node.JS has a process variable that is of [[Class]] process
    if (
        typeof process !== 'undefined' &&
        Object.prototype.toString.call(process) === '[object process]'
    ) {
        // For node use HTTP adapter
        adapter = require('./adapters/http');
    } else if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = require('./adapters/xhr');
    }
    return adapter;
}

var defaults = {
    adapter: getDefaultAdapter(),

    transformRequest: [
        // 请求转换
        function transformRequest(data, headers) {
            // 设置规范化的名称
            normalizeHeaderName(headers, 'Accept');
            normalizeHeaderName(headers, 'Content-Type');

            // TODO: 下面这一段注释没写完，

            if (
                utils.isFormData(data) ||
                utils.isArrayBuffer(data) ||
                utils.isBuffer(data) ||
                utils.isStream(data) ||
                utils.isFile(data) ||
                utils.isBlob(data)
            ) {
                return data;
            }

            if (utils.isArrayBufferView(data)) {
                return data.buffer;
            }

            if (utils.isURLSearchParams(data)) {
                setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
                return data.toString();
            }

            if (utils.isObject(data)) {
                setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
                return JSON.stringify(data);
            }

            return data;
        }
    ],

    transformResponse: [
        // 响应转换
        function transformResponse(data) {
            // 尝试对响应后的数据转JSON
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (e) {}
            }

            return data;
        }
    ],

    // 设置请求超时时间，单位ms，默认为0（不设置）
    timeout: 0,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',

    maxContentLength: -1,

    // 验证 http code
    validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
    }
};

// 默认配置
defaults.headers = {
    common: {
        Accept: 'application/json, text/plain, */*'
    }
};

// 初始化`headers`
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
});

// `method`为'post', 'put', 'patch'，则添加默认的`headers`的`content-type`
utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

// 导出
module.exports = defaults;
