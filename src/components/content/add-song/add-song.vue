<template>
  <transition name="slide">
    <!--  禁止冒泡到父组件,点击事件会父组件触发hide,所有点击哪里都会闪退,所以需要禁止冒泡  -->
    <div class="add-song" v-show="showFlag" @click.stop>
      <!--  头部  -->
      <div class="header">
        <h1 class="title">添加歌曲到列表</h1>
        <!--   我们通过组件自身的方法hide,控制showFlag这个标识符,显示或者隐藏该组件     -->
        <div class="close" @click.stop="hide">
          <i class="icon-close"></i>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-box-wrapper">
        <!--   监听search-box派发的query事件,一直更改新的newQuery会被记录,我们保存在addSong组件中的query保存     -->
        <search-box placeholder="搜索歌曲" @query="onQueryChange" ref="searchBox"></search-box>
      </div>

      <!-- 最近播放/搜索历史 -->
      <!--   通过search-box传过来的newQuery来data保存后,再去判断如果没有query的时候,显示   -->
      <div class="shortcut" v-show="!query">
        <switches :switches="switches" @switch="switchItem" :currentIndex="currentIndex"></switches>
        <div class="list-wrapper">
          <!--    如果currentIndex === 0 我们才会把这个组件v-if显示出来,我们:data="playHistory"保证滚动     -->
          <scroll v-if="currentIndex === 0" :data="playHistory" class="list-scroll" ref="playHistory">
            <div class="list-inner">
              <song-list :songs="playHistory" @select="selectSong"></song-list>
            </div>
          </scroll>
          <!--    如果currentIndex === 1 我们才会v-if显示 ,我们数据  :data="searchHistory" 保证滚动      -->
          <scroll :refreshDelay="refreshDelay" v-if="currentIndex === 1" :data="searchHistory" class="list-scroll" ref="searchHistory">
            <div class="list-inner">
              <search-list :searches="searchHistory" @delete="deleteSearchHistory" @select="addQuery"></search-list>
            </div>
          </scroll>
        </div>
      </div>
      <!--   通过search-box传过来的newQuery来data保存后,再去判断如果有query的时候,显示   -->
      <div class="search-result" v-show="query">
        <suggest :query="query" :showSinger="showSinger" @listScroll="blurInput" @listflick="blurInput" @select="selectSuggest"></suggest>
      </div>

      <!--   顶部一个提示框   -->
      <top-tip ref="topTip" class="tip-title" :delay="2000">
        <i class="icon-ok">
          <span class="text">1首歌曲已经添加到播放队列</span>
        </i>
      </top-tip>
    </div>
  </transition>
</template>

<script>
  import SearchBox from 'components/common/search-box/search-box'
  import Suggest from 'components/content/suggest/suggest'
  import Switches from 'components/common/switches/switches'
  import Scroll from 'components/common/scroll/Scroll'
  import SongList from 'components/common/song-list/song-list'
  import SearchList from 'components/common/search-list/search-list'
  import TopTip from 'components/common/top-tip/top-tip'
  import Song from 'common/js/song'

  import {searchMixin} from 'common/js/mixin'
  import {mapGetters, mapActions} from 'vuex'

  export default {
    mixins: [searchMixin],
    name: 'add-song',
    computed: {
      ...mapGetters([
        'playHistory'
      ])
    },
    components: {
      SearchBox,
      Suggest,
      Switches,
      Scroll,
      SongList,
      SearchList,
      TopTip
    },
    data() {
      return {
        showFlag: false,
        showSinger: false,
        currentIndex: 0,
        switches: [
          {name: '最近播放'},
          {name: '搜索历史'}
        ],
        playList: []
      }
    },
    methods: {
      show() {
        this.showFlag = true
        setTimeout(() => {
          if (this.currentIndex === 0) {
            this.$refs.playHistory.refresh()
          } else {
            this.$refs.searchHistory.refresh()
          }
        }, 20)
      },
      hide() {
        this.showFlag = false
        // this.$emit('back')
      },
      // 可以省略这个的把~~~~~~~mixin里面都有了,重新调用一下?没用的~~~~~~~~这还是一个死循环
      selectSuggest() {
        this.saveSearch()
        this.showTip()
      },
      // 修改了currentIndex 又作为props传给子组件switches,又因为子组件中 :class="{active: currentIndex === index}"
      // 所以子组件当前样式对应上的样式就是active,高亮
      switchItem(index) {
        this.currentIndex = index
      },
      selectSong(song, index) {
        // [Vue warn]: Error in nextTick: "TypeError: this.currentSong.getLyric is not a function"
        // found in
        // 因为我们是吧 playHistory传递给了songs  :songs = "playHistory"
        // PlayHistory 是一个的数组?他里面有一个一个的对象,它的对象并不是song的实例,因为是从缓存里面取的,
        // 因为取的时候 ...mapGetter(['playHistory']),loadPlay(),是在缓存localstorage里面拿的
        // export function loadPlay() {
        //  return storage.get(PLAY_KEY, [])
        // }
        // 所以他是一个具有song所有属性,但不是song的一个实例,所有它也没有this.currentSong.getLyric这个方法啊.所以会报错
        // 所以我们在这里得转化song的实例,我们得new它一下 例如:let songOne = new Song(song) ,就可以看到原型中的方法和constructor
        // 为什么要判断if (index !== 0) ,这样第一首点不了啊~~~~~~~ 因为逻辑就是第一首歌正在播放啊,所以不用点,其实也没有bug
        if (index !== 0) {
          this.insertSong(new Song(song))
          this.showTip()
        }
      },
      showTip() {
        this.$refs.topTip.show()
      },
      ...mapActions([
        'insertSong'
      ])
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  // 这个组件fixed布局,铺满整个屏幕
  .add-song
    position fixed
    top 0
    bottom 0
    width 100%
    z-index 200
    background $color-background
    &.slide-enter-active, &.slide-leave-active
      transition all 0.3s
    &.slide-enter, &.slide-leave-to
      transform translate3d(100%, 0, 0)
     // 头部使用relative布局, 高度是44px,文字居中
    .header
      position relative
      height 44px
      text-align center
      // 字体行高和父元素高度一样,垂直居中,控制字体大小和颜色
      .title
        line-height 44px
        font-size $font-size-large
        color $color-text
      // 用div包裹后控制div控制字符图标的位置
      .close
        position absolute
        top 0
        right 8px
        // 控制字符图标样式和 display:block,只有设置display: block才能色值padding啊,否者上下padding无效的啊
        // 设置字体大小和颜色(其实就是控制字体图标)
        .icon-close
          display block
          padding 12px
          font-size 20px
          color $color-theme
     // 上下左右间距20px
    .search-box-wrapper
      margin 20px
     // shortcut 分区就是scroll的总分区
    .shortcut
      // 使用绝对定位top 165 距离顶部有距离, bootom0
      // 宽度100%
      .list-wrapper
        position: absolute
        top: 165px
        bottom: 0
        width: 100%
        // scroll组件是父亲的100%,超出部分隐藏
        .list-scroll
          height: 100%
          overflow: hidden
          // 内部的间距 padding
          .list-inner
            padding: 20px 30px
    .search-result
      position: fixed
      top: 124px
      bottom: 0
      width: 100%
    .tip-title
      text-align: center
      padding: 18px 0
      // 图标和文字之间的font-size空隙消除
      font-size: 0
      .icon-ok
        font-size: $font-size-medium
        color: $color-theme
        margin-right: 4px
        &.icon-ok::before
          margin-right 10px
      .text
        font-size: $font-size-medium
        color: $color-text
</style>
