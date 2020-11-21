import originJSONP from 'jsonp'

export default function jsonp(url, data, option) {
  return new Promise((resolve, reject) => {
    url += (url.indexOf('?') < 0 ? '?' : '&') + param(data)
    originJSONP(url, option, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}

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
