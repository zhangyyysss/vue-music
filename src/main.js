import 'assets/css/index.styl'
import Vue from 'vue'
import App from './App'
import router from './router'
import 'babel-polyfill'
/* 导入fastclick减少300ms延迟 */
import fastclick from 'fastclick'

Vue.config.productionTip = false

fastclick.attach(document.body)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
