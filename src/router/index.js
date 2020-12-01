import Vue from 'vue'
import Router from 'vue-router'

// import Recommend from '@/views/recommend/Recommend'
// import Search from '@/views/search/Search'
// import Rank from '@/views/rank/Rank'
// import Singer from '@/views/singer/Singer'
// import SingerDetail from '@/views/singer-detail/singer-detail'
// 路由懒加载

const Recommend = () => import('@/views/recommend/Recommend')
const Search = () => import('@/views/search/Search')
const Rank = () => import('@/views/rank/Rank')
const Singer = () => import('@/views/singer/Singer')
const SingerDetail = () => import('@/views/singer-detail/singer-detail')
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
    component: Singer,
    children: [
      {
        path: ':id',
        component: SingerDetail
      }
    ]
  }
]

const router = new Router({
  routes,
  mode: 'history'
})

export default router
