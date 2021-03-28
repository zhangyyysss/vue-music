<template>
  <div class="player" v-show="playList.length > 0">
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
        <div class="middle" @touchstart.prevent="middleTouchStart" @touchmove.prevent="middleTouchMove" @touchend="middleTouchEnd">
          <div class="middle-l" ref="middleL">
            <div class="cd-wrapper" ref="cdWrapper">
              <div class="cd">
                <img class="image" :class="cdCls" :src="currentSong.image">
              </div>
            </div>
            <div class="playing-lyric-wrapper">
              <div class="playing-lyric">{{playingLyric}}</div>
            </div>
          </div>
          <scroll class="middle-r" ref="lyricList" :data="currentLyric && currentLyric.lines">
            <div class="lyric-wrapper">
              <div class v-if="currentLyric">
                <p
                  ref="lyricLine"
                  @click="lyricClick(line,index)"
                  :class="{'current': currentNum === index}"
                  class="text"
                  v-for="(line, index) in currentLyric.lines"
                  :key="index">{{line.txt}}</p>
              </div>
            </div>
          </scroll>
        </div>
        <div class="bottom">
          <div class="dot-wrapper">
            <span class="dot" :class="{'active': currentShow === 'cd'}"></span>
            <span class="dot" :class="{'active': currentShow === 'lyric'}"></span>
          </div>
          <div class="progress-wrapper">
            <span class="time time-l">{{format(currentTime)}}</span>
            <div class="progress-bar-wrapper">
              <progress-bar :percent="percent" @percentChange="onProgressBarChange" @movePercent="onProgressBarMove"></progress-bar>
            </div>
            <span class="time time-r">{{format(currentSong.duration)}}</span>
          </div>
          <div class="operators">
            <div class="icon i-left" @click="changeMode">
              <i :class="iconMode"></i>
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
              <!--  喜欢图标按钮由传入的currentSong和vuex中喜欢列表找到就返回喜欢?   -->
              <i class="icon" :class="getFavoriteIcon(currentSong)" @click="toggleFavorite(currentSong)"></i>
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
          <progress-circle :radius="32" :percent="percent">
            <i @click.stop="togglePlaying" :class="miniIcon" class="icon-mini"></i>
          </progress-circle>
        </div>
        <div class="control" @click.stop="showPlaylist">
          <i class="icon-playlist"></i>
        </div>
      </div>
    </transition>
    <audio
      :src="currentSong.url"
      ref="audio"
      @playing="ready"
      @error="error"
      @timeupdate="updataTime"
      @ended="end"
      @pause="paused"
    ></audio>
    <playlist ref="playlist"></playlist>
  </div>
</template>

