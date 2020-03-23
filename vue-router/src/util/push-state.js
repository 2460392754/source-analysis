import { inBrowser } from './dom';
import { saveScrollPosition } from './scroll';
import { genStateKey, setStateKey, getStateKey } from './state-key';
import { extend } from './misc';

/**
 * 是否支持 `window.history.pushState` 方法
 */
export const supportsPushState =
    inBrowser &&
    (function() {
        const ua = window.navigator.userAgent;

        // TODO: 低版本浏览器型号判断
        // 是 anroid 2.或4.0，浏览
        if (
            // 设备型号
            (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
            // 浏览器型号
            ua.indexOf('Mobile Safari') !== -1 &&
            ua.indexOf('Chrome') === -1 &&
            ua.indexOf('Windows Phone') === -1
        ) {
            return false;
        }

        // 判断 低版本浏览器兼容
        return window.history && 'pushState' in window.history;
    })();

/**
 * 添加或修改 新的历史记录
 * @param {string} url 地址
 * @param {boolean} replace 是否改成replace类型
 */
export function pushState(url, replace) {
    // 保存 滚动条的定位位置
    saveScrollPosition();

    //// try...catch the pushState call to get around Safari
    //// DOM Exception 18 where it limits to 100 pushState calls
    const history = window.history;

    // TODO: 使用history.pushState和location.assign的区别
    try {
        if (replace) {
            // 获取 当前的历史记录，并进行浅拷贝
            const stateCopy = extend({}, history.state);
            stateCopy.key = getStateKey();

            // 修改当前的历史记录
            history.replaceState(stateCopy, '', url);
        } else {
            // 添加新的历史记录
            history.pushState({ key: setStateKey(genStateKey()) }, '', url);
        }
    } catch (e) {
        // 兼容处理
        window.location[replace ? 'replace' : 'assign'](url);
    }
}

/**
 * 修改 当前历史记录
 * @param {string} url
 */
export function replaceState(url) {
    pushState(url, true);
}
