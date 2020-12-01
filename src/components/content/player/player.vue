<template>
  <div class="player" v-show="playList.length">
    <transition
      name="normal"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div class="normal-player" v-show="fullScreen">
        <div class="background">
          <img width="100%" height="100%" :src="currentSong.image">
        </div>
        <div class="top">
          <div class="back" @click="back">
            <i class="icon-back"></i>
          </div>
          <h1 class="title" v-html="currentSong.name"></h1>
          <h2 class="subtitle" v-html="currentSong.singer"></h2>
        </div>
        <div class="middle">
          <div class="middle-l">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd">
                <img class="image" :class="cdCls" :src="currentSong.image">
              </div>
            </div>
          </div>
        </div>
        <div class="bottom">
          <div class="progress-wrapper">
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" @percentChange="onProgressBarChange"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left">
              <i class="icon-sequence"></i>
            </div>
            <div class="icon i-left" :class="disableCls">
              <i @click="prev" class="icon-prev"></i>
            </div>
            <div class="icon i-center" :class="disableCls">
              <i @click="togglePlaying" :class="playIcon"></i>
            </div>
            <div class="icon i-right" :class="disableCls">
              <i @click="next" class="icon-next"></i>
            </div>
            <div class="icon i-right">
              <i class="icon icon-not-favorite"></i>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!--  小播放器  -->
    <transition name="mini">
      <div class="mini-player" v-show="!fullScreen" @click="open">
        <!--   小唱片图片     -->
        <div class="icon">
          <div class="imgWrapper">
            <img :class="cdCls" width="40" height="40" :src="currentSong.image">
          </div>
        </div>
        <!--   歌曲和歌手名称     -->
        <div class="text">
          <h2 class="name" v-html="currentSong.name"></h2>
          <p class="desc" v-html="currentSong.singer"></p>
        </div>
        <div class="control">
          <i @click.stop="togglePlaying" :class="miniIcon"></i>
        </div>
        <div class="control">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <audio :src="currentSong.url" ref="audio" @canplay="ready" @error="error" @timeupdate="updataTime"></audio>
  </div>
</template>