<script>
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import animations from 'create-keyframe-animation'
  import {prefixStyle} from 'common/js/dom'
  import {playMode} from 'common/js/config'
  import Lyric from 'lyric-parser'

  import {playerMixin} from 'common/js/mixin'
  import Scroll from 'components/common/scroll/Scroll'
  import ProgressBar from 'components/common/progress-bar/progress-bar'
  import ProgressCircle from 'components/common/progress-circle/progress-circle'
  import Playlist from 'components/content/playlist/playlist'

  const transform = prefixStyle('transform')
  const transition = prefixStyle('transition')

  export default {
    mixins: [playerMixin],
    name: 'player',
    components: {
      ProgressBar,
      ProgressCircle,
      Scroll,
      Playlist
    },
    data() {
      return {
        songReady: false,
        currentTime: 0,
        currentLyric: null,
        currentNum: 0,
        currentShow: 'cd',
        playingLyric: '',
        movePercentflag: false
      }
    },
    computed: {
      // 其实在mixins 中定义了,就可以删掉了,但是我为了逻辑更加清晰,所以我们继续保留这些数据吧
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
        'currentIndex',
        // 获取当前的播放模式
        'mode',
        // 获取当前播放顺序列表list
        'sequenceList'
      ]),
      // 切换歌曲播放模式统一放在mixin中管理了,因为有两个组件都使用到了这一块相同的代码
      // 切换不同播放模式的图片
      // iconMode() {
      //   return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random'
      // },
      // 切换歌曲播放大图标
      playIcon() {
        // 正在播放的时候我们icon-pause展示暂停按钮,反之.
        return this.playing ? 'icon-pause' : 'icon-play'
      },
      // 切换歌曲播放小图标
      miniIcon() {
        return this.playing ? 'icon-pause-mini' : 'icon-play-mini'
      },
      // cd旋转和暂停功能
      cdCls() {
        return this.playing ? 'play' : 'play pause'
      },
      // 如果songReady没有准备好,那么disable样式,暗色
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
      this.touch = {}
    },
    methods: {
      // 设置setFullScreen控制 缩小或展开播放器
      back() {
        this.setFullScreen(false)
      },
      // 点mini播放器展开全屏播放器
      open() {
        this.setFullScreen(true)
      },

      // 之所以需要使用这个库是因为我们需要通过js来修改css3动画
      // 这个插件是用js写css的keyframe动画用的，至于为什么keyframe不在css里面写呢？
      // 那是因为屏幕大小不一样，会导致需要移动的px不一样，所以要动态计算。
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
      // 控制播放或者暂停功能
      togglePlaying() {
        // 但是这个更改状态是不能够让音乐停止的,因为控制播放器是否播放暂停是看播放器,我们这个只是做一个状态的记录,
        // 所以我们得监控这个playing的状态来判断是否播放还是暂停,我们使用watch判断~
        if (!this.songReady) {
          return
        }
        // 修改state中的状态,下面watch监控,所以可以作出播放的实际操作
        this.setPlayingState(!this.playing)
        // 如果播放歌曲的的时候有歌词对象,那么一起滚动
        if (this.currentLyric) {
          this.currentLyric.togglePlay()
        }
      },
      // 歌曲准备好的时候,改变songReady标识位,false进不去判断,被弹出
      ready() {
        clearTimeout(this.timer)
        this.songReady = true
        this.canLyricPlay = true
        // 当歌曲准备好了,我们把当前歌曲写进写进playhistory中
        this.savePlayHistory(this.currentSong)
        // 如果歌曲的播放晚于歌词的出现，播放的时候需要同步歌词
        if (this.currentLyric) {
          this.currentLyric.seek(this.currentTime * 1000)
        }
      },
      // 当歌曲暂停的时候(原视频没有这个介绍,可以自己研究研究)
      paused() {
        this.setPlayingState(false)
        if (this.currentLyric) {
          this.currentLyric.stop()
        }
      },
      // 歌曲error的时候
      error() {
        clearTimeout(this.timer)
        this.songReady = true
      },
      // 上一首歌曲
      prev() {
        // 如果标志位songReady为false的时候,永远是return出去,执行不了下面的代码
        if (!this.songReady) {
          return
        }
        // 如果列表中只有一首歌曲,那么就是loop单曲循环
        if (this.playList.length === 1) {
          this.loop()
          return false
        } else {
          let index = this.currentIndex - 1
          // 当索引-1为 -1 的时候,那么这个时候的index是0,是第一首歌曲,那么设置index = 歌曲的长度-1,就是最后一首歌曲
          if (index === -1) {
            index = this.playList.length - 1
          }
          // 换歌曲只需要更改state中的CurrentIndex即可?为什么?
          this.setCurrentIndex(index)
          // 只有暂停阶段才能进入这个判断,我们更改播放状态,让他图标显示播放起来
          // watch:{currentSong:{this.setPlayingState(true)}}代替
          // if (!this.playing) {
          //   this.setPlayingState(!this.playing)
          // }
          if (!this.playing) {
            this.togglePlaying()
          }
        }
      },
      // 下一首歌曲
      next() {
        // 如果标志位songReady为false的时候,永远是return出去,执行不了下面的代码
        if (!this.songReady) {
          return
        }
        // 如果列表中只有一首歌曲,那么就是loop单曲循环
        if (this.playList.length === 1) {
          this.loop()
          // 如果是歌单列表只有一首歌曲,那么使用this.loop(),然后reutrn
          // 为什需要return,不执行下面的this.songReady = false,设置为false的话,标签一直是暗色?
          return false
        } else {
          let index = this.currentIndex + 1
          // 当索引+1 全等于列表歌曲的长度,那么说明就是最后一首歌曲了,index设置为0
          // 举例子 : 0 1     2首歌曲 ,当索引为1的时候 1+1 = 2 那么就是最后一首歌曲了
          if (index === this.playList.length) {
            index = 0
          }
          // 换歌曲只需要更改state中的CurrentIndex即可?为什么?
          this.setCurrentIndex(index)
          // 只有暂停阶段才能进入这个判断,我们更改播放状态,让他图标显示播放起来
          // watch:{currentSong:{this.setPlayingState(true)}}代替
          // if (!this.playing) {
          //   this.setPlayingState(!this.playing)
          // }
          if (!this.playing) {
            this.togglePlaying()
          }
        }
      },
      // 获取歌曲播放进度时间
      updataTime(e) {
        if (!this.movePercentflag) {
          // 时时刻刻更新this.currentTime
          this.currentTime = e.target.currentTime
        }
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
      // 歌曲播放完毕
      // 所以歌曲播放完毕会this.currentTime清0
      end() {
        // 歌曲播放结束后 我们把显示效果的this.currentTime清0
        this.currentTime = 0
        if (this.mode === playMode.loop) {
          this.loop()
        } else {
          this.next()
        }
      },

      // 单曲循环的loop
      loop() {
        this.$refs.audio.currentTime = 0
        this.$refs.audio.play()
        // 只要loop()函数调用,说明正在播放状态啊,所以我们就给他设置state的playingState
        this.setPlayingState(true)
        // 为什么需要左下面的偏移到0呢?因为我们是通过CurrentSong来生成一个新的歌词对象
        // 但是循环播放啊,歌曲一样,说明歌词对象不会发生改变,所以我们只需要移动位置到0即可
        // 当循环播放的时候,歌曲有currentLyric的时候偏移到头部this.currentLyric.seek(0)
        if (this.currentLyric) {
          this.currentLyric.seek(0)
        }
      },
      // 切换歌曲播放模式统一放在mixin中管理了,因为有两个组件都使用到了这一块相同的代码
      // 切换3种模式的逻辑
      // changeMode() {
      //   // 3种模式切换用下面这个方法,(this.mode+1)%3,就会一直在0-3之间切换循环了,不会跑到4(不用使用if语句,这个简单多了)这个做模式切换最合适不过了~~~~~~~~~
      //   const mode = (this.mode + 1) % 3
      //   // let mode = this.mode + 1
      //   // if (mode >= 3) {
      //   //   mode = 0
      //   // }
      //   // 通过mutations修改mode
      //   this.setPlayMode(mode)
      //   // 设置一个list保存我们播放列表
      //   let list = null
      //   // 如果播放模式是随机模式时候
      //   if (mode === playMode.random) {
      //     // 我们进行将数组洗牌后传给list保存
      //     list = shuffle(this.sequenceList)
      //   } else {
      //     // 我们就把顺序列表传给list保存
      //     list = this.sequenceList
      //   }
      //   // 无论是乱序还是正序我们都得使用this.resetCurrentIndex(list)找到相对应的currentIndex,设置对应的currentIndex
      //   // 确保播放列表playList和 currentIndex 最终和表现是一致的
      //   // 我们修改了当前的播放列表playList,但是我们当前的CurrentSong播放歌曲是由playList决定的
      //   // 所以我们也要对其做修改,因为我们切换模式的时候,我们的currentSong中的currentIndex不发生改变啊~,所以我们得找到在洗牌后的数组
      //   // 洗牌后的数组中的的CurrentSong的Index,重新设置给CurrentIndex
      //   this.resetCurrentIndex(list)
      //   // 将洗牌过后的数组给到vuex的state中playList保存
      //   this.setPlayList(list)
      // },
      // // 因为洗牌后的的数组中的index对不上了,所以我们得找到洗牌过后的数组和正在播放的歌曲对应的索引值,重新在state中设置
      // resetCurrentIndex(list) {
      //   // list.findIndex((item) 的意思是找到符合函数中要求的索引值,
      //   // 函数是找到当前播放的音乐id和洗牌后的数组的id匹配的话返回的索引,就找到重组过后当前播放歌曲的索引了
      //   let index = list.findIndex((item) => {
      //     return item.id === this.currentSong.id
      //   })
      //   this.setCurrentIndex(index)
      // },
      onProgressBarMove(movePercent) {
        // 移动过程中更改时间进度,this.movePercentflag为标志位,阻止updataTime一直进入拿事件,弹起后设为false
        const currentTime = this.currentSong.duration * movePercent
        this.currentTime = currentTime
        // 移动progress的时候,歌词也跟着滚动,拖动进度条，歌词联动,
        if (this.currentLyric) {
          this.currentLyric.seek(currentTime * 1000)
        }
        this.movePercentflag = true
      },
      // 手指弹起 ,通过更改audio的currentTime当前进度,使用总时长*当前percent计算得到正确currentTime的值
      onProgressBarChange(percent, barWidth) {
        const currentTime = this.currentSong.duration * percent
        console.log(currentTime)
        this.$refs.audio.currentTime = currentTime
        // 手指抬起,如果是暂停,那么就相当于点击播放按钮播放
        if (!this.playing) {
          this.togglePlaying()
        }
        // 就是this.currentLyric.seek(currentTime * 1000)
        // 为什么是乘以1000?
        if (this.currentLyric) {
          this.currentLyric.seek(currentTime * 1000)
        }
        this.movePercentflag = false
      },
      handleLyric({lineNum, txt}) {
        this.currentNum = lineNum
        // 超过5行,让文字聚焦在中间
        if (lineNum > 5) {
          // v-for 循环,所以this.$refs.lyricLine是一个数组,
          // 为什么是this.$refs.lyricLine[lineNum - 5],因为要让正在读的歌曲在最顶部向下5个位置,
          // 这样就是正中间了,所以-5,是预留5个位置给正在播放的歌词,例如说当播放到第6句的时候,那么
          // this.$refs.lyricLine[1] 在顶端,这样,6就刚好在中间了.
          // 控制歌词在中间显示
          let lineEL = this.$refs.lyricLine[lineNum - 5]
          this.$refs.lyricList.scrollToElement(lineEL, 1000)
        } else {
          // 小于5行的时候,切换歌曲的话,弹回最上面
          this.$refs.lyricList.scrollTo(0, 0, 1000)
        }
        this.playingLyric = txt
      },
      // 滚动歌词代码
      middleTouchStart(e) {
        // initiated 确保顺序 start -> move 一定先有start,才有move ,
        // moved 确保顺序 start -> move -> end     一定要有move 才有end ,一定是一个完整的手指移动的动作
        // 为什么要这样做呢 ? 因为 move中使用的this.touch.startX this.touch.startY 来自start过程 保证这个过程可以拿到值
        // 为什么要这样做呢?因为确保 move 到停止end 的过程是一直存在的 确保这个percent 一直是最新的,不是老的旧
        // this.touch.percent = Math.abs(offsetWidth / window.innerWidth)
        // 所以this.touch.moved用来判断是否为一次移动(用来判断有没有move这个过程,如果没有,那么我们就不使用end这个事件,自然就不会歌词和cd图片跳转)
        // 如果this.touch.move 为false, 那么end 就判断,如果是false直接返回,中间的move来修改这个值,true,说明有move这个过程我们就end
        this.touch.moved = false
        this.touch.initiated = true
        this.touch.startX = e.touches[0].pageX
        this.touch.startY = e.touches[0].pageY
      },
      middleTouchMove(e) {
        if (!this.touch.initiated) {
          return
        }
        // 计算手指头的偏移值
        const deltaX = e.touches[0].pageX - this.touch.startX
        const deltaY = e.touches[0].pageY - this.touch.startY
        // 竖向滚动return,有可能在移动歌词呢~
        // console.log(Math.abs(deltaX), Math.abs(deltaY))
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          return false
        }
        // 这个判断不许放在上面判断的后面?为什么?
        // 首先我们得理解:上一次的this.percent会被保存,而且没有被清空,如果说纵轴移动绝对值大于横轴移动,那么我们就return false,下面的代码将不执行,但是end事件会执行,用的是上一次的percent,
        // 所以无论是怎么手指轻轻移动,都是会被滑动到歌词页面的,获取切换页面,我们有两个思路,第一个是对this.percent清0,但是优雅吗?不优雅~
        // 所以我们选择使用this.touch.moved来记录我们在move中达到哪个步骤了,
        // 如果是纵轴大于横轴,直接return ,那么this.touch.moved将是false,不会得到更改,根本就不会进入end事件,因为this.touch.moved没有被修改
        // 如果说横轴大于纵轴,我们修改this.touch.moved,记录新的percent,可以进入end事件,执行end,然后对我们percent判断,~功能正常
        // 所以我们就不会对percent做任何修改了,在事件函数的加上一个标志位,在return 前后做逻辑的时候,我们是否决定进入下一个执行事件end

        // 说白了就是如果说纵轴大于横轴,那么我们就return了, 不进入 end事件
        // 如果说横轴大于纵轴,我们percent重新计算, 进入end事件
        // 我们可以通过标识位来决定是否执行下一个步骤
        if (!this.touch.moved) {
          this.touch.moved = true
        }
        // 记录起始值(因为是两种状态,这就是两种状态的做法)用if做判断是不是有点笨,我们可以用三元运算符记录下两种状态的起始位置,因为下面偏移我们要写在一块去,
        const left = this.currentShow === 'cd' ? 0 : -window.innerWidth
        // 限制了的最大最小值的偏移量 所以最后的偏移量限制在 [-window.innerWidth, 0] 之间能取到的值大部分是 left + deltaX
        const offsetWidth = Math.min(0, Math.max(-window.innerWidth, left + deltaX))
        // 记录移动百分比所以百分比的 [0, 1]
        // 当歌词界面在右边的时候,,取得偏移量left + deltaX为0,offsetWidth为0,所以percent为0
        // 当歌词界面在最左边的时候为offsetWidth = -window.innerWidth,有取绝对值,所以为1
        this.touch.percent = Math.abs(offsetWidth / window.innerWidth)
        // move中移动偏移
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
        // 移动中的时候把相对应的transtions去除掉,也是为防止干扰以后我们项目中添加transition
        this.$refs.lyricList.$el.style[transition] = ``
        // 这里很巧妙的使用了 1 - this.touch.percent来做middleL渐显渐隐的效果 ,随着移动的变大offsetWidth变大,percent变大, 1- this.touch.percent变小,渐渐消失的感觉
        this.$refs.middleL.style.opacity = 1 - this.touch.percent
        // 移动中的时候把相对应的transtions去除掉,也是为防止干扰以后我们项目中添加transition
        this.$refs.middleL.style[transition] = ``
      },
      // 手指弹起的时候
      // 我们要处理两种情况,从左向右滑,从右向左滑动,都滑10%就可以划过去
      // 理解一下:这个this.touch.percent 这是,(这是移动的距离和屏幕宽度的比例)错的~~~~~为什么不使用这是移动的距离和屏幕宽度的比例,其实呢?我们是无法判断左滑右滑?
      //          这个this.touch.percent 是 从
      middleTouchEnd(e) {
        if (!this.touch.moved) {
          return
        }
        let offsetWidth
        let opacity
        if (this.currentShow === 'cd') {
          // console.log('cd' + this.touch.percent)
          if (this.touch.percent > 0.1) {
            // 如果移动比例 > 0.2 那么我们设置最终的偏移量就是屏幕的宽度,且opacity 透明, 将this.currentShow = 'lyric'标志位修改了下一个
            offsetWidth = -window.innerWidth
            opacity = 0
            this.currentShow = 'lyric'
          } else {
            // 否则不修改标识位,偏移是 0, 透明度 1
            offsetWidth = 0
            opacity = 1
          }
        } else {
          // 因为this.touch.percent已经变成了1了,因为此时歌词已经在左边了,偏移量就是-window.innerWidth / -window.innerWidth = 1
          // 所以我们右滑动只需要判断这个percent值就好了,主要就是这个percent
          // console.log('lyric' + this.touch.percent)
          // if (this.touch.percent === 0) {
          //   return
          // }
          if (this.touch.percent < 0.9) {
            offsetWidth = 0
            opacity = 1
            this.currentShow = 'cd'
          } else {
            offsetWidth = -window.innerWidth
            opacity = 0
          }
        }
        console.log(this.touch.percent)
        this.$refs.lyricList.$el.style[transform] = `translate3d(${offsetWidth}px, 0, 0)`
        this.$refs.lyricList.$el.style[transition] = `all 0.3s linear 0s`
        // 不同情况的opacity,上面做了细分,这边给最后的结果opacity赋值
        this.$refs.middleL.style.opacity = opacity
        this.$refs.middleL.style[transition] = `all 0.3s linear 0s`
        // 结束后将percent 清0 防止一直存在 影响上面的判断
        // this.touch.percent = 0
        this.touch.initiated = false
      },
      getLyric() {
        this.currentSong.getLyric().then((lyric) => {
          if (this.currentSong.lyric !== lyric) {
            return
          }
          // this.currentLyric 改变后会立刻调用 handleLyric(老师写的插件)
          // 内置定时器，根据 Lyric 中的 time 改变歌词中的 Line
          this.currentLyric = new Lyric(lyric, this.handleLyric)

          if (this.playing) {
            this.currentLyric.play()
          }

          if (this.playing && this.canLyricPlay) {
            // 这个时候有可能用户已经播放了歌曲，要切到对应位置
            this.currentLyric.seek(this.currentTime * 1000)
          }
        }).catch(() => {
          // 歌词获取失败的时候 清空歌词对象等等清理操作
          this.currentLyric = null
          this.playingLyric = ''
          this.currentNum = 0
        })
      },
      // 点击歌词跳转到相对应的进度
      // line是循环数组的每一个line,所以可以取到所有line
      lyricClick(line, index) {
        const seekTime = line.time
        const currentTime = (line.time / 1000) | 0
        // this.currentTime = currentTime
        this.$refs.audio.currentTime = currentTime
        // 点击歌词,调转到想对应的seekTime时间的位置
        if (this.currentLyric) {
          this.currentLyric.seek(seekTime)
        }
        // 如果是暂停状态那么一起播放this.togglePlaying,这里也包括了歌词一起播放
        if (!this.playing) {
          this.togglePlaying()
        }
      },
      // 点击播放器右下角展开播放列表
      showPlaylist() {
        this.$refs.playlist.show()
      },
      // 语法糖设置mutations方法
      // 其实是用了mixin就可以删除这里的了,因为重复了,但是我为了看的清晰逻辑就不删除了
      ...mapMutations({
        setFullScreen: 'SET_FULL_SCREEN',
        setPlayingState: 'SET_PLAYING_STATE',
        setCurrentIndex: 'SET_CURRENT_INDEX',
        setPlayMode: 'SET_PLAY_MODE',
        setPlayList: 'SET_PLAYLIST'
      }),
      ...mapActions([
        'savePlayHistory'
      ])
    },
    watch: {
      // 一开始播放/切歌(更改了currentSong)就play()播放
      currentSong(newSong, oldSong) {
        // 切换歌曲模式时候,新歌曲和老歌曲id一样的时候,直接返回,不会执行下面播放的功能,
        // 因为都是同一首歌,切换模式而已,没必要换歌曲
        // if (newSong.id === oldSong.id) {
        //   return
        // }
        // deleteSong的时候,如果删除最后一首歌曲,那么newSong就是 {}空对象, oldSong就是最后一首歌曲,所以就是undefined === {..}
        // 所以不成立,继续往下面执行,不会return 跳出函数,
        // 所以下面拿歌词的时候就会报错 this.currentSong.getLyric().then((lyric) => {},根本就没有this.currentSong
        // 所以我们需要判断如果是!newSong.id 为true就return,让他不能是undefined,不做下面的逻辑
        if (!newSong.id || !newSong.url || newSong.id === oldSong.id) {
          return
        }
        // 我切歌曲的时候,歌词一直在跳动?
        // 因为歌词是因为currentLyric对象它的内部功能完成歌词的跳跃,每一个currentLyric跳动是因为一个计时器跳转,因为每次跳转都会new一个新的新的Lyric的新的对象
        // 但是我们之前对象并没有做清理操作,也就是之前的currentLyric有一个计时器在里面,所以我没每一次获取一个新的对象,那么我们就清除
        if (this.currentLyric) {
          this.currentLyric.stop()
          this.currentTime = 0
          this.playingLyric = ''
          this.currentNum = 0
        }
        // 每一次歌曲切换就会让songReady = false 让歌曲没准备,延迟1秒播放后触发onplay,再将songReady = true
        this.songReady = false
        this.canLyricPlay = false
        // 需要调用this.$nextTick解决播放的bug
        // 解决微信后台的bug,要使用setTimeout(()=> {},1000) 但是有bug啊,切歌曲会弹回,一开始播放时候点击暂停还是会播放...怎么解决呢？
        // 用this.$nextTick好像还没问题
        // 确保this.timer计时器只执行最后一次setTimeout
        this.$refs.audio.src = newSong.url
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          this.songReady = true
          this.$refs.audio.play()
        }, 1000)
        this.getLyric()
        // 不一样: currentSong一更改意味着会换一手歌曲播放,所以我们默认播放后,设置vuex中的播放状态,解决一些地方切换歌曲,但是播放状态没有改变,图标没有改变的bug
        // 如果是暂停状态就进去变成播放状态
        if (!this.playing) {
          this.setPlayingState(!this.playing)
        }
      },
      // 判断播放状态控制播放按钮功能
      playing(newPlaying) {
        if (!this.songReady) {
          return
        }
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
        // 整个阶段所有normal项目0.4as完成动画(包括进入,退出)
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
        // 因为是字符图标,所以给font-size就会有大小的变化
        .icon-play-mini, .icon-pause-mini, .icon-playlist
          font-size 30px
          color $color-theme-d
        // 设置小播放器的绝对定位和svg图片融合在一起
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
