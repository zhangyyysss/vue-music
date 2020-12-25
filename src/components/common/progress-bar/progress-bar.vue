<template>
  <div class="progress-bar" ref="progressBar" @click="progressClick">
    <div class="bar-inner" ref="progressBarInner">
      <div class="progress" ref="progress"></div>
      <!-- touchstart和touchmove需要阻止默认行为，加上.prevent防止其拖动浏览器 -->
      <div class="progress-btn-wrapper" ref="progressBtn"
           @touchstart.prevent="progressTouchStart"
           @touchmove.prevent="progressTouchMove"
           @touchend="progressTouchEnd">
        <div class="progress-btn"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import {prefixStyle} from 'common/js/dom'
  const transform = prefixStyle('transform')
  const progressBtn = 16

  export default {
    name: 'progress-bar',
    props: {
      percent: {
        type: Number,
        default: 0
      }
    },
    created() {
      // created 生命周期中生成一个touch对象保存我们要的共享信息
      this.touch = {}
    },
    methods: {
      progressTouchStart(e) {
        // 设置一个标志位this.touch.initiated说明初始化完成
        this.touch.initiated = true
        // 第一个手指接触到屏幕的事件对象的横向坐标位置e.touch[0].pageX
        this.touch.startX = e.touches[0].pageX
        // btn所在的偏移位置
        // 为什么不能使用this.$refs.progress.style.width,只能使用this.#refs.progress.clientWidth
        // 前面一个打印出来是含有px单位的,后面是纯数字,建议使用clientWidth
        // this.touch.left = this.$refs.progress.style.width
        // 记录preogress起始位置
        this.touch.left = this.$refs.progress.clientWidth
        // console.log(this.touch)
      },
      progressTouchMove(e) {
        // 如果没有进入到progressTouchStart对this.touch.initiated初始化的化,那么我们return掉
        if (!this.touch.initiated) {
          return
        }
        // 在move的过程中,我们可以实时的拿到e.touch[0].pageX的值,那么与start事件的初始化时候的横坐标的差值
        const deltaX = e.touches[0].pageX - this.touch.startX
        // Math.max(0, this.touch.left + deltaX) 首先不能小于0,已经偏移的量left+deltaX
        // 当我们拖动超过很多的时候,肯定超过progressBar的宽度,所以我们offsetWidth我们使用Math.min()限制
        // Math.min(this.$refs.progressBar.clientWidth - progressBtn, Math.max(0, this.touch.left + deltaX))
        // 最终的意思是,最大值限制在this.$refs.progressBar.clientWidth - progressBtn之间,最小值限制在0
        // 所以最后的限制是只能在0 - this.$refs.progressBar.clientWidth - progressBtn 之间滚动
        const offsetWidth = Math.min(this.$refs.progressBar.clientWidth - progressBtn, Math.max(0, this.touch.left + deltaX))
        this._offset(offsetWidth)
        this._moveChangePercent(offsetWidth)
      },
      progressTouchEnd(e) {
        // end事件结束时候,我们把标志位重置为false
        this.touch.initiated = false
        this._triggerPercent()
      },
      _moveChangePercent(offsetWidth) {
        const movePercent = offsetWidth / (this.$refs.progressBar.clientWidth - progressBtn)
        this.$emit('movePercent', movePercent)
      },
      _triggerPercent() {
        const barWidth = this.$refs.progressBar.clientWidth - progressBtn
        // 计算我们手指弹起时候的percent百分比
        const percent = this.$refs.progress.clientWidth / barWidth
        // 我们把事件传递给父播放器让他调转到相对应的percent
        // 因为是基础组件,我们不希望加入过多的业务逻辑,我们给父元素做吧,所以我们派发出去
        this.$emit('percentChange', percent, barWidth)
      },
      // 将偏移代码封装成一个函数
      _offset(offsetWidth) {
        this.$refs.progress.style.width = `${offsetWidth}px`
        this.$refs.progressBtn.style[transform] = `translate3d(${offsetWidth}px,0 ,0)`
      },
      // 单击事件 移动某一个位置
      progressClick(e) {
        // 想想:我们点击一个位置,这个时候事件对象就会记录我们点击下来的offsetX,就是点击位置的的对象(这里是class="progress-bar"的div)的左偏移量e.offsetX
        // 因为是单击事件,不需要e.touched[0]取得事件对象,直接e就可以了
        // 我们把这个点击事件放在那个div最合适呢? 放在class为"progress-bar"也可以是"inner-bar"都可以哦
        // 有一个bug,就是我们点击按钮位置的时候,按钮跑回初始点,为什么呢?因为e.offset,事件冒泡到父元素,
        // offsetX鼠标相对于事件源元素（srcElement）的X,Y坐标，只有IE事件有这2个属性，标准事件没有对应的属性。
        // 获得的e.offset是按钮的e.offset很小,所以就跳到最前面,
        // 也可以使用老师的方法this.$refs.progressBarInner.getBoundingClientRect()
        // 也可以使用兼容方法 this.$refs.progressBarInner.offsetLeft
        // 打印的是一个DOMrect对象,里面包含着好多内容
        // bottom 554,height 4,left 79.5,right 295.5,top 550,width 216,x 79.5,y 550
        let rect = this.$refs.progressBarInner.offsetLeft
        this._offset(e.pageX - rect)
        this._triggerPercent()
      }
    },
    watch: {
      percent(newPercent) {
        if (newPercent >= 0 && !this.touch.initiated) {
          const barWidth = this.$refs.progressBar.clientWidth - progressBtn
          const progress = barWidth * newPercent
          this._offset(progress)
        }
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import '~assets/css/variable.styl'
  .progress-bar
    height 30px
    width 90%
    margin 0 auto
    .bar-inner
      position relative
      top 13px
      height 4px
      background rgba(0, 0, 0, 0.3)
      // 进度条走过的样式
      .progress
        position absolute
        height 100%
        background: $color-theme
       // 进度按钮包裹层
      .progress-btn-wrapper
        position absolute
        left -8px
        top -13px
        width 30px
        height 30px
        // 进度按钮
        .progress-btn
          position relative
          top 7px
          left 7px
          box-sizing border-box
          width 16px
          height 16px
          border 3px solid $color-text
          border-radius 50%
          background: $color-theme
</style>