<script>
  import {mapGetters, mapMutations} from 'vuex'
  import animations from 'create-keyframe-animation'
  import {prefixStyle} from 'common/js/dom'

  import ProgressBar from 'components/common/progress-bar/progress-bar'

  const transform = prefixStyle('transform')

  export default {
    name: 'player',
    components: {
      ProgressBar
    },
    data() {
      return {
        songReady: false,
        currentTime: 0
      }
    },
    computed: {
      ...mapGetters([
        // 控制播放器显示和隐藏
        'fullScreen',
        // 整个播放器是否渲染
        'playList',
        // 获取点击的对应的歌曲
        'currentSong',
        // 获取歌曲是否播放状态
        'playing',
        // 获取正在播放歌曲的索引
        'currentIndex'
      ]),
      // 切换歌曲播放大图标
      playIcon() {
        // 正在播放的时候我们icon-pause展示暂停按钮,反之.
        return this.playing ? 'icon-pause' : 'icon-play'
      },
      // 切换歌曲播放小图标
      miniIcon() {
        return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
      },
      cdCls() {
        return this.playing ? 'play' : 'play pause'
      },
      // 控制样式
      disableCls() {
        return this.songReady ? '' : 'disable'
      },
      // 已走进度条和长度进度条的比例,percent
      // 已走的事件和总时长的比例
      percent() {
        return this.currentTime / this.currentSong.duration
      }
    },
    created() {
      console.log(this.currentSong.name)
    },
    methods: {
      // 设置setFullScreen控制 缩小或展开播放器
      back() {
        this.setFullScreen(false)
      },
      open() {
        this.setFullScreen(true)
      },

      // 唱片动画设置
      // 飞入动画
      enter(el, done) { // done回调函数,结束后调用afterEnter
        const {x, y, scale} = this._getPosAndScale()
        // 飞入以后放大再缩到正常大小
        let animation = {
          0: {
            // 初始化起始地点,从大图片中心点(0, 0, 0)原点跑到小图片的位置,大小缩放和小图片一样大小
            transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(0deg)`
          },
          60: {
            // 0->60 过渡 ,从小图片位置跑到大图片中心点(0, 0, 0)原点,且自身的放大1.1倍
            transform: `translate3d(0, 0, 0) scale(1.1) rotate(365deg)`
          },
          100: {
            // 60->100 过渡,位置还在原点,自身缩小为原来的1倍
            transform: `translate3d(0, 0, 0) scale(1) rotate(360deg)`
          }
        }
        // 注册动画(具体可以看参数文档~)
        animations.registerAnimation({
          name: 'move',
          animation,
          presets: {
            duration: 600, // 持续时间
            easing: 'linear', // 默认宽松
            delay: 0 // 延迟执行
          }
        })
        // 运行动画(第一个参数是执行动画的元素,这里是this.$refs.cdWrapper)
        animations.runAnimation(this.$refs.cdWrapper, 'move', done)
      },
      // 进入完成后这个阶段我们注销进入动画(因为会影响后面退出动画)和animation的值清0(和transittion很像,加一个类,后面取消掉这个类)
      afterEnter() {
        animations.unregisterAnimation('move')
        this.$refs.cdWrapper.style.animation = ''
      },
      // 离开动画(// leave是指 cd从显示到隐藏的动画)
      leave(el, done) {
        //  这里直接通过js写，不用create-keyframe-animation,执行时间0.4s
        this.$refs.cdWrapper.style.transition = 'all 0.4s'
        const {x, y, scale} = this._getPosAndScale()
        // 这里我们只要直接移动变小就可以了,回到起始地位置(为什么这里不是和上面反着来呢?因为这是vue动画,做过处理了)
        this.$refs.cdWrapper.style[transform] = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        // 监听transitionend 事件 动画完成后执行done，回调done -> afterLeave
        // transitionend 事件在 CSS 完成过渡后触发
        this.$refs.cdWrapper.addEventListener('transitionend', done)
      },
      afterLeave(el) {
        this.$refs.cdWrapper.style.transtion = ''
        this.$refs.cdWrapper.style[transform] = ''
      },
      _getPosAndScale() {
        // 小图片的宽度
        const targetWidth = 40
        // 小图片中心点距离左边距离
        const paddingLeft = 40
        // 小图片中心点距离下面距离
        const paddingBottom = 30
        // 大图片上边缘距离顶部的距离
        const paddingTop = 80
        // 大图片的宽度
        const width = window.innerWidth * 0.8
        // 初始的缩放比例
        const scale = targetWidth / width
        // 移动距离(其实这里面有一个正负值的思考,就是假如说我们从小图片到大图片的过程,那么这个x就是负值,y是正值,谁是原点呢?需要一个记忆点,记忆方式?)
        // transform translate3d(-100px,-100px,-100px) 的意思是往左移动100px,往上移动-100px,往屏幕内移动100px
        // 为什么我们这里的x是负值呢?大图片中心点为中心点(cdWrapper才是主体,小图片并不是主体) ,我们先把位置偏移到小图片 ,所以x为负值,y为正直
        // 另外这样说 ,这个(x,y)是依据大图片中心提前做的做的偏移,移动过后的位置就是最开始移入点,也是结束的移出点
        // 初始的x距离(负值的原因是因为从小图片到大图片的)
        const x = -(window.innerWidth / 2 - paddingLeft)
        // 初始的y距离
        const y = window.innerHeight - paddingTop - width / 2 - paddingBottom
        return {
          x,
          y,
          scale
        }
      },

      togglePlaying() {
        // 但是这个更改状态是不能够让音乐停止的,因为控制播放器是否播放暂停是看播放器,我们这个只是做一个状态的记录,
        // 所以我们得监控这个playing的状态来判断是否播放还是暂停,我们使用watch判断~
        if (!this.songReady) {
          return
        }
        this.setPlayingState(!this.playing)
      },
      // 歌曲准备好的时候,改变songReady标识位,false进不去判断,被弹出
      ready() {
        this.songReady = true
      },
      // 歌曲eroor的时候
      error() {
        this.songReady = true
      },
      // 上一首歌曲
      prev() {
        // 如果标志位songReady为false的时候,永远是return出去,执行不了下面的代码
        if (!this.songReady) {
          return
        }
        let index = this.currentIndex - 1
        // 当索引-1为 -1 的时候,那么这个时候的index是0,是第一首歌曲,那么设置index = 歌曲的长度-1,就是最后一首歌曲
        if (index === -1) {
          index = this.playList.length - 1
        }
        this.setCurrentIndex(index)
        // 只有暂停阶段才能进入这个判断,我们更改播放状态,让他图标显示播放起来
        if (!this.playing) {
          this.setPlayingState(!this.playing)
        }
        // 离开前修改标志位
        this.songReady = false
      },
      // 下一首歌曲
      next() {
        // 如果标志位songReady为false的时候,永远是return出去,执行不了下面的代码
        if (!this.songReady) {
          return
        }
        let index = this.currentIndex + 1
        // 当索引+1 全等于列表歌曲的长度,那么说明就是最后一首歌曲了,index设置为0
        // 举例子 : 0 1     2首歌曲 ,当索引为1的时候 1+1 = 2 那么就是最后一首歌曲了
        if (index === this.playList.length) {
          index = 0
        }
        this.setCurrentIndex(index)
        // 只有暂停阶段才能进入这个判断,我们更改播放状态,让他图标显示播放起来
        if (!this.playing) {
          this.setPlayingState(!this.playing)
        }
        // 离开前修改标志位
        this.songReady = false
      },
      updataTime(e) {
        this.currentTime = e.target.currentTime
      },
      // 时间戳转换成时间,但是秒数前面没有0,所以pad白
      format(interval) {
        // 向下取整相当于,Math.floor()
        interval = interval | 0
        const minute = this._pad(interval / 60 | 0)
        const second = this._pad(interval % 60)
        return `${minute}:${second}`
      },
      // pad, 当长度为1的时候,都给前面加一个0
      _pad(num, n = 2) {
        let len = num.toString().length
        while (len < 2) {
          num = '0' + num
          len++
        }
        return num
      },

      // 通过更改audio的currentTime当前进度,使用总时长*当前percent计算得到正确currentTime的值
      onProgressBarChange(percent, barWidth) {
        this.$refs.audio.currentTime = this.currentSong.duration * percent
        if (!this.playing) {
          this.togglePlaying()
        }
      },

      // 语法糖设置mutations方法
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN',
        setPlayingState: 'SET_PLAYING_STATE',
        setCurrentIndex: 'SET_CURRENT_INDEX'
      })
    },
    watch: {
      // 一开始播放/切歌(更改了currentSong)就play()播放
      currentSong() {
        // 需要调用this.$nextTick解决播放的bug
        this.$nextTick(() => {
          this.$refs.audio.play()
        })
      },
      // 判断播放状态控制播放按钮功能
      playing(newPlaying) {
        const audio = this.$refs.audio
        // 需要调用this.$nextTick解决播放的bug
        this.$nextTick(() => {
          // 我们根据这个newPlaying的状态来判断是否执行播放还是暂停
          // 当新的值是newPlaying为true的时候,表示正在播放中...所以我们选择播放,当是false,我们暂停
          newPlaying ? audio.play() : audio.pause()
        })
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"

  .player
    .normal-player
      position fixed
      left 0
      right 0
      top 0
      bottom 0
      z-index 150
      background $color-background

      .background
        position absolute
        left 0
        top 0
        width 100%
        height 100%
        z-index -1
        opacity 0.6
        filter blur(20px)

      .top
        position relative
        margin-bottom 25px

        .back
          position absolute
          top 0
          left 6px
          z-index 50

          .icon-back
            display block
            padding 9px
            font-size $font-size-large-x
            color $color-theme
            transform rotate(-90deg)

        .title
          width 70%
          margin 0 auto
          line-height 40px
          text-align center
          no-wrap()
          font-size $font-size-large
          color $color-text

        .subtitle
          line-height 20px
          text-align center
          font-size $font-size-medium
          color $color-text

      .middle
        position fixed
        width 100%
        top 80px
        bottom 170px
        white-space nowrap
        font-size 0

        .middle-l
          display inline-block
          vertical-align top
          position relative
          width 100%
          height 0
          padding-top 80%

          .cd-wrapper
            position absolute
            left 10%
            top 0
            width 80%
            box-sizing border-box
            height 100%

            .cd
              width 100%
              height 100%
              border-radius 50%

              .image
                position absolute
                left 0
                top 0
                width 100%
                height 100%
                box-sizing border-box
                border-radius 50%
                border 10px solid rgba(255, 255, 255, 0.1)

              // 总结:.play 父标签是cd,字标签是.play.pause.image 的意思是.cd类标签下面的子标签使用的.play.pause.image才会奏效
              .play
                animation rotate 20s linear infinite
              .pause
                animation-play-state: paused

          .playing-lyric-wrapper
            width 80%
            margin 30px auto 0 auto
            overflow hidden
            text-align center

            .playing-lyric
              height 20px
              line-height 20px
              font-size $font-size-medium
              color $color-text-l

        .middle-r
          display inline-block
          vertical-align top
          width 100%
          height 100%
          overflow hidden

          .lyric-wrapper
            width 80%
            margin 0 auto
            overflow hidden
            text-align center

            .text
              line-height 32px
              color $color-text-l
              font-size $font-size-medium

              &.current
                color $color-text

            .pure-music
              padding-top 50%
              line-height 32px
              color $color-text-l
              font-size $font-size-medium

      .bottom
        position absolute
        bottom 50px
        width 100%

        .dot-wrapper
          text-align center
          font-size 0

          .dot
            display inline-block
            vertical-align middle
            margin 0 4px
            width 8px
            height 8px
            border-radius 50%
            background $color-text-l

            &.active
              width 20px
              border-radius 5px
              background $color-text-ll

        .progress-wrapper
          display flex
          align-items center
          width 80%
          margin 0 auto
          padding 10px 0

          .time
            color $color-text
            font-size $font-size-small
            flex 0 0 30px
            line-height 30px
            width 30px

            &.time-l
              text-align left

            &.time-r
              text-align right

          .progress-bar-wrapper
            flex 1

        .operators
          display flex
          align-items center

          .icon
            flex 1
            color $color-theme

            &.disable
              color $color-theme-d

            i
              font-size 30px

          .i-left
            text-align right

          .i-center
            padding 0 20px
            text-align center

            i
              font-size 40px

          .i-right
            text-align left

          .icon-favorite
            color $color-sub-theme

      &.normal-enter-active, &.normal-leave-active
        // 整个阶段所有normal项目2s完成动画(包括进入,退出)
        transition all 0.4s
        // 可以设置normal项目中的子类.top.bottom的一些专属动画维持时间

        .top, .bottom
          // cubic-bezier(0.86, 0.18, 0.82, 1.32) 是一个缓冲(回弹)的效果,把时间放慢2s就可以看出来了
          transition all 0.4s cubic-bezier(0.86, 0.18, 0.82, 1.32)

      &.normal-enter, &.normal-leave-to
        // 事先设置 opacity的意思是整个项目初始阶段是透明的,从opacity 0 -> opacity 1 过渡
        opacity 0
        // 可以设置normal项目中的子类 .top .bottom的一些专属动画效果

        .top
          // v-enter 中的translate3d(0, -100px ,0) 因为事先是进入动画先设置成向上偏移100像素,所以从上面掉下来的一个效果
          // v-leave-to 中的 translate3d(0, -100px ,0) 回到动画的初试地点 -100px 的过程
          // (参考3d坐标轴)
          transform translate3d(0, -100px, 0)

        .bottom
          transform translate3d(0, 100px, 0)

    .mini-player
      display flex
      align-items center
      position fixed
      left 0
      bottom 0
      z-index 180
      width 100%
      height 60px
      background $color-highlight-background

      &.mini-enter-active, &.mini-leave-active
        transition all 0.4s

      &.mini-enter, &.mini-leave-to
        opacity 0

      .icon
        // flex属性是flex-grow, flex-shrink 和 flex-basis的简写，默认值为0 1 auto。后两个属性可选。
        //该属性有两个快捷值：auto (1 1 auto) 和 none (0 0 auto)。
        //建议优先使用这个属性，而不是单独写三个分离的属性，因为浏览器会推算相关值。
        flex 0 0 40px
        width 40px
        height 40px
        padding 0 10px 0 20px

        .imgWrapper
          height 100%
          width 100%

          img
            border-radius 50%

            // 总结:&.play 父标签是imgWrapper,字标签是.play 的意思是.imaWrapper类标签下面的子标签使用的.play就会奏效
            &.play
              animation rotate 10s linear infinite

            &.pause
              animation-play-state paused

      .text
        display flex
        flex-direction column
        // justify-content属性定义了项目在主轴上的对齐方式。
        justify-content center
        // align-item 属性定义项目在交叉轴上如何对齐
        // align-content属性定义了多根轴线的对齐方式。如果项目只有一根轴线，该属性不起作用。
        // align-items center
        flex 1
        line-height 20px
        overflow hidden

        .name
          margin-bottom 2px
          no-wrap()
          font-size $font-size-medium
          color $color-text

        .desc
          no-wrap()
          font-size $font-size-small
          color $color-text-d

      .control
        flex 0 0 30px
        width 30px
        padding 0 10px

        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size 30px
          color $color-theme-d

        .icon-mini
          font-size 32px
          position absolute
          left 0
          top 0

  // 旋转动画的定义
  @keyframes rotate
    0%
      transform rotate(0)
    100%
      transform rotate(360deg)
</style>
