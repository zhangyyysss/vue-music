<template>
  <div class="wrapper" ref="wrapper">
    <!--们可以设置一个插槽给不同的局部区块使用这个插件-->
    <slot></slot>
  </div>
</template>

<script>
  // 引入BScroll插件
  import BScroll from 'better-scroll'
  export default {
    name: 'Scroll',
    // 通过父传子得到的props中的属性来判断我们需要用到的值,在父组件中自定义操作
    props: {
      probeType: {
        type: Number,
        default: 1
      },
      /*
      *  点击列表是否派发click事件
      * */
      click: {
        type: Boolean,
        default: true
      },
      /*
      *  列表的数据,watch:{data} 刷新scroll列表
      * */
      data: {
        type: Array,
        default: null
      },
      /*
      * scroll是否监听滚动事件
      * */
      listenScroll: {
        type: Boolean,
        default: false
      },
      /*
      * 是否能上拉加载更多
      * */
      pullup: {
        type: Boolean,
        default: false
      },
      // 试一下pullupLoad是否管用,低版本无用
      // pullUpLoad: {
      //   type: Boolean,
      //   default: false
      // }
      /*
      *  scroll组件在滚动之前会派发一个事件叫做beforeScrollStart,我们在这个事件做input失去焦点的操作
      *
      * */
      beforeScroll: {
        type: Boolean,
        default: false
      },
      refreshDelay: {
        type: Number,
        default: 20
      }
    },
    mounted() {
      // 我们选择这mounted 延时20ms 初始化这个BScroll插件,我们只能确保dom是渲染上了,但是异步加载过来的数据(例如图片加载)我们是无法保证加载上的,所以无法确保一定可以有高度保证我们滚动正常
      setTimeout(() => {
        this._initScroll()
      }, 20)
    },
    methods: {
      _initScroll() {
        // 判断如果没有wrapper标签直接return,不执行下面创建BScroll的操作?
        if (!this.$refs.wrapper) {
          return
        }
        // better-scroll的初始化,将父组件传值过来再实现初始化~
        this.scroll = new BScroll(this.$refs.wrapper, {
          probeType: this.probeType,
          click: this.click,
          pullUpLoad: this.pullUpLoad
        })

        if (this.listenScroll) {
          // 保留vue实例的this到me变量(这是因为老版本需要把?)
          let me = this
          // console.log(this) Vue
          this.scroll.on('scroll', pos => {
            // 因为scroll组件里面的this,例如这里的this.$emit('scroll', pos),this是指向scroll,所以我们要保持vue的this
            me.$emit('scroll', pos)
            // console.log(this) Vue
          })
        }
        // 上拉加载,1.0版本
        if (this.pullup) {
          // scrollEnd 表示scroll滚动结束的位置停止了,scrollToEnd表示它快滚动到底部了
          // scrollEnd :触发时机：滚动结束，或者让一个正在滚动的 content 强制停止
          // 首先this.scroll.y是一个负值,this.scroll.maxScrollY是一个滚动区域内最大的负值 + 50 就是提前50px执行了scrollToEnd
          // 每次滚动结束
          this.scroll.on('scrollEnd', () => {
            // 当scroll快滚动到底部了
            if (this.scroll.y <= this.scroll.maxScrollY + 50) {
              this.$emit('scrollToEnd')
            }
          })
        }
        // 试一下pullUpLoad,低版本无用,这是高版本的方法,只能使用上面的完成上拉加载
        // if (this.pullUpLoad) {
        //   console.log('111111')
        //   this.scroll.on('pullingUp', () => {
        //     this.$emit('pullingUp')
        //   })
        // }
        // 在滚动之前我们派发一个ber
        if (this.beforeScroll) {
          this.scroll.on('beforeScrollStart', () => {
            this.$emit('beforeScroll')
          })
        }

        // 轻浮的时候我们派发一个事件flick
        if (this.beforeScroll) {
          this.scroll.on('flick', () => {
            this.$emit('beforeFlick')
          })
        }
      },
      enable() {
        // 代理better-scroll的enable方法
        this.scroll && this.scroll.enable()
      },
      disable() {
        // 代理better-scroll的disable方法
        this.scroll && this.scroll.disable()
      },
      refresh() {
        // 代理better-scroll的refresh方法
        this.scroll && this.scroll.refresh()
      },
      scrollTo() {
        // 代理better-scroll的scrollTo方法
        // scrollTo会接受参数的,所以我们要把传入的参数传入this.scroll.scrollTo.apply(this.scroll, arguments)中
        this.scroll && this.scroll.scrollTo.apply(this.scroll, arguments)
      },
      scrollToElement() {
        // 代理better-scroll的scrollToElement方法
        this.scroll && this.scroll.scrollToElement.apply(this.scroll, arguments)
      }
    },
    // 我们希望的是使用者使用这个插件的时候,不用主动去调用refresh()方法,而是自动使用watch监控数据变化后调用refresh()方法,这个数据我们可以通过父组件:data进来一个数据监控
    // 保证滚动正确
    watch: {
      data() {
        setTimeout(() => {
          this.refresh()
        }, this.refreshDelay)
      }
    }
  }
</script>

<style scoped lang="stylus">

</style>
