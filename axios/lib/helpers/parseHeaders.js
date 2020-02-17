'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
    'age',
    'authorization',
    'content-length',
    'content-type',
    'etag',
    'expires',
    'from',
    'host',
    'if-modified-since',
    'if-unmodified-since',
    'last-modified',
    'location',
    'max-forwards',
    'proxy-authorization',
    'referer',
    'retry-after',
    'user-agent'
];

/**
 * 解析`headers`字符串转换为对象
 *
 * @param {String} headers 需要解析的`headers`字符串
 * @returns {Object} 返回解析后的JSON
 */
module.exports = function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;

    // `headers`为空，直接返回空对象
    if (!headers) {
        return parsed;
    }

    // 已'\n'作为分隔符分割字符串来遍历`headers`的每一行
    utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');

        // 去除头尾空格，并且转小写
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
            // TODO: 不清楚为什么要过滤字段
            if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
                return;
            }
            if (key === 'set-cookie') {
                parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
            } else {
                parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
            }
        }
    });

    return parsed;
};
