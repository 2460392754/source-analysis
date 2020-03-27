'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * 创建一个实例`Axios`对象
 *
 * @param {Object} instanceConfig 实例配置或者默认配置
 */
function Axios(instanceConfig) {
    // 默认配置+实例配置合并后的配置
    this.defaults = instanceConfig;

    // 实例化2个拦截器对象，分别存储请求和响应类型
    this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
    };
}

/**
 * Dispatch a request
 *
 * @param {Object} config 请求配置
 */
Axios.prototype.request = function request(config) {
    /**
     * 其他调用的传参方式，`config`默认参数为空对象
     *
     * ``` js
     * axios('example/url', config)
     * ```
     */
    if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
    } else {
        config = config || {};
    }

    // 合并
    config = mergeConfig(this.defaults, config);

    // `method`转小写，执行顺序 请求配置 > 默认配置+实例配置合并后的配置 > 默认值`get`
    if (config.method) {
        config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
    } else {
        config.method = 'get';
    }

    // 创建一个存储拦截器的容器
    var chain = [dispatchRequest, undefined];

    // Promise执行链
    var promise = Promise.resolve(config);

    // 遍历请求拦截器，在容器头部添加
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    // 遍历响应拦截器，在容器尾部添加
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
    });

    // 遍历容器，改成Promise执行链
    // 执行顺序，请求拦截器 > 请求适配器 > 响应拦截器
    while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
};

// 获取 统一资源标识符(URI)
Axios.prototype.getUri = function getUri(config) {
    config = mergeConfig(this.defaults, config);

    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Axios原型上添加其他请求辅助方法
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    Axios.prototype[method] = function(url, config) {
        return this.request(
            utils.merge(config || {}, {
                method: method,
                url: url
            })
        );
    };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    Axios.prototype[method] = function(url, data, config) {
        return this.request(
            utils.merge(config || {}, {
                method: method,
                url: url,
                data: data
            })
        );
    };
});

module.exports = Axios;
