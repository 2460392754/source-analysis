import View from './components/view';
import Link from './components/link';

// 创建一个变量，用于保存vue对象
export let _Vue;

export function install(Vue) {
    // 防止 vue-router 插件重复注册
    if (install.installed && _Vue === Vue) return;
    install.installed = true;

    // 保存引用
    _Vue = Vue;

    // 判断参数是否 不是undefined
    const isDef = (v) => v !== undefined;

    // 注册实例
    const registerInstance = (vm, callVal) => {
        let i = vm.$options._parentVnode;

        // 判断 vm.$options._parentVnode.data.registerRouteInstance 这个链式属性存在并且不为 undefined
        // `registerRouteInstance`这个属性来自于`router-view`组件
        if (isDef(i) && isDef((i = i.data)) && isDef((i = i.registerRouteInstance))) {
            i(vm, callVal);
        }
    };

    // 注册一个全局混入
    Vue.mixin({
        beforeCreate() {
            // 首次全局混入到beforeCreate里
            if (isDef(this.$options.router)) {
                // 添加一个属性，指向根组件
                this._routerRoot = this;

                // 把Vue的构造函数中添加的`router`的对象指向自己
                this._router = this.$options.router;

                // 初始化路由
                this._router.init(this);

                // 通过Vue的工具类中的劫持函数 给组件实例对象中的`_route`对象添加双向绑定的功能
                Vue.util.defineReactive(this, '_route', this._router.history.current);
            } else {
                // 用于 router-view 层级判断
                this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
            }

            registerInstance(this, this);
        },
        destroyed() {
            registerInstance(this);
        }
    });

    // 在Vue的原型上添加`$router`对象，并添加get属性访问器
    Object.defineProperty(Vue.prototype, '$router', {
        get() {
            return this._routerRoot._router;
        }
    });

    // 在Vue的原型上添加`$route`对象，并添加get属性访问器
    Object.defineProperty(Vue.prototype, '$route', {
        get() {
            return this._routerRoot._route;
        }
    });

    // 注册全局组件
    Vue.component('RouterView', View);
    Vue.component('RouterLink', Link);

    const strats = Vue.config.optionMergeStrategies;
    // 使用Vue的自定义选项合并策略，路由的部分钩子使用与vue生命周期中的`created`相同的合并策略
    // 如果子类和父类都拥有钩子选项，则将子类选项和父类选项合并
    strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}
