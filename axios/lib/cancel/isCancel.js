'use strict';

// 是否已经终止请求
module.exports = function isCancel(value) {
    return !!(value && value.__CANCEL__);
};
