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
const Disc = () => import('@/views/disc/Disc')
const TopList = () => import('@/views/top-list/top-list')
const UserCenter = () => import('@/views/user-center/user-center')
Vue.use(Router)
const routes = [
  {
    path: '/',
    redirect: '/recommend'
  },
  {
    path: '/recommend',
    component: Recommend,
    children: [
      {
        path: ':id',
        component: Disc
      }
    ]
  },
  {
    path: '/search',
    component: Search,
    children: [
      {
        path: ':id',
        component: SingerDetail
      }
    ]
  },
  {
    path: '/rank',
    component: Rank,
    children: [
      {
        path: ':id',
        component: TopList
      }
    ]
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
  },
  {
    path: '/user',
    component: UserCenter
  }
]

const router = new Router({
  routes,
  mode: 'hash'
})

export default router
