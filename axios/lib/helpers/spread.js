'use strict';

/**
 * 封装`Function.prototype.apply`功能
 *
 * ``` js
 * spread(function(a,b){
 *      return a + b;
 * }) ([1, 2])
 * ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
    return function wrap(arr) {
        return callback.apply(null, arr);
    };
};
