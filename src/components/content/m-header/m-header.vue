<!-- m-header -->
<template>
  <div class="m-header">
    <div class="icon"></div>
    <h1 class="text">Chick Music</h1>
  </div>
</template>

<script>
  export default {
    name: 'm-header',
    data() {
      return {}
    }
  }
</script>

<style scoped lang="stylus">
  //导入css文件的时候不用加~号,加了就报错
  // @import 'assets/css/test.css'
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  .m-header
    position: relative
    height: 44px
    text-align: center
    color: $color-theme
    //解决inline-block盒子之间有一个空隙
    font-size: 0

    .icon
      display: inline-block
      vertical-align: top
      width: 30px
      height: 32px
      bg-image('logo')
      background-size: 30px 32px
      margin-top: 6px
      margin-right: 9px

    .text
      display: inline-block
      vertical-align: top
      line-height: 44px
      font-size: $font-size-large
</style>
