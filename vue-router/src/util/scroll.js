import { assert } from './warn';
import { getStateKey, setStateKey } from './state-key';

// 滚动条定位位置 存储容器
const positionStore = Object.create(null);

/**
 * 设置滚动条
 * 添加 当前路由页面的历史记录
 * TOOD：没有准确的介绍
 */
export function setupScroll() {
    // 拼接 协议+域名
    const protocolAndPath = window.location.protocol + '//' + window.location.host;

    // 去除 协议+域名 之后的路径
    const absolutePath = window.location.href.replace(protocolAndPath, '');

    // 修改当前页面的历史记录
    window.history.replaceState({ key: getStateKey() }, '', absolutePath);

    // 绑定事件 [https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event]
    window.addEventListener('popstate', (e) => {
        saveScrollPosition();

        if (e.state && e.state.key) {
            setStateKey(e.state.key);
        }
    });
}

/**
 * 处理滚动条
 * @param {*} router 路由实例
 * @param {*} to 当前激活的路由信息对象
 * @param {*} from 之前的路由信息对象
 * @param {boolean} isPop 是否 通过浏览器的 前进/后退 按钮触发
 */
export function handleScroll(router, to, from, isPop) {
    if (!router.app) {
        return;
    }

    // 设置的滚动处理函数
    const behavior = router.options.scrollBehavior;

    if (!behavior) {
        return;
    }

    // 非生产环境判断 滚动函数是否是 `Function` 类型
    if (process.env.NODE_ENV !== 'production') {
        assert(typeof behavior === 'function', `scrollBehavior must be a function`);
    }

    // 在滚动之前等待重新渲染完成
    router.app.$nextTick(() => {
        const position = getScrollPosition();

        // 修改 滚动函数的this的指向，并填充参数
        const shouldScroll = behavior.call(router, to, from, isPop ? position : null);

        // 返回值是虚值时，结束运行
        if (!shouldScroll) {
            return;
        }

        // 判断 滚动函数中是否返回了`Promise`回调函数
        if (typeof shouldScroll.then === 'function') {
            shouldScroll
                .then((shouldScroll) => {
                    scrollToPosition(shouldScroll, position);
                })
                .catch((err) => {
                    if (process.env.NODE_ENV !== 'production') {
                        assert(false, err.toString());
                    }
                });
        } else {
            scrollToPosition(shouldScroll, position);
        }
    });
}

/**
 * 保存 滚动条的定位位置
 */
export function saveScrollPosition() {
    const key = getStateKey();

    if (key) {
        positionStore[key] = {
            x: window.pageXOffset, // window.scrollX的别名
            y: window.pageYOffset
        };
    }
}

/**
 * 获取 滚动条的定位位置
 */
function getScrollPosition() {
    const key = getStateKey();

    if (key) {
        return positionStore[key];
    }
}

/**
 * 获取 当前元素的定位位置
 * TODO: 为什么不直接用 Element.offsetTop ，而是用根元素相减
 * @param {Element} el 元素
 * @param {*} offset
 */
function getElementPosition(el, offset) {
    // 文档（HTML标签）
    const docEl = document.documentElement;

    // 获取 元素的大小及其相对于 浏览器显示的视图窗口的位置
    const docRect = docEl.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    return {
        x: elRect.left - docRect.left - offset.x,
        y: elRect.top - docRect.top - offset.y
    };
}

// 是否填写了 offset对象中x或y参数
function isValidPosition(obj) {
    return isNumber(obj.x) || isNumber(obj.y);
}

// 规范化 Position，设置默认值
function normalizePosition(obj) {
    return {
        x: isNumber(obj.x) ? obj.x : window.pageXOffset,
        y: isNumber(obj.y) ? obj.y : window.pageYOffset
    };
}

// 规范化 Offset，设置默认值
function normalizeOffset(obj) {
    return {
        x: isNumber(obj.x) ? obj.x : 0,
        y: isNumber(obj.y) ? obj.y : 0
    };
}

// 判断类型是否是 数值类型
function isNumber(v) {
    return typeof v === 'number';
}

// 判断是否是 哈希为首字母(#)并且之后的第一个字符是否是数字
const hashStartsWithNumberRE = /^#\d/;

/**
 * 滚动条跳转到指定位置
 * @param {Object} shouldScroll `router.options.scrollBehavior`中配置的应该滚动的位置
 * @param {Object|null} position 滚动条的定位位置
 */
function scrollToPosition(shouldScroll, position) {
    // 判断是否是对象形象
    const isObject = typeof shouldScroll === 'object';

    // 判断是否是对象,并且开发者填写了 选择器字符串
    if (isObject && typeof shouldScroll.selector === 'string') {
        // // getElementById would still fail if the selector contains a more complicated query like #main[data-attr]
        // // but at the same time, it doesn't make much sense to select an element with an id and an extra selector

        // 判断 选择器字符串 择优选择查找元素的方法 (id选择器查找速度更快)
        const el = hashStartsWithNumberRE.test(shouldScroll.selector)
            ? document.getElementById(shouldScroll.selector.slice(1))
            : document.querySelector(shouldScroll.selector);

        if (el) {
            // 缩短变量长度并设置默认值
            let offset =
                shouldScroll.offset && typeof shouldScroll.offset === 'object'
                    ? shouldScroll.offset
                    : {};

            offset = normalizeOffset(offset);
            position = getElementPosition(el, offset);

            // 开发者是否填写了 shouldScroll
        } else if (isValidPosition(shouldScroll)) {
            position = normalizePosition(shouldScroll);
        }

        // 判断是否是对象,并且开发者是否填写了 shouldScroll
    } else if (isObject && isValidPosition(shouldScroll)) {
        position = normalizePosition(shouldScroll);
    }

    // 让浏览器的滚动条跳转到指定位置
    if (position) {
        window.scrollTo(position.x, position.y);
    }
}
