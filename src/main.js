import 'assets/css/index.styl'
import Vue from 'vue'
import App from './App'
import router from './router'
import store from './store/index'
import 'babel-polyfill'
// 导入fastclick减少300ms延迟
import fastclick from 'fastclick'
import VueLazyload from 'vue-lazyload'
// vconsole调试工具
// import Vconsole from 'vconsole'
// let vConsole = new Vconsole()
// Vue.use(vConsole)

console.log('test')
Vue.config.productionTip = false

fastclick.attach(document.body)

Vue.use(VueLazyload, {
  loading: require('assets/images/default.png')
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
