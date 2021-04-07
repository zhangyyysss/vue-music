<template>
  <transition name="drop">
    <!--  我们点击弹出层马上就会hide()收起,为什么这里click不会渗透到back按钮,因为呢~~~了解,top-list的父元素是add-Song不是back按钮哦,
      所以顺序不是 top-tip -> back -> addSong 顺序是 top-tip -> add-song 虽然add-Song已经静止冒泡,而且没有关于点击事件的事情,但是为了不影响以后的开发中的bug,所以
      还是禁止事件冒泡把 ~~~~~~~~-->
    <div class="top-tip" v-show="showFlag" @click.stop="hide">
      <slot></slot>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'top-tip',
    // 设置delay可以接收一个延迟时间,组件就是这样设计的~~~~~~
    props: {
      delay: {
        type: Number,
        default: 2000
      }
    },
    data () {
      return {
        showFlag: false
      }
    },
    methods: {
      show() {
        this.showFlag = true
        // 多次点击添加歌曲,会有很多timer,我们应该每次进来都清除掉这个timer
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.hide()
        }, this.delay)
      },
      hide() {
        this.showFlag = false
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"

  .top-tip
    position fixed
    top 0
    width 100%
    z-index 3000
    background $color-dialog-background
    &.drop-enter-active,&.drop-leave-active
      transition all .3s
    &.drop-enter,&.drop-leave-to
      transform translate3d(0, -100%, 0)
</style>
