<template>
  <div class="progress-circle">
    <!-- svg的width height限制了svg的大小,默认 300*150 viewBox是视口的宽度和位置作用是0 0 100 100  第一个参数和第二个参数是位置,100和下面的圆的半径是对应起来的
        viewBox 0 0 100 100 的意思是从左上角(0,0)拉一个100高100宽的正方形,具体可以看张鑫旭的博客,相当于说我们拉一个100,100的正方形,里面装两个circle
        再等比例缩小到32*32的正方形,我们不写死32,传入props更加灵活-->
    <svg :width="radius" :height="radius" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" version="1.1">
      <!--  表示内层的圆,就是背景条 r是半径50,cx,cy圆心坐标(50,50),直径为100的圆   -->
      <circle class="progress-background" r="50" cx="50" cy="50" fill="transparent"></circle>
      <!-- 表示外层的圆,进度条的意思   stroke-dasharray="100"的意思是描边 及描边距离https://www.cnblogs.com/daisygogogo/p/11044353.html
            设置stroke-dasharray="314" 为圆的周长2πR
            设置stroke-dashoffset="314" 的意思是,向左偏移314像素,就是刚刚好完全隐藏起来了,如果是直线理解简单一点,可以看上面那篇文章,一模一样
            所以我们用progress-bar中的属性stroke-dashoffset来映射percent的值,那么就可以展示出进度条效果了啊-->
      <circle class="progress-bar" r="50" cx="50" cy="50" fill="transparent" :stroke-dasharray="dashArray" :stroke-dashoffset="dashOffset"></circle>
    </svg>
    <slot></slot>
  </div>
</template>

<script>
  export default {
    name: 'progress-circle',
    props: {
      radius: {
        type: Number,
        default: 100
      },
      percent: {
        type: Number,
        default: 0
      }
    },
    data() {
      return {
        dashArray: Math.PI * 2 * 50
      }
    },
    computed: {
      dashOffset() {
        return (1 - this.percent) * this.dashArray
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable.styl"
  .progress-circle
    position relative
    circle
      // stroke-width 边缘的宽度
      stroke-width 8px
      // （transform-origin是变形原点，原点就是元素绕着旋转或变形的点）
      // 注意：该属性只有在设置了transform属性的时候才起作用；
      // 如果在不设置的情况下，元素的基点默认的是其中心位置。
      // 因为F12看到circle的宽高都是28.8 与svg的32不一样的,所以我们需要另外设置transform-origin center,
      transform-origin 50% 50% 0
      &.progress-background
        transform scale(0.9)
        stroke $color-theme-d
      &.progress-bar
        // rotate(-90deg) 是逆时针旋转90度 为了让起点在正上方开始旋转
        transform scale(0.9) rotate(-90deg)
        stroke $color-theme
</style>
