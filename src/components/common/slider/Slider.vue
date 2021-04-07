<template>
  <div class="slider" ref="slider">
    <div class="slider-group" ref="sliderGroup">
      <slot>
      </slot>
    </div>
    <div class="dots">
      <span class="dot" v-for="(item, index) in dots" :key="index" :class="{active: currentPageIndex === index}"></span>
    </div>
  </div>
</template>

<script>
  import {addClass} from 'common/js/dom'
  import BScroll from 'better-scroll'
  export default {
    name: 'Slider',
    data() {
      return {
        dots: [],
        currentPageIndex: 0
      }
    },
    props: {
      loop: {
        type: Boolean,
        default: true
      },
      autoPlay: {
        type: Boolean,
        default: true
      },
      interval: {
        type: Number,
        default: 4000
      }
    },
    mounted() {
      // 浏览器刷新是17毫秒,所以我们用20毫秒
      // 保证dom的渲染完毕
      setTimeout(() => {
        this._setSliderWidth()
        this._initDots()
        this._initSlider()
        if (this.autoPlay) {
          this._play()
        }
      }, 20)

      // 假如说我们改变了浏览器宽度,那么轮播图就播放就乱了,因为我们是计算得到的轮播图宽度,不会随着我们更改视口而去重新计算
      // 所以我们需要给window添加一个resize事件,监听这个事件,重新去设置轮播宽度
      // 有一个问题,就是我们resize的时候,还是会追加两个轮播图图片的宽度,所以我们使用标识符来区分是不是resize导致的,是的话我们就不继续追加这两个宽度额
      window.addEventListener('resize', () => {
        if (!this.slider) {
          return false
        }
        this._setSliderWidth(true)
        // 我们使用this.slider.refresh() 重新计算高度
        this.slider.refresh()
      })
    },
    methods: {
      // 因为我们是做移动端,轮播图图片的数量不确定,所以需要动态的获取轮播图总宽度
      // 我们遍历给每一个图片都添加slider-item样式,图片的高度宽度我们还是做成自适应的,所以样式都是自适应的
      // 每一个图片的宽度都是轮播图slider容器的宽度相等(自适应)
      // 我们把sliderWidth累加成width?为什么?我们可以获得总的轮播图所有图片总长度width
      // 动态的设置sliderGroup(ul)的总长度为width
      // 如果是loop,循环播放组件的话,我们为了做无缝的话,长度是原来两倍,这样就是无缝的感觉?
      _setSliderWidth(isResize) {
        this.children = this.$refs.sliderGroup.children
        console.log(this.children)
        let width = 0
        // 外层被撑开所以slider的宽度都是图片的宽度,所以获得了sliderGroup的宽度
        let sliderWidth = this.$refs.slider.clientWidth
        for (let i = 0; i < this.children.length; i++) {
          let child = this.children[i]
          addClass(child, 'slider-item')
          child.style.width = sliderWidth + 'px'
          width += sliderWidth
        }
        // 追加两个sliderWidth宽度是因为我们在前后各自放了两个图片保证无缝连接,所以需要额外这两个轮播图图片的宽度
        if (this.loop && !isResize) {
          width += 2 * sliderWidth
        }
        this.$refs.sliderGroup.style.width = width + 'px'
      },
      // 初始化dots,因为我们直接使用获取的轮播图的图片数量新建一个数组给dots,空数组
      _initDots() {
        this.dots = new Array(this.children.length)
      },
      // 使用better-scroll 初始化slider组件
      _initSlider() {
        if (!this.$refs.slider) {
          return false
        }
        this.slider = new BScroll(this.$refs.slider, {
          scrollX: true,
          scrollY: false,
          momentum: false,
          snap: true, // 该属性是给 slider 组件使用的，普通的列表滚动不需要配置
          snapLoop: this.loop, // 是否可以无缝循环轮播
          snapThreshold: 0.1, // 手指阀值
          snapSpeed: 400 // 轮播图滚动速度
        })

        this.slider.on('scrollEnd', () => {
          // 滚动结束,我们使用this.slider.getCurrentPage().pageX 拿到滚动到第几张图片的Index
          // pageIndex包含了隐藏的第一张图片的索引,currentPageIndex不包含隐藏的第一张图片的索引
          let pageIndex = this.slider.getCurrentPage().pageX
          console.log(pageIndex)
          // 为什么循环要减去一呢?因为我们循环是在前后各自放了一张照片(2张)保证了无缝滚动
          // 所以当我们拿到pageIndex的时候永远多了一个index的,所以我们减去1
          if (this.loop) {
            pageIndex -= 1
          }
          this.currentPageIndex = pageIndex

          if (this.autoPlay) {
            clearTimeout(this.timer)
            this._play()
          }
        })
      },
      // 自动轮播
      _play() {
        // 我们思考第一种情况,一开始currentPageIndex 为0,那么我们设置pageIndex = 1,但是this.slider.goToPage(pageIndex, 0, 400)方法,
        // 但是this.slider.goToPage(pageIndex, 0, 400)方法,是跳完第1张图片的话,那么就是静止不动的,因为第一张就是现在的图片,所以我们必须再+1
        // 变为2,这样才能跳到0,1,2 第三张图片
        // pageIndex包含了隐藏的第一张图片的索引,currentPageIndex不包含隐藏的第一张图片的索引
        // 所以this.currentPageIndex + 1的话就是 就是pageIndex
        let pageIndex = this.currentPageIndex + 1
        // 如果说轮播图轮播开启的话,我们就再+1,为什么?
        if (this.loop) {
          pageIndex += 1
        }
        // 定时器,
        this.timer = setTimeout(() => {
          // goToPage方法,跳转pageIndex
          this.slider.goToPage(pageIndex, 0, 400)
        }, this.interval)
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  .slider
    min-height: 1px
    .slider-group
      position: relative
      overflow: hidden
      white-space: nowrap
      .slider-item
        float: left
        box-sizing: border-box
        overflow: hidden
        text-align: center
        a
          display: block
          width: 100%
          overflow: hidden
          text-decoration: none
        img
          display: block
          width: 100%
    .dots
      position: absolute
      right: 0
      left: 0
      bottom: 12px
      text-align: center
      font-size: 0
      .dot
        display: inline-block
        margin: 0 4px
        width: 8px
        height: 8px
        border-radius: 50%
        background: $color-text-l
        &.active
          width: 20px
          border-radius: 5px
          background: $color-text-ll
</style>
