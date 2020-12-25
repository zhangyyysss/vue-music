<template>
  <transition name="confirm-fade">
    <div class="confirm" v-show="showFlag" @click.stop>
      <div class="confirm-wrapper">
        <div class="confirm-content">
          <p class="text">{{text}}</p>
          <div class="operate">
            <div class="operate-btn left" @click="cancelClick">{{cancelBtnText}}</div>
            <div class="operate-btn" @click="confirmClick">{{confirmBtnText}}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'confirm',
    props: {
      text: {
        type: String,
        default: ''
      },
      confirmBtnText: {
        type: String,
        default: '确定'
      },
      cancelBtnText: {
        type: String,
        default: '取消'
      }
    },
    data() {
      return {
        showFlag: false
      }
    },
    methods: {
      show() {
        this.showFlag = true
      },
      hide() {
        this.showFlag = false
      },
      cancelClick() {
        this.hide()
        this.$emit('cancel')
      },
      confirmClick() {
        this.hide()
        this.$emit('confirm')
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  // 这个层的有两个作用
  // 1.可以让后面的点击无效,因为铺满了整个页面
  // 2.z-index 998 显示在最上层
  .confirm
    position fixed
    left 0
    right 0
    top 0
    bottom 0
    z-index 998
    // 半透明阴影 全局有一个模糊的蒙层
    background-color $color-background-d
    // 这里的动画为什么没有退出动画?????因为是v-show吗? 显示的时候就有动画,离开是相同的动画就很奇怪了,会复现一下又删掉了
    &.confirm-fade-enter-active
      animation confirm-fadein 0.3s
      .confirm-content
        animation confirm-zoom 0.3s
    // 中间内容的定位
    // 中间包裹层的绝对定位,相对于.confirm定位 只要不是 static,其他都可以定位
    .confirm-wrapper
      position absolute
      top 50%
      left 50%
      transform translate(-50%, -50%)
      z-index 999
      .confirm-content
        width 270px
        border-radius 13px
        background $color-highlight-background
        .text
          padding 19px 15px
          text-align center
          font-size $font-size-large
          color $color-text-l
        .operate
          display flex
          align-items center
          text-align center
          font-size $font-size-large
          .operate-btn
            flex 1
            line-height 22px
            padding 10px 0
            border-top 1px solid $color-background-d
            color $color-text-d
            &.left
              border-right 1px solid $color-background-d

  @keyframes confirm-fadein
    0%
      opacity 0
    100%
      opacity 1

  @keyframes confirm-zoom
    0%
      transform: scale(0)
    50%
      transform: scale(1.1)
    100%
      transform: scale(1)
</style>
