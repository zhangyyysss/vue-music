// 拿到指定元素的属性值,或者设置属性值
export function getData(el, name, val) {
  const prefix = 'data-'
  name = prefix + name
  if (val) {
    return el.setAttribute(name, val)
  } else {
    return el.getAttribute(name)
  }
}

// 供应商vendor
let vendor = (() => {
  // 利用浏览器能力检测特性,我们可以做封装,帮助js完成webkit前缀的功能
  let elementStyle = document.createElement('div').style
  let transformNames = {
    webkit: 'webkitTransform',
    Moz: 'MozTransform',
    O: 'OTransform',
    ms: 'msTransfrom',
    standard: 'transform'
  }
  for (let key in transformNames) {
    if (elementStyle[transformNames[key]] !== undefined) {
      return key
    }
  }
  return false
})()

export function prefixStyle(style) {
  if (vendor === false) {
    return false
  }

  if (vendor === 'standard') {
    return style
  }

  return vendor + style.charAt(0).toUpperCase() + style.substr(1)
}

export function addClass(el, className) {
  if (hasClass(el, className)) {
    return
  }
  // 先split变成数组,
  let newClass = el.className.split(' ')
  // 再往数组里面push需要添加的className
  newClass.push(className)
  // 在把数组使用join使用空格间隔隔开,返回的是一个有空格间隔字符串
  el.className = newClass.join(' ')
}

export function hasClass(el, className) {
  // '(^|\\s)' 意思是直接开头或者是空白字符(\\s,第一个\是转译) 结尾是空白字符结尾或者直接结束
  let reg = new RegExp('(^|\\s)' + className + '(\\s|$)')
  return reg.test(el.className)
}
