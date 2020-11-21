import Vue from 'vue'
import Router from 'vue-router'

// import Recommend from 'components/recommend/Recommend'
// import Search from 'components/search/Search'
// import Rank from 'components/rank/Rank'
// import Singer from 'components/singer/Singer'
// 路由懒加载
const Recommend = () => import('@/views/recommend/Recommend')
const Search = () => import('@/views/search/Search')
const Rank = () => import('@/views/rank/Rank')
const Singer = () => import('@/views/singer/Singer')
Vue.use(Router)
const routes = [
  {
    path: '/',
    redirect: '/recommend'
  },
  {
    path: '/recommend',
    component: Recommend
  },
  {
    path: '/search',
    component: Search
  },
  {
    path: '/rank',
    component: Rank
  },
  {
    path: '/singer',
    component: Singer
  }
]

const router = new Router({
  routes,
  mode: 'history'
})

export default router
