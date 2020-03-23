/**
 * 合并路径
 * @param {string} relative 页面路径
 * @param {string} base 基路径
 * @param {boolean} append 路径是否和基路径合并
 * @returns {string}
 */
export function resolvePath(relative, base, append) {
    // 获取路径的第一个字符，用来判断路径类型
    const firstChar = relative.charAt(0);

    // 相对地址
    if (firstChar === '/') {
        return relative;
    }

    // URL的`params`参数字符串 或 h5 hash地址
    if (firstChar === '?' || firstChar === '#') {
        return base + relative;
    }

    // 已'/'进行分割基路径字符串
    const stack = base.split('/');

    // 不合并 或 `base`最后一个字符是`/`，则删除 地址栈 分割后数组的最后一个数据（空字串）
    if (!append || !stack[stack.length - 1]) {
        stack.pop();
    }

    // 正则删除页面路径的首字符'/',并已'/'分割成数组
    const segments = relative.replace(/^\//, '').split('/');

    // 遍历
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        // 路径字符传是'..'(返回到父级路径)，则删除 地址栈数组的最后一个数据
        if (segment === '..') {
            stack.pop();

            // 路径字符不是'.'(返回当前路径)，则 把路径添加到地址栈中
        } else if (segment !== '.') {
            stack.push(segment);
        }
    }

    // 去重添加头部空字符串 (最后合并路径的时候是已'/'开头)
    if (stack[0] !== '') {
        stack.unshift('');
    }

    // 合并路径
    return stack.join('/');
}

/**
 * 解析地址，获取 path、hash、query
 * @param {string} path
 * @returns {Object}
 */
export function parsePath(path) {
    let hash = '';
    let query = '';

    const hashIndex = path.indexOf('#');

    // 如果 hash地址，就拆分URL中的path和hash
    if (hashIndex >= 0) {
        hash = path.slice(hashIndex);
        path = path.slice(0, hashIndex);
    }

    const queryIndex = path.indexOf('?');

    // TODO: 地址中同时有`hash`和`query`时，`path`的值最后不会删除`hash`地址
    if (queryIndex >= 0) {
        query = path.slice(queryIndex + 1);
        path = path.slice(0, queryIndex);
    }

    return {
        path,
        query,
        hash
    };
}

/**
 * 路径格式转换，双斜杠转换单斜杠，'//' => '/'
 * @param { string } path
 * @return { string }
 */
export function cleanPath(path) {
    return path.replace(/\/\//g, '/');
}
