import { warn } from '../util/warn';
import { extend } from '../util/misc';

export default {
    name: 'RouterView',

    // 转换为函数式组件
    functional: true,

    props: {
        name: {
            type: String,
            default: 'default'
        }
    },

    render(_, { props, children, parent, data }) {
        //// used by devtools to display a router-view badge
        // 添加标识
        data.routerView = true;

        //// directly use parent context's createElement() function
        //// so that components rendered by router-view can resolve named slots
        // 渲染函数
        const h = parent.$createElement;
        // 命名视图的键名
        const name = props.name;
        // 路由信息对象
        const route = parent.$route;
        // 从组件实例中获取缓存对象
        const cache = parent._routerViewCache || (parent._routerViewCache = {});

        //// determine current view depth, also check to see if the tree
        //// has been toggled inactive but kept-alive.
        // 获取 视图深度，组件层级
        let depth = 0;

        // 组件已切换为非活动状态，但保持活动状态。
        let inactive = false;

        // 遍历节点并向上寻找，判断当前节点是否不是根节点
        // depth为当前的RouteView的深度，因为RouteView可以互相嵌套，depth可以帮组我们找到每一级RouteView需要渲染的组件
        while (parent && parent._routerRoot !== parent) {
            const vnodeData = parent.$vnode ? parent.$vnode.data : {};
            if (vnodeData.routerView) {
                depth++;
            }

            // 处理 keep-alive 组件，组件在keep-alive的缓存列表中，且未激活
            if (vnodeData.keepAlive && parent._directInactive && parent._inactive) {
                inactive = true;
            }

            parent = parent.$parent;
        }

        data.routerViewDepth = depth;

        //// render previous view if the tree is inactive and kept-alive
        // 组件在keep-alive的缓存列表中
        if (inactive) {
            const cachedData = cache[name];
            const cachedComponent = cachedData && cachedData.component;

            if (cachedComponent) {
                if (cachedData.configProps) {
                    fillPropsinData(
                        cachedComponent,
                        data,
                        cachedData.route,
                        cachedData.configProps
                    );
                }
                return h(cachedComponent, data, children);
            } else {
                //// render previous empty view
                // 渲染 空视图
                return h();
            }
        }

        // 从matched列表中读取缓存
        const matched = route.matched[depth];
        // 获取组件属性对象
        const component = matched && matched.components[name];

        //// render empty node if no matched route or no config component
        // 首次加载当前路由，matched中没有记录
        if (!matched || !component) {
            cache[name] = null;
            return h();
        }

        //// cache component
        // 缓存组件
        cache[name] = { component };

        //// attach instance registration hook
        //// this will be called in the instance's injected lifecycle hooks
        // 注册钩子，在beforeCreatedu混入的钩子触发钩子，让 next(vm=>{}) 回调函数可以访问当前的组件实例
        data.registerRouteInstance = (vm, val) => {
            //// val could be undefined for unregistration
            const current = matched.instances[name];

            // 判断 当前路由的组件实例与原来路由的组件实例是否相等，如果不相等，则更新路由路由记录中的组件实例
            if ((val && current !== vm) || (!val && current === vm)) {
                matched.instances[name] = val;
            }
        };

        // also register instance in prepatch hook
        // in case the same component instance is reused across different routes
        (data.hook || (data.hook = {})).prepatch = (_, vnode) => {
            matched.instances[name] = vnode.componentInstance;
        };

        // register instance in init hook
        // in case kept-alive component be actived when routes changed
        data.hook.init = (vnode) => {
            if (
                vnode.data.keepAlive &&
                vnode.componentInstance &&
                vnode.componentInstance !== matched.instances[name]
            ) {
                matched.instances[name] = vnode.componentInstance;
            }
        };

        // 根据命名视图的键名获取props参数
        const configProps = matched.props && matched.props[name];

        //// save route and configProps in cachce
        if (configProps) {
            // 浅拷贝路由信息对象、props合并到缓存中
            extend(cache[name], {
                route,
                configProps
            });
            fillPropsinData(component, data, route, configProps);
        }

        // 渲染
        return h(component, data, children);
    }
};

/**
 * 处理 props数据
 * @param {*} component 组件属性对象
 * @param {*} data render数据对象
 * @param {*} route 路由信息对象
 * @param {*} configProps 根据命名视图的键名获取props参数
 */
function fillPropsinData(component, data, route, configProps) {
    // 处理props数据
    let propsToPass = (data.props = resolveProps(route, configProps));

    // 非空
    if (propsToPass) {
        // 浅拷贝数据
        propsToPass = data.props = extend({}, propsToPass);
        const attrs = (data.attrs = data.attrs || {});

        // 把props否值的属性或组件属性props中未声明的属性都剪切到attr上
        for (const key in propsToPass) {
            if (!component.props || !(key in component.props)) {
                attrs[key] = propsToPass[key];
                delete propsToPass[key];
            }
        }
    }
}

/**
 * 处理 不同类型props的数据
 * [https://router.vuejs.org/zh/guide/essentials/passing-props.html]
 * @param {*} route 路由信息对象
 * @param {*} config 根据命名视图的键名获取props参数
 * @reutrns
 */
function resolveProps(route, config) {
    switch (typeof config) {
        case 'undefined':
            return;

        case 'object':
            return config;

        case 'function':
            return config(route);

        case 'boolean':
            return config ? route.params : undefined;

        default:
            if (process.env.NODE_ENV !== 'production') {
                warn(
                    false,
                    `props in "${route.path}" is a ${typeof config}, ` +
                        `expecting an object, function or boolean.`
                );
            }
    }
}
