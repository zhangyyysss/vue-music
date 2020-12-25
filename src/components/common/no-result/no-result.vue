<template>
  <div class="no-result">
    <div class="no-result-icon"></div>
    <p class="no-result-text">{{title}}</p>
  </div>
</template>

<script>
  export default {
    name: 'no-result',
    props: {
      title: {
        type: String,
        default: ''
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  // 文子全部居中
  .no-result
    text-align center
    // 图片的父元素div 设置高宽,用margin来居中显示,因为我们照片使用背景,所以需要div确定高宽值和margin确定水平居中,背景图片的size设置和高宽一样
    .no-result-icon
      width 86px
      height 90px
      margin 0 auto
      bg-image('no-result')
      background-size: 86px 90px
    .no-result-text
      margin-top 30px
      font-size $font-size-medium
      color $color-text-d
</style>
