import { inBrowser } from './dom';

// 判断环境 获取 普通或高精度的时间戳
const Time = inBrowser && window.performance && window.performance.now ? window.performance : Date;

/**
 * 封装数据，时间戳并忽略小数点后3位的数据
 * @returns {number}
 */
export function genStateKey() {
    return Time.now().toFixed(3);
}

// 时间戳 键值
let _key = genStateKey();

/**
 * 获取 时间戳
 * @returns {number}
 */
export function getStateKey() {
    return _key;
}

/**
 * 设置并获取 时间戳
 * @param {number} key
 * @returns {number}
 */
export function setStateKey(key) {
    return (_key = key);
}
