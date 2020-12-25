<template>
  <div class="search-list" v-show="searches.length">
    <transition-group name="list" tag="ul">
      <li
        @click="selectItem(item)"
        class="search-item"
        v-for="item in searches"
        :key="item">
        <span class="text">{{item}}</span>
        <!--   当我们点击删除按钮,防止冒泡到li中的点击事件   -->
        <span class="icon" @click.stop="deleteOne(item)">
          <i class="icon-delete"></i>
        </span>
      </li>
    </transition-group>
  </div>
</template>

<script>
  export default {
    name: 'search-list',
    props: {
      searches: {
        type: Array,
        default() {
          return []
        }
      }
    },
    methods: {
      // 因为是基础组件,我们只需要把点击谁派发出去,具体业务逻辑我们不做,我们留给search.vue去做
      selectItem(item) {
        this.$emit('select', item)
      },
      deleteOne(item) {
        this.$emit('delete', item)
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import '~assets/css/mixin'
  @import '~assets/css/variable'
  // 这个overflow的作用是为了让第一个搜索记录上移的时候不会那么突兀
  .search-list
    .search-item
      display flex
      align-items center
      height 40px
      overflow hidden
      // 意思是给li 绑定这些特效, 入场前height0,离场后是0, 所以是 0 -> 40 -> 0的过程
      &.list-enter-active, &.list-leave-active
        transition all 0.1s
      &.list-enter, &.list-leave-to
        height 0
      .text
        flex 1
        color $color-text-l
      .icon
        extend-click()
        .icon-delete
          font-size $font-size-small
          color $color-text-d
</style>
