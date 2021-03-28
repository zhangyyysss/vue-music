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
      <div class="loading-container">
        <loading v-show="!songs.length"></loading>
      </div>
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
      // 给歌曲列表固定top值,因为list没有设置top值,以bottom作为底部
      // 我们需要设置top来限制滚动区域的同时,和bg-layer同步
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
        // 滚动无缝贴合的percent参数(0-1)
        const percent = Math.abs(newVal / this.imageHeight)

        // 之所以使用style['transfrom']的方式,不使用style.transform是因为下面可以加上webkitTransform
        this.$refs.layer.style[transform] = `translate3d(0, ${tranlateY}px, 0)`
        // 如果手指往下拉,1.放大图片 2.zIndex = 10
        if (newVal > 0) {
          scale = 1 + percent
          zIndex = 10
          // 这个放大照片,位置也会放大,所以我们需要提升照片的高度zIndex = 10, 全都是细节!
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
          // this.$refs.bgImage.style['filter'] = ''
          this.$refs.playbtn.style.display = 'none'
          // 还没有顶边的情况
          // 1.设置bgImage的paddingTop = `70%`
          // 3.将playbtn显示
        } else {
          // 因为我们的bgImage是靠着paddingTop来撑开的,我们滚动区域就是下面的一小个区域,但是
          // 滚动的时候bg-layer层级介于bgImage- bg-layer - list ,不能太高,盖住list,就无法滚动了
          // 不能太低,太低,向上滚动盖不住bgImage,因为我们是按照样式和html来写样式,后来居上,所以层级顺序也是bgImage- bg-layer - list
          // 所以我们就没有写index了,写了也没关系,依次变大,
          // 所以思路就是,我们滚动scroll层,bg-layer跟着往上移动,bg-layer盖住照片层,但是我们设置了一个最大滚动范围
          // 到了最大滚动范围,将图片padding-top 设置为40px,设置z-index,顶部才能盖住歌曲,随机播放按钮设置为display:none隐藏按钮
          // 相反,就是给图片设置paddingTop,设置按钮显示出来:display:block
          // 注意,bg-image - bg-layer -scroll滚动层, 都是在一个层级,使用的是障眼法!!!!!
          this.$refs.bgImage.style.paddingTop = `70%`
          this.$refs.playbtn.style.display = 'block'
        }
        // 统一设置zIndex
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
        // 这个play类主要功能就是
        // 1.做外边框,
        // 2.div水平居中(定位)
        // 3.div内文本水平居中
        // 4.div内文本颜色
        // 5.消除里面内敛元素的间隙font-size: 0,
        // 需要子内联元素重新定义字体大小,否则继承font-size: 0 不显示
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
          // icon图标和文本采用i标签和span标签 行内元素 display:inline-block
          // 1.vertical-middle: middle 行内元素中线对齐
          // 2.设置字体大小撑起来
          // 3.margin设置间距
          .icon-play
            display: inline-block
            vertical-align: middle
            margin-right: 6px
            font-size: $font-size-medium-x
          .text
            display: inline-block
            vertical-align: middle
            font-size: $font-size-small
      // filter就是bg-image的铺满遮罩层,我们用来做虚化背景的效果
      .filter
        position absolute
        top 0
        left 0
        width 100%
        height 100%
        background: rgba(7, 17, 27, .4)
        transform-origin top
        background-size cover
    // bg-layer我们用来做移动后,他也会向上滚动,看起来视觉效果,像是拖这一个黑色的背景往上走
    // 高度就是手机屏幕高度,父元素的100%,就是music-list,
    // 所以铺满全屏,因为是绝对定位占据空间,并且bg-image的padding-top 70%推下去了
    //  如果是absolute,因为没有内容,所以宽度为0,背景颜色就没有了,就不是一块黑色的背景
    // 但是我们给宽度不就行了,所以这个层,是absolute也行,是relative也行
    .bg-layer
      position absolute
      width 100%
      height 100%
      background: $color-background
    // scroll滚动模块
    // 为什么list需要固定高度,有固定高度,scroll组件才可以正常滚动啊
    // 如果我们设置了.list的固定高度height:100%,一开始没问题,到后面再进入歌曲画面就会有顶页的问题(不建议使用)
    // 因为我们设置了position: absolute 并且 bottom 0,所以是底部着地,头部在很上很上面
    // 所以我们需要设置top值,让他变的小小个!包裹着列表li
    // 为什么mounted要给这个滚动容器一个固定的高度呢?我们直接给一个高度不行吗?
    // 答案是不行,因为这个高度是一个动态高度,是根据我们照片的clientHeight计算出来的top值
    // 每个设备显示照片的clientHeight都不同,为什么不同,因为我们的照片是用padding-top 70%
    // 所以越大的设备,相反的,照片也越大,如果我们使用固定的top值,就会显示在很上层,并且向上拖动的时候,我们的
    // bg-layer层和list层是无法同步的,根本就不是重叠一起,所以说我们这个top必须动态设置
    .list
      position absolute
      bottom 0
      width 100%
      // overflow hidden
      background: $color-background
      // 设置song-list两边padding
      .song-list-wrapper
        padding: 20px 30px
        // 如果没有歌曲的包裹定位
      .loading-container
        position absolute
        width 100%
        top 50%
        transform translateY(-50%)
</style>
