<template>
  <div class="search-box">
    <i class="icon-search"></i>
    <input
      type="text"
      class="box"
      v-model="query"
      :placeholder="placeholder"
      ref="input">
    <i @click="clear" class="icon-dismiss" v-show="query"></i>
  </div>
</template>

<script>
  import {debounce} from 'common/js/utils'
  export default {
    name: 'search-box',
    props: {
      // 因为这个组件可以复用,但是搜索框中的placeholder内容不同,我们通过props传入
      placeholder: {
        type: String,
        default: '搜索歌曲、歌手'
      }
    },
    data() {
      return {
        // data中query和input双向绑定,下面有watch,有变化就派发出query事件,且把最新的query发出去,具体的搜索逻辑组件外面操作,
        // 我们只负责我们的改变query的逻辑
        query: ''
      }
    },
    methods: {
      clear() {
        this.query = ''
      },
      setQuery(query) {
        this.query = query
      },
      blur() {
        this.$refs.input.blur()
      }
    },
    created() {
      // this.$watch() 的使用（这里可以放在Vue生命周期钩子里）
      // 当query改变,派发一个事件给父组件接受这个newQuery
      // 可以写在watch里面吗?试试? 好像打印出来都是undefined,why?
      this.$watch('query', debounce((newQuery) => {
        this.$emit('query', newQuery)
      }, 300))
    },
    watch: {
      // debounce不能写在watch函数内部,下面是不行的~~~~~~~~~
      // query(newQuery) {
      //   let query = newQuery
      //   debounce((query) => {
      //     console.log(query)
      //   })
      // }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"

  .search-box
    display flex
    align-items center
    // 为元素指定的任何内边距和边框都将在已设定的宽度和高度内进行绘制 默认值content-box
    // inherit 规定应从父元素继承 box-sizing 属性的值
    box-sizing border-box
    width 100%
    height 40px
    padding 0 6px
    background: $color-highlight-background
    border-radius 6px
    .icon-search
      flex 0 0 24px
      font-size 24px
      color $color-background
    .box
      flex 1
      margin 0 5px
      line-height 18px
      background: $color-highlight-background
      color $color-text
      font-size $font-size-medium
      outline 0
      &::placeholder
        color $color-text-d
    .icon-dismiss
      flex 0 0 16px
      font-size 16px
      color $color-background
</style>
