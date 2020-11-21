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
    return Promise.resolve(res.data)
  }).catch(err => {
    // eslint-disable-next-line no-console
    console.log(err)
  })
}
