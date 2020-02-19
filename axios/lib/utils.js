'use strict';

var bind = require('./helpers/bind');
var isBuffer = require('is-buffer');

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
    return toString.call(val) === '[object Array]';
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
    return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
    return typeof FormData !== 'undefined' && val instanceof FormData;
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
    var result;
    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
        result = ArrayBuffer.isView(val);
    } else {
        result = val && val.buffer && val.buffer instanceof ArrayBuffer;
    }
    return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
    return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
    return typeof val === 'number';
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
    return typeof val === 'undefined';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
    return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
    return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
    return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
    return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
    return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
    return isObject(val) && isFunction(val.pipe);
}

/**
 * 判断对象是否是`URLSearchParams`类型
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
    return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
}

/**
 * 去除字符串开头和结尾多余的空格
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
    return str.replace(/^\s*/, '').replace(/\s*$/, '');
}

/**
 * 是否是在标准浏览器环境中
 * `web workers`环境里, `window`和`document`字段为`undefined`
 * `react-native`环境里, `navigator.product`字段为'ReactNative'
 * `nativescript`环境里, `navigator.product`字段为'NativeScript'或'NS'
 */
function isStandardBrowserEnv() {
    if (
        typeof navigator !== 'undefined' &&
        (navigator.product === 'ReactNative' ||
            navigator.product === 'NativeScript' ||
            navigator.product === 'NS')
    ) {
        return false;
    }

    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * 遍历对象并运行回调函数
 *
 * @param {Object|Array} obj 需要迭代的对象
 * @param {Function} fn 每次迭代时调用的回调函数
 */
function forEach(obj, fn) {
    // 没有值就直接返回空
    if (obj === null || typeof obj === 'undefined') {
        return;
    }

    // 如果为不为`Object`或者`Array`，则转换为数组类型
    if (typeof obj !== 'object') {
        obj = [obj];
    }

    if (isArray(obj)) {
        // 遍历数组
        for (var i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
        }
    } else {
        // 遍历对象
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                fn.call(null, obj[key], key, obj);
            }
        }
    }
}

/**
 * 拷贝合并
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
    var result = {};

    // 拷贝 + 递归
    function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
            result[key] = merge(result[key], val);
        } else {
            result[key] = val;
        }
    }

    // 遍历 参数列表
    for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
    }

    return result;
}

/**
 * 深拷贝合并
 *
 * @see merge
 * @param {Object} obj1 需要合并的参数列表
 * @returns {Object} 返回一个新的已合并的对象
 */
function deepMerge(/* obj1, obj2, obj3, ... */) {
    var result = {};

    // 拷贝 + 递归
    function assignValue(val, key) {
        if (typeof result[key] === 'object' && typeof val === 'object') {
            result[key] = deepMerge(result[key], val);
        } else if (typeof val === 'object') {
            result[key] = deepMerge({}, val);
        } else {
            result[key] = val;
        }
    }

    // 遍历 参数列表
    for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
    }

    return result;
}

/**
 * 动态扩展对象`a`的属性或方法
 *
 * @param {Object} a 需要扩展的对象
 * @param {Object} b 被遍历复制的对象
 * @param {Object} thisArg 修改方法`this`指向的对象
 * @return {Object} 返回扩展后的对象`a`
 */
function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
        // `thisArg`存在并且`val`是函数
        if (thisArg && typeof val === 'function') {
            a[key] = bind(val, thisArg);
        } else {
            a[key] = val;
        }
    });
    return a;
}

module.exports = {
    isArray: isArray,
    isArrayBuffer: isArrayBuffer,
    isBuffer: isBuffer,
    isFormData: isFormData,
    isArrayBufferView: isArrayBufferView,
    isString: isString,
    isNumber: isNumber,
    isObject: isObject,
    isUndefined: isUndefined,
    isDate: isDate,
    isFile: isFile,
    isBlob: isBlob,
    isFunction: isFunction,
    isStream: isStream,
    isURLSearchParams: isURLSearchParams,
    isStandardBrowserEnv: isStandardBrowserEnv,
    forEach: forEach,
    merge: merge,
    deepMerge: deepMerge,
    extend: extend,
    trim: trim
};
