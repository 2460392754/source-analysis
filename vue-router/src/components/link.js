import { createRoute, isSameRoute, isIncludedRoute } from '../util/route';
import { extend } from '../util/misc';
import { normalizeLocation } from '../util/location';
import { warn } from '../util/warn';

//// work around weird flow bug
const toTypes = [String, Object];
const eventTypes = [String, Array];

// 空内容回调函数
const noop = () => {};

export default {
    name: 'RouterLink',
    props: {
        to: {
            type: toTypes,
            required: true
        },
        tag: {
            type: String,
            default: 'a'
        },
        exact: Boolean,
        append: Boolean,
        replace: Boolean,
        activeClass: String,
        exactActiveClass: String,
        event: {
            type: eventTypes,
            default: 'click'
        }
    },
    render(h) {
        const router = this.$router;
        const current = this.$route;
        const { location, route, href } = router.resolve(this.to, current, this.append);
        const classes = {};

        // 获取 全局激活样式
        const globalActiveClass = router.options.linkActiveClass;

        // 获取 全局精确匹配激活样式
        const globalExactActiveClass = router.options.linkExactActiveClass;

        // 设置 默认全局激活样式
        const activeClassFallback =
            globalActiveClass == null ? 'router-link-active' : globalActiveClass;

        // 设置 默认全局精确匹配激活样式
        const exactActiveClassFallback =
            globalExactActiveClass == null ? 'router-link-exact-active' : globalExactActiveClass;

        // 设置 激活样式，优先级：私有 > 全局
        const activeClass = this.activeClass == null ? activeClassFallback : this.activeClass;

        // 设置 精确匹配激活样式，优先级：私有 > 全局
        const exactActiveClass =
            this.exactActiveClass == null ? exactActiveClassFallback : this.exactActiveClass;

        const compareTarget = route.redirectedFrom
            ? createRoute(null, normalizeLocation(route.redirectedFrom), null, router)
            : route;

        classes[exactActiveClass] = isSameRoute(current, compareTarget);
        classes[activeClass] = this.exact
            ? classes[exactActiveClass]
            : isIncludedRoute(current, compareTarget);

        // 封装 事件处理
        const handler = (e) => {
            if (guardEvent(e)) {
                if (this.replace) {
                    router.replace(location, noop);
                } else {
                    router.push(location, noop);
                }
            }
        };

        // 添加默认的click事件
        const on = { click: guardEvent };

        // 绑定事件
        if (Array.isArray(this.event)) {
            this.event.forEach((e) => {
                on[e] = handler;
            });
        } else {
            on[this.event] = handler;
        }

        // render函数默认参数
        const data = { class: classes };

        // 设置 作用域插槽
        const scopedSlot =
            !this.$scopedSlots.$hasNormal &&
            this.$scopedSlots.default &&
            this.$scopedSlots.default({
                href,
                route,
                navigate: handler,
                isActive: classes[activeClass],
                isExactActive: classes[exactActiveClass]
            });

        // 处理 作用域插槽
        if (scopedSlot) {
            if (scopedSlot.length === 1) {
                return scopedSlot[0];

                //
            } else if (scopedSlot.length > 1 || !scopedSlot.length) {
                if (process.env.NODE_ENV !== 'production') {
                    warn(
                        false,
                        `RouterLink with to="${this.to}" is trying to use a scoped slot but it didn't provide exactly one child. Wrapping the content with a span element.`
                    );
                }
                return scopedSlot.length === 0 ? h() : h('span', {}, scopedSlot);
            }
        }

        // 如果没有设置自定义渲染标签
        if (this.tag === 'a') {
            data.on = on;
            data.attrs = { href };
        } else {
            // find the first <a> child and apply listener and href
            const a = findAnchor(this.$slots.default);
            if (a) {
                // in case the <a> is a static node
                a.isStatic = false;
                const aData = (a.data = extend({}, a.data));
                aData.on = aData.on || {};
                // transform existing events in both objects into arrays so we can push later
                for (const event in aData.on) {
                    const handler = aData.on[event];
                    if (event in on) {
                        aData.on[event] = Array.isArray(handler) ? handler : [handler];
                    }
                }
                // append new listeners for router-link
                for (const event in on) {
                    if (event in aData.on) {
                        // on[event] is always a function
                        aData.on[event].push(on[event]);
                    } else {
                        aData.on[event] = handler;
                    }
                }

                const aAttrs = (a.data.attrs = extend({}, a.data.attrs));
                aAttrs.href = href;
            } else {
                // doesn't have <a> child, apply listener to self
                data.on = on;
            }
        }

        return h(this.tag, data, this.$slots.default);
    }
};

/**
 * 守卫事件
 * @param {Evnet} e 事件回调
 * @returns {boolean} 事件能否继续执行
 */
function guardEvent(e) {
    //// don't redirect with control keys
    // 不能按下特殊键，再点击事件
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;

    //// don't redirect when preventDefault called
    // 事件的默认动作不能被取消
    if (e.defaultPrevented) return;

    //// don't redirect on right click
    // 不能右键点击
    if (e.button !== undefined && e.button !== 0) return;

    //// don't redirect if `target="_blank"`
    // 选项不能是打开新窗口
    if (e.currentTarget && e.currentTarget.getAttribute) {
        const target = e.currentTarget.getAttribute('target');
        if (/\b_blank\b/i.test(target)) return;
    }

    //// this may be a Weex event which doesn't have this method
    // 判断兼容性
    if (e.preventDefault) {
        e.preventDefault();
    }

    return true;
}

function findAnchor(children) {
    if (children) {
        let child;
        for (let i = 0; i < children.length; i++) {
            child = children[i];
            if (child.tag === 'a') {
                return child;
            }
            if (child.children && (child = findAnchor(child.children))) {
                return child;
            }
        }
    }
}
