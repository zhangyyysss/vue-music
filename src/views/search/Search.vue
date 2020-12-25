<template>
  <div class="search">
    <!--  搜索框  -->
    <div class="search-box-wrapper">
        <search-box ref="searchBox" @query="onQueryChange"></search-box>
    </div>
    <!--  热门搜索区,没有查询字段的时候显示  -->
    <div class="shortcut-wrapper" v-show="!query" ref="shortcutWrapper">
      <scroll :refreshDelay="refreshDelay" :data="shortcut" class="shortcut" ref="shortcut">
        <div>
          <div class="hot-key">
            <h1 class="title">热门搜索</h1>
            <ul>
              <!--  点击热搜词,将其填入input -->
              <li @click="addQuery(item.k)" class="item" v-for="(item, index) in hotKey" :key="index">
                <span>{{item.k}}</span>
              </li>
            </ul>
          </div>
          <!--  如果vuex中的searchHistory没有数据,那么没有搜索记录,我们隐藏      -->
          <div class="search-history" v-show="searchHistory.length">
            <h1 class="title">
              <span class="text">搜索历史</span>
              <span class="clear" @click="showConfirm">
              <i class="icon-clear"></i>
            </span>
            </h1>
            <search-list
              :searches="searchHistory"
              @select="addQuery"
              @delete="deleteSearchHistory"></search-list>
          </div>
        </div>
      </scroll>
    </div>
    <div class="search-result" v-show="query" ref="searchResult">
      <suggest :query="query" @listScroll="blurInput" @listflick="blurInput" @select="saveSearch" ref="suggest"></suggest>
    </div>
    <confirm ref="confirm" text="是否清空所有搜索历史?" confirmBtnText="清空" @confirm="clearSearchHistory"></confirm>
    <router-view></router-view>
  </div>
</template>

<script>
  import searchBox from 'components/common/search-box/search-box'
  import searchList from 'components/common/search-list/search-list'
  import Confirm from 'components/common/confirm/confirm'
  import Scroll from 'components/common/scroll/Scroll'
  import Suggest from 'components/content/suggest/suggest'
  import {getHotKey} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {mapActions} from 'vuex'
  import {playlistMixin, searchMixin} from 'common/js/mixin'

  export default {
    mixins: [playlistMixin, searchMixin],
    name: 'Search',
    computed: {
      // 因为滚动区域有两个值都是异步加载的,所以我们选择用一个计算属性计算这两个值concat起来返回,
      // 只要其中一个值改变,我们computed就会重新计算shortcut,重新赋值
      shortcut() {
        return this.hotKey.concat(this.searchHistory)
      }
      // 有公用的js部分,我们封装mixin里面了
      // ...mapGetters([
      //   'searchHistory'
      // ])
    },
    components: {
      searchBox,
      Suggest,
      searchList,
      Confirm,
      Scroll
    },
    data() {
      return {
        hotKey: []
        // 有公用的js部分,我们封装mixin里面了
        // query: ''
      }
    },
    created() {
      this._getHotKey()
    },
    methods: {
      _getHotKey() {
        getHotKey().then((res) => {
          if (res.code === ERR_OK) {
            // 截取前10个数据
            this.hotKey = res.data.hotkey.slice(0, 10)
          }
        })
      },
      // 有公用的js部分,我们封装mixin里面了
      // 子组件的query一旦发生改变,触发onQueryChange,再次赋予新的值,再把这个值传给suggest.vue数据请求
      // 点击父组件得到的item,怎么传给子组件中search-box中呢?能不能设置一个变量,再传进去呢?父传子就好了啊,好麻烦,还会重名,父得设置data, 子得设置props,还重名,不推荐
      // 我们给search-box添一个方法接口,setQuery, setQuery(query){ this.query = query }
      // addQuery(query, index) {
      //   this.$refs.searchBox.setQuery(query)
      // },
      // onQueryChange(newQuery) {
      //   this.query = newQuery
      // },
      // input框失去焦点
      // 调用的是searchBox的blur的方法,searchBox中的blur方法中还有方法
      // blurInput() {
      //   this.$refs.searchBox.blur()
      // },
      // 把我们当前的搜索框的query放进去
      // saveSearch() {
      //   this.saveSearchHistory(this.query)
      // },
      // 我们直接在dom中使用了这个this.deleteSearchHistory(item)和this.clearSearchHistory(),就不需要在这里添加这两个方法了
      // 删除点击相应的item
      // deleteSearch(item) {
      //   this.deleteSearchHistory(item)
      // },
      // 清空所有vuex和localStorage中的所有历史记录
      // clearSearch() {
      //   this.clearSearchHistory()
      // },
      showConfirm() {
        this.$refs.confirm.show()
      },
      // mixin 做自适应,样式记得使用fixed布局,或者可以使用bottom的定位布局
      handlePlaylist(playList) {
        const bottom = playList.length > 0 ? '60px' : ''

        this.$refs.searchResult.style.bottom = bottom
        this.$refs.shortcut.refresh()

        this.$refs.shortcutWrapper.style.bottom = bottom
        this.$refs.suggest.refresh()
      },
      ...mapActions([
        'clearSearchHistory'
      ])
    },
    watch: {
      query(newQuery) {
        if (!newQuery) {
          setTimeout(() => {
            this.$refs.shortcut.refresh()
          }, 20)
        }
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  .search
    .search-box-wrapper
      margin 20px
    .shortcut-wrapper
      position fixed
      top 178px
      bottom 0
      width 100%
      .shortcut
        height 100%
        overflow hidden
        .hot-key
          margin 0 20px 20px 20px
          .title
            margin-bottom 20px
            font-size $font-size-medium
            color $color-text-l
          .item
            display inline-block
            padding 5px 10px
            margin 0 20px 10px 0
            border-radius 6px
            background: $color-highlight-background
            font-size $font-size-medium
            color $color-text-d
        .search-history
          position relative
          margin 0 20px
          .title
            display flex
            align-items center
            height 40px
            font-size $font-size-medium
            color $color-text-l
            .text
              flex 1
            .clear
              // 增大点击范围,更加方便点击,体验更好
              extend-click()
              .icon-clear
                font-size $font-size-medium
                color $color-text-d
    .search-result
      position fixed
      width 100%
      top 178px
      // bottom 相当于截断作用啊,原本的我们把区域定死在可视区底部
      bottom 0
</style>
