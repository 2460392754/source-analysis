'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
    // 返回`Promise`对象
    return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        // 当`data`为`FormData`类型，则删除`headers`中的`content-type`
        // 让浏览器自己设置, 这样可以避免传输的值类型不同
        if (utils.isFormData(requestData)) {
            delete requestHeaders['Content-Type'];
        }

        // 实例化一个`xhr`对象
        var request = new XMLHttpRequest();

        // http 基本身份验证
        if (config.auth) {
            var username = config.auth.username || '';
            var password = config.auth.password || '';
            requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        // 获取完整的URL
        var fullPath = buildFullPath(config.baseURL, config.url);

        // 初始化请求
        request.open(
            // 获取大写的`method`
            config.method.toUpperCase(),

            // 在URL结尾添加已序列化的`param`字符串
            buildURL(fullPath, config.params, config.paramsSerializer),

            // 是否异步执行
            true
        );

        // 设置请求超时时间，单位ms
        request.timeout = config.timeout;

        // `XMLHttpRequest.prototype.readyState`的值发生变化，会触发这个回调函数
        request.onreadystatechange = function handleLoad() {
            // 请求未传输完成或运行结束
            if (!request || request.readyState !== 4) {
                return;
            }

            // 请求执行完成，但是出现错误(`status`等于0) 或者 发送请求使用的是'file'协议
            if (
                request.status === 0 &&
                !(request.responseURL && request.responseURL.indexOf('file:') === 0)
            ) {
                return;
            }

            // 获取响应头
            var responseHeaders =
                'getAllResponseHeaders' in request
                    ? parseHeaders(request.getAllResponseHeaders()) // 解析`headers`字符串转换为对象
                    : null;

            // 获取响应值，`config.responseType`为'null'或'text'，则返回`request.responseText`
            var responseData =
                !config.responseType || config.responseType === 'text'
                    ? request.responseText
                    : request.response;

            // 封装响应数据
            var response = {
                data: responseData,
                status: request.status,
                statusText: request.statusText,
                headers: responseHeaders,
                config: config,
                request: request
            };

            // 验证http状态码
            settle(resolve, reject, response);

            // 清除请求对象
            request = null;
        };

        // 处理终止请求
        request.onabort = function handleAbort() {
            // 避免终止已经请求完成的请求
            if (!request) {
                return;
            }

            reject(createError('Request aborted', config, 'ECONNABORTED', request));

            // 清除请求对象
            request = null;
        };

        // 处理错误请求（网络错误）
        request.onerror = function handleError() {
            // Real errors are hidden from us by the browser
            // onerror should only fire if it's a network error
            reject(createError('Network Error', config, null, request));

            // 清除请求对象
            request = null;
        };

        // 处理请求超时
        request.ontimeout = function handleTimeout() {
            reject(
                createError(
                    'timeout of ' + config.timeout + 'ms exceeded',
                    config,
                    'ECONNABORTED',
                    request
                )
            );

            // 清除请求对象
            request = null;
        };

        // 是在标准浏览器环境中，并且配置 xsrf
        if (utils.isStandardBrowserEnv()) {
            var cookies = require('./../helpers/cookies');

            // Add xsrf header
            var xsrfValue =
                (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName
                    ? cookies.read(config.xsrfCookieName)
                    : undefined;

            if (xsrfValue) {
                requestHeaders[config.xsrfHeaderName] = xsrfValue;
            }
        }

        // 添加`headers`到`request`中
        if ('setRequestHeader' in request) {
            // 遍历添加
            utils.forEach(requestHeaders, function setRequestHeader(val, key) {
                // 如果`data`为`undefined`，则删除`headers`中的`content-type`属性，让浏览器自己选择属性
                if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
                    delete requestHeaders[key];
                } else {
                    request.setRequestHeader(key, val);
                }
            });
        }

        // 给`request`添加跨域请求凭证
        if (config.withCredentials) {
            request.withCredentials = true;
        }

        // 添加`responseType`到`request`中
        if (config.responseType) {
            try {
                request.responseType = config.responseType;
            } catch (e) {
                // 避免不兼容低版本浏览器，但是`JSON`没有关系，它可以由`defaults.transformResponse`处理
                if (config.responseType !== 'json') {
                    throw e;
                }
            }
        }

        // 处理请求的进度回调函数
        if (typeof config.onDownloadProgress === 'function') {
            request.addEventListener('progress', config.onDownloadProgress);
        }

        // 处理请求上传文件的进度回调函数，但有部分浏览器不兼容
        if (typeof config.onUploadProgress === 'function' && request.upload) {
            request.upload.addEventListener('progress', config.onUploadProgress);
        }

        // 处理取消请求
        if (config.cancelToken) {
            // 处理 请求处理回调
            config.cancelToken.promise.then(function onCanceled(cancel) {
                if (!request) {
                    return;
                }

                // 停止请求发送
                request.abort();

                reject(cancel);

                // 清除请求对象
                request = null;
            });
        }

        if (requestData === undefined) {
            requestData = null;
        }

        // 发生请求
        request.send(requestData);
    });
};
