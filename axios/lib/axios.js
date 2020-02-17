'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * 创建一个`axios`实例对象
 *
 * @param {Object} defaultConfig 实例的默认配置
 * @return {Axios} 一个新的`axios`实例对象
 */
function createInstance(defaultConfig) {
    // 实例化一个axios
    var context = new Axios(defaultConfig);

    // 获取`Axios.prototype.request`修改this指向后并继承`context`参数后返回的函数 （单例）
    var instance = bind(Axios.prototype.request, context);

    // 把`Axios.prototype`上的参数遍历合并到`instance`上，如果是方法就会把`this`指向为`context`,并返回一个新的方法
    utils.extend(instance, Axios.prototype, context);

    // 把`context`中的属性遍历合并到`instance`上
    utils.extend(instance, context);

    // 返回这个实例
    return instance;
}

// 创建一个带有默认配置的`axios`实例
var axios = createInstance(defaults);

// 暴露一个Axios类，方便开发者进行扩展
axios.Axios = Axios;

// 使用工厂函数创建一个带有默认配置的`axios`实例对象
axios.create = function create(instanceConfig) {
    return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// 暴露一些方法
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// 暴露一个封装`Promise.all`的函数
axios.all = function all(promises) {
    return Promise.all(promises);
};

// 暴露一个工具函数`spread`
axios.spread = require('./helpers/spread');

// 导出`axios`
module.exports = axios;

// 默认导出`axios`
module.exports.default = axios;
