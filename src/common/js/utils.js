// 乱序方法
export function shuffle(arr) {
  console.log(arr)
  let n = arr.length
  let random
  // 返回一个全新和arr一模一样的数组,这样就不会更改原数组了
  let _arr = arr.slice()
  while (n !== 0) {
    // es6的清小数点后面的方法 等效于 Math.floor()
    random = Math.random() * n-- >>> 0;
    // es6语法结构赋值,其实也可以使用一个变量存储来互相赋值,实现互相交换值
    [_arr[n], _arr[random]] = [_arr[random], _arr[n]]
  }
  return _arr
}

// 应用场景：实时搜索（keyup）、拖拽（mousemove）
export function debounce(func, wait) {
  let timer = null
  // 函数柯里化 调用一个函数返回一个函数
  // 最后是vue调用的这个返回的匿名函数,所以下面setTimeout 使用的箭头函数,往上找作用域,所以找到这个匿名函数,所以this指向的是调用这个匿名函数,所以是Vue实例
  // 这个打印出来是undefined,因为
  console.log(this)
  return function () {
    // vue 的实例
    // console.log(this)
    let context = this
    let args = arguments
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      // 绑定执行环境的this和arguments,就不会出错了
      // 解决 this丢失和传参 问题
      func.apply(context, args)
      // console.log(this)
      // 打印是Vue实例
    }, wait)
  }
}

// 应用场景：窗口调整(resize)、页面滚动(scroll)、抢购疯狂点击(mousedowm)
export function throttle(func, wait) {
  let previous = 0
  return function() {
    let now = Date.now()
    let context = this
    let args = arguments
    if (now - previous > wait) {
      func.apply(context, args)
      previous = now
    }
  }
}
