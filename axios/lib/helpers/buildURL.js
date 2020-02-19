'use strict';

var utils = require('./../utils');

// 对`params`上部分参数进行编码转义
function encode(val) {
    return encodeURIComponent(val)
        .replace(/%40/gi, '@')
        .replace(/%3A/gi, ':')
        .replace(/%24/g, '$')
        .replace(/%2C/gi, ',')
        .replace(/%20/g, '+')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']');
}

/**
 * 在URL结尾添加已序列化的`param`字符串
 *
 * @param {string} url 基地址
 * @param {object} [params] `params`参数
 * @param {object} paramsSerializer `params`序列化的函数
 * @returns {string} 返回序列化后的URL
 */
module.exports = function buildURL(url, params, paramsSerializer) {
    // `params`为空就直接返回
    if (!params) {
        return url;
    }

    // 序列号后的`params`字符串
    var serializedParams;

    // 是否有自定义的序列化函数
    if (paramsSerializer) {
        serializedParams = paramsSerializer(params);

        // `params`是否是`URLSearchParams`对象
    } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();

        // 格式化
    } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
            if (val === null || typeof val === 'undefined') {
                return;
            }

            /**
             * ``` js
             * [{ a: "a" }, { b: ["b", "c"] }]  =>  [{ a: ["a"] }, { "b[]": ["b", "c"] }]
             * ```
             */
            if (utils.isArray(val)) {
                key = key + '[]';
            } else {
                val = [val];
            }

            // 字段拼接
            utils.forEach(val, function parseValue(v) {
                if (utils.isDate(v)) {
                    v = v.toISOString();
                } else if (utils.isObject(v)) {
                    v = JSON.stringify(v);
                }
                parts.push(encode(key) + '=' + encode(v));
            });
        });

        serializedParams = parts.join('&');
    }

    // 拼接成完整的URL
    if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
            url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
};
