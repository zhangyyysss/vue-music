<template>
  <div class="loading">
    <img width="24px" height="24px" src="./loading.gif" alt="">
    <p class="desc">{{title}}</p>
  </div>
</template>

<script>
  export default {
    name: 'Loading',
    props: {
      title: {
        type: String,
        default: '正在加载中...'
      }
    }
  }
</script>

<style scoped lang="stylus">
  .loading
    width 100%
    text-align center
    .desc
      line-height 20px
      font-size $font-size-small
      color $color-text-l
</style>
