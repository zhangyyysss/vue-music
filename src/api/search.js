import {commonParams, options} from './config'
import jsonp from 'common/js/jsonp'
import axios from 'axios'

export function getHotKey() {
  const url = 'https://c.y.qq.com/splcloud/fcgi-bin/gethotkey.fcg'
  const data = Object.assign({}, commonParams, {
    uin: 0,
    platform: 'h5',
    needNewCode: 1
  })
  return jsonp(url, data, options)
}

// 原接口已经不能jsonp请求了,我们尝试一下(不行)
// 使用express代理axios请求
// 向服务器请求搜索结果 zhida表示是否请求歌手数据 perpage表示每页的数据条数
export function search(query, page, zhida, perpage) {
  const url = '/api/search'

  const data = Object.assign({}, commonParams, {
    w: query,
    p: page,
    perpage: perpage,
    n: perpage,
    // 根据传入的值判断是否显示歌手,如果是true,则我们catZhida是1,所以请求歌手的数据?如果是0,我们不请求歌手的数据,所以就不展示了
    catZhida: zhida ? 1 : 0,
    zhidaqu: 1,
    t: 0,
    flag: 1,
    ie: 'utf-8',
    sem: 1,
    aggr: 0,
    remoteplace: 'txt.mqq.all',
    uin: 0,
    needNewCode: 1,
    platform: 'h5',
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}
