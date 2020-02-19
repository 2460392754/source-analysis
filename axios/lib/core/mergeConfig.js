'use strict';

var utils = require('../utils');

/**
 * 合并配置，实例配置的数据合并优先级高于默认配置
 *
 * @param {Object} config1 默认配置
 * @param {Object} config2 实例配置
 * @returns {Object} 返回一个完整合并后的配置
 */
module.exports = function mergeConfig(config1, config2) {
    // 给实例配置添加默认值
    config2 = config2 || {};

    var config = {};

    // 实例配置的键名字段
    var valueFromConfig2Keys = ['url', 'method', 'params', 'data'];

    // 深拷贝合并属性键名字段
    var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy'];

    // 实例配置中默认的键名字段
    var defaultToConfig2Keys = [
        'baseURL',
        'url',
        'transformRequest',
        'transformResponse',
        'paramsSerializer',
        'timeout',
        'withCredentials',
        'adapter',
        'responseType',
        'xsrfCookieName',
        'xsrfHeaderName',
        'onUploadProgress',
        'onDownloadProgress',
        'maxContentLength',
        'validateStatus',
        'maxRedirects',
        'httpAgent',
        'httpsAgent',
        'cancelToken',
        'socketPath'
    ];

    // 浅拷贝
    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
            config[prop] = config2[prop];
        }
    });

    // 深拷贝属性合并执行顺序，实例深拷贝 > 实例浅拷贝 > 默认深拷贝 > 默认浅拷贝
    utils.forEach(mergeDeepPropertiesKeys, function mergeDeepProperties(prop) {
        // 实例配置中这个键值是对象类型，则进行深拷贝
        if (utils.isObject(config2[prop])) {
            config[prop] = utils.deepMerge(config1[prop], config2[prop]);

            // 实例配置的键值不为空就浅拷贝
        } else if (typeof config2[prop] !== 'undefined') {
            config[prop] = config2[prop];

            // 默认配置中这个键值是对象类型，则进行深拷贝
        } else if (utils.isObject(config1[prop])) {
            config[prop] = utils.deepMerge(config1[prop]);

            // 默认配置的键值不为空就浅拷贝
        } else if (typeof config1[prop] !== 'undefined') {
            config[prop] = config1[prop];
        }
    });

    // 浅拷贝默认字段执行顺序，实例浅拷贝 > 默认浅拷贝
    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
            config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
            config[prop] = config1[prop];
        }
    });

    // 三个数组合并之后的所有字段数组
    var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys);

    // `axiosKeys`中过滤掉`config2`拥有的键名字段之后剩下的字段
    var otherKeys = Object.keys(config2).filter(function filterAxiosKeys(key) {
        return axiosKeys.indexOf(key) === -1;
    });

    // 浅拷贝剩余字段执行顺序，实例浅拷贝 > 默认浅拷贝
    utils.forEach(otherKeys, function otherKeysDefaultToConfig2(prop) {
        if (typeof config2[prop] !== 'undefined') {
            config[prop] = config2[prop];
        } else if (typeof config1[prop] !== 'undefined') {
            config[prop] = config1[prop];
        }
    });

    return config;
};
