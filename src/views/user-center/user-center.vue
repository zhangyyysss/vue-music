<template>
  <transition name="slide">
    <div class="user-center" ref="userCenter">
      <div class="back" @click="back">
        <i class="icon-back"></i>
      </div>
      <div class="switches-wrapper">
        <switches :switches="switches" @switch="switchItem" :currentIndex="currentIndex"></switches>
      </div>
      <div class="play-btn" @click="random">
        <i class="icon-play"></i>
        <span class="text">随机播放全部</span>
      </div>
      <div class="list-wrapper" ref="listWrapper">
        <scroll class="list-scroll" v-if="currentIndex === 0" :data="favoriteList" ref="favoriteList">
          <div class="list-inner">
            <song-list :songs="favoriteList" @select="selectSong"></song-list>
          </div>
        </scroll>
        <scroll class="list-scroll" v-if="currentIndex === 1" :data="playHistory" ref="playHistory">
          <div class="list-inner">
            <song-list :songs="playHistory" @select="selectSong"></song-list>
          </div>
        </scroll>
      </div>
      <!--   当列表没有的时候展示no-result组件     -->
      <!--   怎么控制几时展示?怎么好点?有两个变量啊 ,显示条件我们是用一个计算属性 noResult  -->
      <div class="no-result-wrapper" v-show="noResult">
        <!--   根据不同 currentIndex,返回不同的文本内容     -->
        <no-result :title="resultText"></no-result>
      </div>
    </div>
  </transition>
</template>

<script>
  import Switches from 'components/common/switches/switches'
  import Scroll from 'components/common/scroll/Scroll'
  import SongList from 'components/common/song-list/song-list'
  import NoResult from 'components/common/no-result/no-result'
  import Song from 'common/js/song'
  import {mapGetters, mapActions} from 'vuex'
  import {playlistMixin} from 'common/js/mixin'

  export default {
    mixins: [playlistMixin],
    name: 'user-center',
    components: {
      Switches,
      Scroll,
      SongList,
      NoResult
    },
    computed: {
      resultText() {
        return this.currentIndex === 0 ? '你没有喜欢的歌曲呢~' : '你最近没有听过歌曲呢~'
      },
      noResult() {
        // 不能返回字符串啊? 字符永远为true~~~~~大哥大
        return this.currentIndex === 0 ? !this.favoriteList.length : !this.playHistory.length
      },
      ...mapGetters([
        'playHistory',
        'favoriteList',
        'playList'
      ])
    },
    data() {
      return {
        switches: [
          {name: '我喜欢的'},
          {name: '最近听的'}
        ],
        currentIndex: 0
      }
    },
    methods: {
      // 点击back按钮 ,路由返回
      back() {
        this.$router.back()
      },
      // 切换不同的switchItem
      switchItem(index) {
        this.currentIndex = index
      },
      selectSong(song, index) {
        this.insertSong(new Song(song))
      },
      handlePlaylist() {
        const bottom = this.playList.length ? '60px' : ''
        this.$refs.listWrapper.style.bottom = bottom
        // 这两个scroll组件是v-if的,所以有可能是不存在的,所以我们使用this.$refs.favoriteList.refresh()就会报错
        // 用之前做一个判断, 如果有,那么就执行 this.$refs.favoriteList.refresh()
        // 对了,因为mixins中watch 了 vuex 中的playList,只要有播放列表,那么就是有下面那个mini-player,所以我们就给一个bottom
        // 并且找机会刷新~~~~~~~
        this.$refs.favoriteList && this.$refs.favoriteList.refresh()
        this.$refs.playHistory && this.$refs.playHistory.refresh()
      },
      random() {
        // 这个list不是song的实例,所以我们得对它修改
        // 我们根据currentIndex 来判断传入的是哪个音乐列表
        let list = this.currentIndex === 0 ? this.favoriteList : this.playHistory
        if (list.length === 0) {
          return
        }
        let songList = list.map((song) => {
          return new Song(song)
        })
        // 因为是解构语法所以只能是 list: songList
        // 或者同名 list: list 缩写成list 也是行的 ~
        this.randomPlay({
          list: songList
        })
      },
      ...mapActions([
        'insertSong',
        'randomPlay'
      ])
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  // 铺满全屏幕的fixed布局
  .user-center
    position: fixed
    top: 0
    bottom: 0
    z-index: 100
    width: 100%
    background: $color-background
    // 移入移出的动画
    &.slide-enter-active, &.slide-leave-active
      transition: all 0.3s
    &.slide-enter, &.slide-leave-to
      transform: translate3d(100%, 0, 0)
      // 按钮布局绝对定位
    .back
      position absolute
      top 0
      left 6px
      z-index 50
      // block padding 字符大小和颜色
      .icon-back
        display block
        padding 10px
        font-size $font-size-large-x
        color $color-theme
    .switches-wrapper
      margin 10px 0 30px 0
    .play-btn
      box-sizing border-box
      width 135px
      padding 7px 0
      margin 0 auto
      text-align center
      border 1px solid $color-text-l
      border-radius 100px
      // 清除两个inline-block的空隙
      font-size 0
      // 两个inline-block使用vertical-align: middle
      .icon-play
        display inline-block
        margin-right 6px
        vertical-align middle
        font-size $font-size-medium-x
      .text
        display: inline-block
        vertical-align: middle
        font-size: $font-size-small
    .list-wrapper
      position: absolute
      top: 110px
      bottom: 0
      width: 100%
      .list-scroll
        height: 100%
        overflow: hidden
        .list-inner
          padding: 20px 30px
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
