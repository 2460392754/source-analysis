import { warn } from './warn';

// 正则字符串匹配全局的 '['、']'、'!'、"'"、'('、')'、'*' 每个字符
const encodeReserveRE = /[!'()*]/g;

// 解析转换，先转换为UniCode，再转换为16进制
const encodeReserveReplacer = (c) => '%' + c.charCodeAt(0).toString(16);

// 正则字符串匹配全局的 '%2C' 字符
const commaRE = /%2C/g;

// 字符串编码 函数封装
const encode = (str) =>
    encodeURIComponent(str)
        .replace(encodeReserveRE, encodeReserveReplacer)
        // 正则替换成 ','字符
        .replace(commaRE, ',');

// 缩短变量名
const decode = decodeURIComponent;

/**
 * query 解析封装处理
 * @param {Object} query URL上的`query`对象
 * @param {*} extraQuery
 * @param {*} _parseQuery
 */
export function resolveQuery(query, extraQuery = {}, _parseQuery) {
    // 添加默认 query 解析方法
    const parse = _parseQuery || parseQuery;
    let parsedQuery;

    try {
        // 添加默认值，捕获非对象解析抛出的错误
        parsedQuery = parse(query || '');
    } catch (e) {
        // 非生产环境下抛出警告
        process.env.NODE_ENV !== 'production' && warn(false, e.message);

        // 初始化为空对象
        parsedQuery = {};
    }

    // 浅拷贝
    for (const key in extraQuery) {
        parsedQuery[key] = extraQuery[key];
    }

    return parsedQuery;
}

/**
 * query 解析转换
 * @param {string} query
 * @returns {Object}
 */
function parseQuery(query) {
    const res = {};

    // 去除空格和 其他的多余首字符符号
    query = query.trim().replace(/^(\?|#|&)/, '');

    if (!query) {
        return res;
    }

    // 字符切割并遍历
    query.split('&').forEach((param) => {
        const parts = param.replace(/\+/g, ' ').split('=');
        const key = decode(parts.shift());
        const val = parts.length > 0 ? decode(parts.join('=')) : null;

        if (res[key] === undefined) {
            res[key] = val;
        } else if (Array.isArray(res[key])) {
            res[key].push(val);
        } else {
            res[key] = [res[key], val];
        }
    });

    return res;
}

/**
 * query 反解析
 * @param {Object} obj
 * @returns {string}
 */
export function stringifyQuery(obj) {
    // 获取 转换后的新对象
    const res = obj
        ? Object.keys(obj)
              .map((key) => {
                  const val = obj[key];

                  if (val === undefined) {
                      return '';
                  }

                  if (val === null) {
                      return encode(key);
                  }

                  // TODO: 这样只能处理 1维数组，不知道为什么要这么写
                  if (Array.isArray(val)) {
                      const result = [];

                      val.forEach((val2) => {
                          if (val2 === undefined) {
                              return;
                          }

                          if (val2 === null) {
                              result.push(encode(key));
                          } else {
                              result.push(encode(key) + '=' + encode(val2));
                          }
                      });

                      return result.join('&');
                  }

                  return encode(key) + '=' + encode(val);
              })
              .filter((x) => x.length > 0)
              .join('&')
        : null;

    return res ? `?${res}` : '';
}
