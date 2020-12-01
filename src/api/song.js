import {getUid} from 'common/js/uid'
import {commonParams} from './config'
import axios from 'axios'
import { ERR_OK } from 'api/config'

// const debug = process.env.NODE_ENV !== 'production'

// 去请求之前代理的批量获取歌曲 url 的接口
// const url = debug ? '本地服务器' : '远程服务器'
export function getSongsUrl(songs) {
  // const url = debug ? 'api/getPurlUrl' : '远程的url地址'
  const url = '/api/getPurlUrl'

  // 建立存储mids(歌曲代码)的数组和types的数组(都是0)
  let mids = []
  let types = []

  // 遍历songs数组,将每一个歌曲的mid push进mids数组中,types push进 0
  songs.forEach((song) => {
    mids.push(song.mid)
    types.push(0)
  })

  // 返回一整个param参数对象,mids(歌曲代码数组),types(0的数组)
  const urlMid = genUrlMid(mids, types)
  // 合成访问的必要data参数对象
  const data = Object.assign({}, commonParams, {
    g_tk: 5381,
    format: 'json',
    platform: 'h5',
    needNewCode: 1,
    uin: 0
  })
  // 这里我们通过 axios 发送了 post 请求，传入了请求参数，并对返回的数据结构做了处理。这部分逻辑并不难，
  // 不过这里我们设计了一个 retry 的逻辑，因为这个接口是有概率会失败的，因此我们设计了 retry 的逻辑保证 3 次机会可以请求到数据
  // ，如果 3 次请求完还没有拿到数据，则直接 reject 一个 Can not get the songs url 的错误
  return new Promise((resolve, reject) => {
    let tryTime = 3

    // 带着上面的参数(data,urlMid)去dev.serve 访问本地服务器代理去访问qq服务器'https://u.y.qq.com/cgi-bin/musicu.fcg'
    // 然后得到数据response,我们可以得到我们想要的url地址就是response.data.req_0.data.midurlinfo.purl
    function request() {
      return axios.post(url, {
        comm: data,
        req_0: urlMid
      }).then(response => {
        console.log(response)
        const res = response.data
        if (res.code === ERR_OK) {
          // 这里面的urlMid和外面的param参数不一样了,这是局部变量
          let urlMid = res.req_0
          if (urlMid && urlMid.code === ERR_OK) {
            const purlMap = {}
            // 对urlMid->data->midurlinfo遍历,获取里面的purl(就是最终的url)并赋值给对象中的属性purlMap[item.songmid]
            urlMid.data.midurlinfo.forEach(item => {
              if (item.purl) {
                purlMap[item.songmid] = item.purl
              }
            })
            // 如果prulMap对象有属性, 则导出这个对象
            if (Object.keys(purlMap).length > 0) {
              resolve(purlMap)
            } else {
              retry()
            }
          } else {
            retry()
          }
        } else {
          retry()
        }
      })
    }

    function retry() {
      if (--tryTime >= 0) {
        request()
      } else {
        reject(new Error('Can not get the song url'))
      }
    }
    request()
  })
}

// 返回一个parmas对象,里面包含请求的具体参数
function genUrlMid(mids, types) {
  const guid = getUid()
  return {
    module: 'vkey.GetVkeyServer',
    method: 'CgiGetVkey',
    param: {
      // guid 一个随机数,这个随机数决定了guid的值在页面中永恒在,组成了guid的值
      guid,
      // mids的数组作为参数传入和types的数组(都是0)
      songmid: mids,
      songtype: types,
      uin: '0',
      loginflag: 0,
      platform: '23'
    }
  }
}
