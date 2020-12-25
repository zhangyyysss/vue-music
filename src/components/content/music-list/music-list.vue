<template>
  <div class="music-list">
    <!-- 返回按钮   -->
    <div class="back" @click="backClick">
      <i class="icon-back"></i>
    </div>
    <!-- 歌手名字   -->
    <h1 class="title" v-html="title"></h1>
    <!-- 背景图片   -->
    <div class="bg-image" :style="bgStyle" ref="bgImage">
      <div class="filter" ref="filter" :style="bgStyle"></div>
      <div class="play-wrapper" ref="playbtn">
        <div class="play" v-show="songs.length > 0" ref="playBtn" @click="random">
          <i class="icon-play"></i>
          <span class="text">随机播放全部</span>
        </div>
      </div>
    </div>
    <div class="bg-layer" ref="layer"></div>
    <!-- 歌单滚动区域   -->
    <scroll @scroll="scroll" :probe-type="probeType" :listen-scroll="listenScroll" :data="songs" class="list" ref="list">
      <div class="song-list-wrapper">
        <song-list :rank="rank" :songs="songs" @select="selectItem"></song-list>
      </div>
      <loading class="loading-container" v-show="!songs.length"></loading>
    </scroll>
  </div>
</template>

<script>
  import Scroll from 'components/common/scroll/Scroll'
  import SongList from 'components/common/song-list/song-list'
  import loading from 'components/common/loading/Loading'
  import {prefixStyle} from 'common/js/dom'
  import {playlistMixin} from 'common/js/mixin'

  import {mapActions} from 'vuex'

  const transform = prefixStyle('transform')
  // const backdrop = prefixStyle('backdrop-filter')
  // console.log(backdrop)
  const RESERVE_HEIGHT = 40
  export default {
    mixins: [playlistMixin],
    name: 'music-list',
    data() {
      return {
        scrollY: 0
      }
    },
    components: {
      Scroll,
      SongList,
      loading
    },
    props: {
      bgImage: {
        type: String,
        default: ''
      },
      songs: {
        type: Array,
        default() {
          return []
        }
      },
      title: {
        type: String,
        default: ''
      },
      rank: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      bgStyle() {
        return `background-image:url(${this.bgImage})`
      }
    },
    created() {
      this.probeType = 3
      this.listenScroll = true
    },
    mounted() {
      // 将背景图片的clientHeight高度存储在变量this.imageHeight中
      this.imageHeight = this.$refs.bgImage.clientHeight
      this.minTranslateY = -this.imageHeight + RESERVE_HEIGHT
      // 给歌曲列表固定top值,
      this.$refs.list.$el.style.top = `${this.imageHeight}px`
    },
    methods: {
      scroll(p) {
        this.scrollY = p.y
      },
      backClick() {
        this.$router.back()
      },
      // 每一次点击歌曲列表的歌曲就会触发一次这个,所以一直都是顺序播放,所以没有问题
      selectItem(item, index) {
        this.selectPlay({
          // 为什么list不是item,点击哪首歌?
          // 我们选择这个值得时候,我们需要把整个list传进去,所以是this.songs
          // 那我们还要这个item?因为作为song-list组件,它是不知道我点击的时候我需要什么值,
          // song-list尽可能把所有值给我,就是this.songs,它可以把item,index给我,让我判断是哪个歌曲
          // 被点击了, 我们在music-list中得到item,用不用整个item,看具体的需求(实际情况),我们是要播放整个列表
          // 所以我们this.songs作为参数传进去
          // 子组件的行为应该是本身相关,因为子组件中selectItem不关心外部,把自身能够提供外部所用的数据通过事件的方式传递给外部(父组件)
          // 我们把整个songs传进state,然后再抓取我们想要获得的所有数据(s设置播放顺序,播放状态,顺序列表,是否宽屏...)
          list: this.songs,
          index
        })
      },
      random() {
        this.randomPlay({
          list: this.songs
        })
      },
      // mixins混入解决底部被遮挡的问题
      handlePlaylist() {
        // 因为this.playList只要是注册了就是一个数组,不管里面空还是不空判断都是true,所以判断长度准确一点
        const bottom = this.playList.length ? '60px' : ''
        this.$refs.list.$el.style.bottom = bottom
        this.$refs.list.refresh()
      },
      ...mapActions([
        'selectPlay',
        'randomPlay'
      ])
    },
    watch: {
      scrollY(newVal) {
        // 限制偏移区间
        // 定义一个tranlateY,决定layer层最大的偏移量在顶部,移动顶部就停止了,所以不会无限滚动,这样视觉效果就固定在顶部
        // this.minTranslateY 为负值,相当于-的最多就是它,所以取最大值一定不是它,所以他就是最小值
        let tranlateY = Math.max(this.minTranslateY, newVal)
        // 让背景图片层改过滚动到上面的歌曲列表,设置zIndex
        let zIndex = 0
        // 设置一个scale 控制向下滚动的时候图片放大或者向上滚动缩小
        let scale = 1
        // 设置一个高斯模糊值blur
        let blur = 0
        // 滚动无缝贴合的percent参数
        const percent = Math.abs(newVal / this.imageHeight)

        // 之所以使用style['transfrom']的方式,不使用style.transform是因为下面可以加上webkitTransform
        this.$refs.layer.style[transform] = `translate3d(0, ${tranlateY}px, 0)`
        // 如果手指往下拉,1.放大图片 2.zIndex = 10
        if (newVal > 0) {
          scale = 1 + percent
          zIndex = 10
          this.$refs.bgImage.style[transform] = `scale(${scale})`
          // 否则就是往上拉 1.透明度
        } else {
          blur = Math.min(percent * 20, 20)
          // 对filter遮罩层修改blur
          // this.$refs.filter.style['backdrop-filter'] = `blur(${blur}px)`
          this.$refs.filter.style['filter'] = `blur(${blur}px)`
        }
        // newVal是偏移新量,如果<this.minTranslateY 说明已经往上拉很多了,顶边了,
        // 1.设置bgImage的paddingTop= 0 , (测试用padding-top设置成40px代替可以啊)
        // 2.设置最基本的顶边高度`${RESERVE_HEIGHT}px`
        // 3.将playbtn隐藏
        if (newVal < this.minTranslateY) {
          zIndex = 10
          this.$refs.bgImage.style.paddingTop = `${RESERVE_HEIGHT}px`
          this.$refs.bgImage.style['filter'] = ''
          this.$refs.playbtn.style.display = 'none'
          // 还没有顶边的情况
          // 1.设置bgImage的paddingTop = `70%`
          // 2.设置bgImage的height = 0 (测试用padding-top代替可以啊)
          // 3.将playbtn显示
        } else {
          this.$refs.bgImage.style.paddingTop = `70%`
          // this.$refs.bgImage.style.height = 0
          this.$refs.playbtn.style.display = 'block'
        }
        this.$refs.bgImage.style.zIndex = zIndex
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable.styl"
  // 铺满整个屏幕的music-list fixed 布局
  .music-list
    position fixed
    z-index 100
    top 0
    bottom 0
    left 0
    right 0
    background: $color-background;
    // 因为我们要做按钮下面是图片的效果,所以只能使用绝对定位布局
    .back
      position absolute
      top 0
      left 6px
      z-index 50
      .icon-back
        display block
        padding 10px
        font-size $font-size-large-x
        color $color-theme
     // 标题文字也是用绝对定位,左边向右偏移10%,预留给back按钮的10%的位置,设置width为父元素的80%, 文字对于title来说居中
    // line-height 40px ,设置字体大小和颜色
    .title
      position absolute
      top 0
      left 10%
      width 80%
      z-index 40
      no-wrap()
      text-align center
      line-height 40px
      font-size $font-size-large
      color $color-text
      // 背景图片使用绝对定位,因为占据空间,所以上面两个back 或者文字附在上面
      // 设置宽度和父元素100%,高度为0,设置padding-top拉开与顶部的距离,因为我们是用背景图片做的
    .bg-image
      // 控制宽高比为10:7
      position relative
      width 100%
      height 0
      padding-top 70%
      transform-origin top
      background-size cover
      .play-wrapper
        position absolute
        bottom 20px
        width 100%
        z-index 50
        .play
          box-sizing border-box
          width 135px
          padding 7px 0
          margin 0 auto
          text-align center
          border 1px solid $color-theme
          color $color-theme
          border-radius 100px
          font-size 0
          .icon-play
            display: inline-block
            vertical-align: middle
            margin-right: 6px
            font-size: $font-size-medium-x
          .text
            display: inline-block
            vertical-align: middle
            font-size: $font-size-small
      .filter
        position absolute
        top 0
        left 0
        width 100%
        height 100%
        background: rgba(7, 17, 27, .4)
        transform-origin top
        background-size cover
    .bg-layer
      position relative
      height 100%
      background: $color-background
    .list
      position absolute
      top 0
      bottom 0
      width 100%
      // overflow hidden
      background: $color-background
      .song-list-wrapper
        padding: 20px 30px
      .loading-container
        position absolute
        width 100%
        top 50%
        transform translateY(-50%)
</style>
