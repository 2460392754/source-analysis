'use strict';

/**
 * 通过指定的URL组合成新的URL
 *
 * @param {string} baseURL 基地址
 * @param {string} relativeURL 相对地址
 * @returns {string} 组合后的URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '') // 正则匹配取消`baseURL`结尾和`relativeURL`开头的斜杠，再手动添加斜杠，防止组合URL中出现多余的斜杠导致请求出现问题
        : baseURL;
};
