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
      <div class="filter" ref="filter"></div>
      <div class="play-wrapper" ref="playbtn">
        <div class="play" v-show="songs.length > 0">
          <i class="icon-play"></i>
          <span class="text">随机播放全部</span>
        </div>
      </div>
    </div>
    <div class="bg-layer" ref="layer"></div>
    <!-- 歌单滚动区域   -->
    <scroll @scroll="scroll" :probe-type="probeType" :listen-scroll="listenScroll" :data="songs" class="list" ref="list">
      <div class="song-list-wrapper">
        <song-list :songs="songs" @select="selectItem"></song-list>
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

  import {mapActions} from 'vuex'

  const transform = prefixStyle('transform')
  const backdrop = prefixStyle('backdrop-filter')
  console.log(backdrop)
  const RESERVE_HEIGHT = 40
  export default {
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
      selectItem(item, index) {
        this.selectPlay({
          // 为什么list不是item,点击哪首歌?
          // 我们选择这个值得时候,我们需要把整个list传进去,所以是this.songs
          // 那我们还要这个item?因为作为song-list组件,它是不知道我点击的时候我需要什么值,
          // song-list尽可能把所有值给我,就是this.songs,它可以把item,index给我,让我判断是哪个歌曲
          // 被点击了, 我们在music-list中得到item,用不用整个item,看具体的需求(实际情况),我们是要播放整个列表
          // 所以我们this.songs作为参数传进去
          // 子组件的行为应该是本身相关,因为子组件中selectItem不关心外部,把自身能够提供外部所用的数据通过事件的方式传递给外部(父组件)
          // 我们把整个songs传进state,然后再抓取我们想要获得的所有数据
          list: this.songs,
          index
        })
      },
      ...mapActions([
        'selectPlay'
      ])
    },
    watch: {
      scrollY(newVal) {
        // 定义一个tranlateY,决定layer层最大的偏移量在顶部,移动顶部就停止了,所以不会无限滚动,这样视觉效果就固定在顶部
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

        if (newVal > 0) {
          scale = 1 + percent
          zIndex = 10
          this.$refs.bgImage.style[transform] = `scale(${scale})`
        } else {
          blur = Math.min(percent * 20, 20)
          this.$refs.filter.style['backdrop-filter'] = `blur(${blur}px)`
        }
        if (newVal < this.minTranslateY) {
          zIndex = 10
          this.$refs.bgImage.style.paddingTop = 0
          this.$refs.bgImage.style.height = `${RESERVE_HEIGHT}px`
          this.$refs.playbtn.style.display = 'none'
        } else {
          this.$refs.bgImage.style.paddingTop = `70%`
          this.$refs.bgImage.style.height = 0
          this.$refs.playbtn.style.display = 'block'
        }
        this.$refs.bgImage.style.zIndex = zIndex
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable.styl"
  .music-list
    position fixed
    z-index 100
    top 0
    bottom 0
    left 0
    right 0
    background: $color-background;
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
