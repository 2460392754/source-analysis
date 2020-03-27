'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * 获取完整的url
 *
 * @param {string} baseURL 基地址
 * @param {string} requestedURL 绝对地址
 * @returns {string} 返回组合后完整的url
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
    // 有基地址并且相对地址不是绝地地址，就组合成完整的URL
    if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
    }

    return requestedURL;
};
