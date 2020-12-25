import jsonp from 'common/js/jsonp.js'
import {commonParams, options} from 'api/config.js'
import axios from 'axios'

/**
 * 获取推荐页 轮播图数据   ->获取不了,接口挂了~所以没有照片,我们自己用替代照片~
 * */
export function getRecommend() {
  const url = 'https://c.y.qq.com/musichall/fcgi-bin/fcg_yqqhomepagerecommend.fcg'
  // 下面是统一请求内容
  const data = Object.assign({}, commonParams, {
    platform: 'h5',
    uin: 0,
    needNewCode: 1
  })
  // 返回的是一个promise
  return jsonp(url, data, options)
}

export const getDiscList = () => {
  const url = '/api/getDiscList'
  const data = Object.assign({}, commonParams, {
    platform: 'yqq',
    hostUin: 0,
    sin: 0,
    ein: 29,
    sortId: 5,
    needNewCode: 0,
    categoryId: 10000000,
    rnd: Math.random(),
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    console.log(res.data)
    // 因为return 一个new Promise ,所以在组件中的then可以获得数据.then(res)
    return Promise.resolve(res.data)
  }).catch(err => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
}

// 获取歌单详情页歌曲列表 (这里使用jsonp请求,原本jsonp可以的得到的数据,这里不能这样得到了,
// 返回的是
// jp1({code: 0, subcode: 1, msg: "invalid referer"})
// code: 0
// msg: "invalid referer"
// subcode: 1
// 非法的referer所以我们得通过代理来处理了)
// export function getSongList(disstid) {
//   const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
//
//   const data = Object.assign({}, commonParams, {
//     disstid,
//     type: 1,
//     json: 1,
//     utf8: 1,
//     onlysong: 0,
//     platform: 'yqq',
//     hostUin: 0,
//     needNewCode: 0
//   })
//
//   return jsonp(url, data, options)
// }

export function getSongList(disstid) {
  const url = '/api/getCdInfo'
  const data = Object.assign({}, commonParams, {
    disstid,
    type: 1,
    json: 1,
    utf8: 1,
    onlysong: 0,
    platform: 'yqq',
    hostUin: 0,
    needNewCode: 0
  })
  // 这个axios.get请求是请求本地服务器的请求,把相对应的参数parmas打包访问本地服务器(只是为了真实访问qq服务器时候的带上)
  return axios.get(url, {
    params: data
  }).then(res => {
    // 返回一个promise给到disc.vue中的请求
    // 这里的res是一个包含很多信息的res(其实就是得到一个响应信息response,response.data就是数据),是一个包含了
    // 很多请求状态的,例如说config,data(真实返回的数据),headers(真实请求qq的请求头),request(响应头,响应文本,响应url,)
    // status: 200, statusText: OK,我们想要返回的是res.data,所以下面是设置res.data
    // 其实return res.data也是可以的,但是我们返回一个Promise可以在disc.vue,继续使用then,.catch,可以分段测试catch
    // return res.data 也是返回一个promise啊,我擦
    return Promise.resolve(res.data)
    // return res.data
  })
}
