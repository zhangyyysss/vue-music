<template>
  <div class="tab">
    <router-link to="/recommend" class="tab-item" tag="div">
      <span class="tab-link">推荐</span>
    </router-link>
    <router-link to="/singer" class="tab-item" tag="div">
      <span class="tab-link">歌手</span>
    </router-link>
    <router-link to="/rank" class="tab-item" tag="div">
      <span class="tab-link">排行</span>
    </router-link>
    <router-link to="/search" class="tab-item" tag="div">
      <span class="tab-link">搜索</span>
    </router-link>
  </div>
</template>

<script>
  export default {
    name: 'Tab'
  }
</script>

<style scoped lang="stylus">
  @import '~assets/css/variable'
  .tab
    display flex
    height 44px
    line-height 44px
    font-size $font-size-medium

    .tab-item
      flex 1
      text-align center

      .tab-link
        padding-bottom 5px
        color $color-text-l
      // router-link-exact-active 也可以
      &.router-link-active
        .tab-link
          color $color-theme
          border-bottom 2px solid $color-theme
</style>
