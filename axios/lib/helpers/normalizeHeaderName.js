'use strict';

var utils = require('../utils');

/**
 * 规范化`headers`属性名称
 * @param {Object} headers 请求中的`headers`对象
 * @param {string} normalizedName 需要规范后的名称
 */
module.exports = function normalizeHeaderName(headers, normalizedName) {
    utils.forEach(headers, function processHeader(value, name) {
        // 只有字符串大小写不相同才会修改
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
            headers[normalizedName] = value;
            delete headers[name];
        }
    });
};
