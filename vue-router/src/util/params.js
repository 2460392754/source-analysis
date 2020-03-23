import { warn } from './warn';
import Regexp from 'path-to-regexp';

// 创建一个纯净的空对象
const regexpCompileCache = Object.create(null);

/**
 *
 * @param {string} path
 * @param {Object} params
 * @param {string} routeMsg
 */
export function fillParams(path, params, routeMsg) {
    // 添加默认值
    params = params || {};

    try {
        // 封装 路径编译函数，并做缓存处理
        const filler =
            regexpCompileCache[path] || (regexpCompileCache[path] = Regexp.compile(path));

        // Fix #2505 resolving asterisk routes { name: 'not-found', params: { pathMatch: '/not-found' }}
        // and fix #3106 so that you can work with location descriptor object having params.pathMatch equal to empty string
        if (typeof params.pathMatch === 'string') params[0] = params.pathMatch;

        // TODO: `pretty`参数文档中找不到介绍
        return filler(params, { pretty: true });
    } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            // Fix #3072 no warn if `pathMatch` is string
            warn(
                typeof params.pathMatch === 'string',
                `missing param for ${routeMsg}: ${e.message}`
            );
        }
        return '';
    } finally {
        // TODO:为什么删除
        // delete the 0 if it was added
        delete params[0];
    }
}
