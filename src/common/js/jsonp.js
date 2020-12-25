import originJSONP from 'jsonp'

// 对外暴露方法,url: 请求服务器地址,data: 参数
export default function jsonp(url, data, option) {
  return new Promise((resolve, reject) => {
    url += (url.indexOf('?') < 0 ? '?' : '&') + param(data)
    // 下面的data不是上面的data,上面的data是参数,下面的data是请求之后返回的响应数据data
    // The callback is called with err, data parameters.
    originJSONP(url, option, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}

// 定义一个将Object的参数处理成为url挂载参数的形式的函数
// &page=10&isso=1&rsv_bp=2
function param(data) {
  let url = ''
  for (var k in data) {
    // 进行判断的好处在于:value不会是undefined,
    let value = data[k] !== undefined ? data[k] : ''
    url += `&${k}=${encodeURIComponent(value)}`
  }
  // 如果存在url,那么把&符号去除,防止两个&的产生(上面也有一个&)
  return url ? url.substring(1) : ''
}
