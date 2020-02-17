'use strict';

/**
 * 增强显示错误
 *
 * @param {Error} error `Error`实例化对象
 * @param {Object} config 抛出错误时的`config`数据
 * @param {string} [code] 错误代码, 例如 'ECONNABORTED'
 * @param {Object} [request]
 * @param {Object} [response]
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
    error.config = config;

    if (code) {
        error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function() {
        return {
            // 基本内容
            message: this.message,
            name: this.name,

            // IE或者EDGE
            description: this.description,
            number: this.number,

            // 火狐
            fileName: this.fileName,
            lineNumber: this.lineNumber,
            columnNumber: this.columnNumber,
            stack: this.stack,

            // Axios的配置信息
            config: this.config,
            code: this.code
        };
    };

    return error;
};
