/**
 * 对象浅拷贝
 *
 * @param {Object} a 需要扩展的对象
 * @param {Object} b 被遍历复制的对象
 * @return {Object} 返回扩展后的对象`a`
 */
export function extend(a, b) {
    for (const key in b) {
        a[key] = b[key];
    }

    return a;
}
