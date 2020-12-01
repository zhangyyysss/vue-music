let _uid = ''

export function getUid() {
  // 如果_uid有值,那么直接返回这个值,因为我们想对_uid做一些下面的操作
  if (_uid) {
    return _uid
  }
  if (!_uid) {
    // 返回一个随机毫秒数(0-999)
    const t = (new Date()).getUTCMilliseconds()
    // 大概就是给_uid一个随机值?然后再取模
    _uid = '' + Math.round(2147483647 * Math.random()) * t % 1e10
  }
  return _uid
}
