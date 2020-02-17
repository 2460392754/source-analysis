'use strict';

/**
 * 浏览器控制台打印出已弃用方法的警告内容
 *
 * @param {string} method 已弃用的方法
 * @param {string} [instead] 可以的替代方法
 * @param {string} [docs] 获取更多详细信息的文档URL
 */
module.exports = function deprecatedMethod(method, instead, docs) {
    try {
        console.warn(
            'DEPRECATED method `' +
                method +
                '`.' +
                (instead ? ' Use `' + instead + '` instead.' : '') +
                ' This method will be removed in a future release.'
        );

        if (docs) {
            console.warn('For more information about usage see ' + docs);
        }
    } catch (e) {
        /* Ignore */
    }
};
