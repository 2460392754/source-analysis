'use strict';

/**
 * 判断URL是否是绝对地址
 *
 * @param {string} url 被测试的URL
 * @returns {boolean} 是否是绝对地址
 */
module.exports = function isAbsoluteURL(url) {
    // 正则匹配判断，URL是否为以协议开头(头部协议里包含'//'或'://')，例如'http://'
    return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
};
