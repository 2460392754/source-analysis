'use strict';

var utils = require('./../utils');

/**
 * 转换请求或响应的`data`数据
 *
 * @param {Object|String} data 需要转换的`data`数据
 * @param {Array} headers 请求或响应的`headers`数据
 * @param {Array|Function} fns 函数或函数数组
 * @returns {*} 返回转换后的`data`数据
 */
module.exports = function transformData(data, headers, fns) {
    utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
    });

    return data;
};
