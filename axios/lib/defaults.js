'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

// 默认`headers`的`content-type`配置
var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
};

// 设置`headers`中的`content-type`
function setContentTypeIfUnset(headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
    }
}

// 获取默认的适配器
function getDefaultAdapter() {
    var adapter;
    // 只有NodeJs有`process`这个变量
    if (
        typeof process !== 'undefined' &&
        Object.prototype.toString.call(process) === '[object process]'
    ) {
        // 来自NodeJs的http适配器
        adapter = require('./adapters/http');
    } else if (typeof XMLHttpRequest !== 'undefined') {
        // 来自浏览器的xhr适配器
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

            if (
                utils.isFormData(data) || // `FormData`对象类型
                utils.isArrayBuffer(data) ||
                utils.isBuffer(data) || // 字符串缓冲区
                utils.isStream(data) || // `Object`类型或函数类型
                utils.isFile(data) || // `File`对象类型
                utils.isBlob(data) // `Blob`对象类型
            ) {
                return data;
            }

            // 是否是 二进制数据缓冲区
            if (utils.isArrayBufferView(data)) {
                return data.buffer;
            }

            // 是否是`URLSearchParams`对象类型
            if (utils.isURLSearchParams(data)) {
                setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
                return data.toString();
            }

            // 是否是对象类型
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

    // xsrf cookie 键名
    xsrfCookieName: 'XSRF-TOKEN',

    // xsrf headers 键名
    xsrfHeaderName: 'X-XSRF-TOKEN',

    // 允许的响应内容的最大尺寸
    maxContentLength: -1,

    // 验证 http code
    validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
    }
};

// 默认公共配置
defaults.headers = {
    common: {
        Accept: 'application/json, text/plain, */*'
    }
};

// 根据不同的`method`配置`headers`
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
