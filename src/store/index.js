import Vue from 'vue'
import Vuex from 'vuex'
import state from './state'
import mutations from './mutations'
import * as getters from './getters'
import * as actions from './actions'
// 下面这个用于调试mutations可以看到state中数据状态的
import createLogger from 'vuex/dist/logger'

// 1.安装插件
Vue.use(Vuex)

// Vuex的调试工具devtools  所以这个debug参数视为了判断我们是否使用严格模式
// 我再webpack npm run dev 那么就是dev环境 ,如果是npm run build,他就是production环境
// 所以我们线下调试的时候, 使用vue严格模式,为true,state中的修改是否来自于mutations的修改~
// 上线的时候这个模式自动被关闭
const debug = process.env.NODE_ENV !== 'production'

// 2.创建store对象
const store = new Vuex.Store({
  state,
  mutations,
  getters,
  actions,
  strict: debug,
  plugins: debug ? [createLogger()] : []
})

// 3.挂载vue实例上
export default store
