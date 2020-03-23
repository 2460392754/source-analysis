import View from './components/view';
import Link from './components/link';

export let _Vue;

export function install(Vue) {
    // 防止 vue-router 插件重复注册
    if (install.installed && _Vue === Vue) return;
    install.installed = true;

    _Vue = Vue;

    // 判断参数是否 不是undefined
    const isDef = (v) => v !== undefined;

    // 注册实例
    const registerInstance = (vm, callVal) => {
        let i = vm.$options._parentVnode;

        // 判断 vm.$options._parentVnode.data.registerRouteInstance 这个链式属性存在并且不为 undefined
        if (isDef(i) && isDef((i = i.data)) && isDef((i = i.registerRouteInstance))) {
            i(vm, callVal);
        }
    };

    // 注册一个全局混入
    Vue.mixin({
        beforeCreate() {
            // 首次全局混入到beforeCreate里
            if (isDef(this.$options.router)) {
                this._routerRoot = this;
                this._router = this.$options.router;
                this._router.init(this);
                Vue.util.defineReactive(this, '_route', this._router.history.current);
            } else {
                this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
            }
            registerInstance(this, this);
        },
        destroyed() {
            registerInstance(this);
        }
    });

    // 修改 `Vue.prototype.$router` get属性访问器
    Object.defineProperty(Vue.prototype, '$router', {
        get() {
            return this._routerRoot._router;
        }
    });

    // 修改 `Vue.prototype.$route` get属性访问器
    Object.defineProperty(Vue.prototype, '$route', {
        get() {
            return this._routerRoot._route;
        }
    });

    // 注册全局组件
    Vue.component('RouterView', View);
    Vue.component('RouterLink', Link);

    const strats = Vue.config.optionMergeStrategies;
    // use the same hook merging strategy for route hooks
    strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}
