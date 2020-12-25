<template>
  <div class="recommend"  ref="recommend">
    <scroll class="recommend-content" :data="discList" ref="recommendContent">
      <div>
        <div class="slider-wrapper">
        </div>
        <div class="recommend-list">
          <div class="list-title">热门歌单推荐</div>
          <ul>
            <li
              v-for="(item, index) in discList"
              :key="index"
              class="item"
              @click="selectItem(item,index)">
              <div class="icon">
                <img height="60px" width="60px" v-lazy="item.imgurl" alt="">
              </div>
              <div class="text">
                <h2 class="name" v-html="item.creator.name"></h2>
                <p class="desc">{{item.dissname}}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div class="loading-container" v-show="!discList.length">
        <loading></loading>
      </div>
    </scroll>
    <!-- router-view 路由的容器   -->
    <router-view></router-view>
  </div>
</template>

<script>
  import Loading from 'components/common/loading/Loading.vue'
  import Scroll from 'components/common/scroll/Scroll.vue'
  import {getRecommend, getDiscList} from 'api/recommend.js'
  import {ERR_OK} from 'api/config.js'
  import {playlistMixin} from 'common/js/mixin'
  import {mapMutations} from 'vuex'

  export default {
    mixins: [playlistMixin],
    name: 'Recommend',
    components: {
      Scroll,
      Loading
    },
    data() {
      return {
        discList: []
      }
    },
    created() {
      this._getRecommend()
      this._getDiscList()
    },
    methods: {
      _getRecommend() {
        getRecommend().then((res) => {
          console.log(res)
        })
      },
      _getDiscList() {
        getDiscList().then((res) => {
          if (res.code === ERR_OK) {
            this.discList = res.data.list
          }
        }).catch(err => {
          console.log(err)
        })
      },
      // ,mixins混入解决底部被遮挡的问题
      handlePlaylist() {
        const bottom = this.playList.length ? '60px' : ''
        this.$refs.recommend.style.bottom = bottom
        this.$refs.recommendContent.refresh()
      },
      // 点击推荐歌单事件(和singer.vue中selectSinger一样的,路由跳转而已,我们想要歌单数据传到歌单详情页,跟歌手一样的)
      selectItem(item, index) {
        // this.$router.push(`/recommend/${item.dissid}`)
        this.$router.push({
          path: `/recommend/${item.dissid}`
        })
        // 把点击的item对象传进vuex中保管
        this.setDisc(item)
      },
      ...mapMutations({
        setDisc: 'SET_DISC'
      })
    }
  }
</script>

<style scoped lang="stylus">
  @import '~assets/css/variable.styl'
  .recommend
    position: fixed
    width: 100%
    top: 88px
    bottom: 0

    .recommend-content
      height: 100%
      overflow: hidden

    .recommend-list
      .list-title
        height 65px
        line-height 65px
        text-align center
        font-size: $font-size-medium
        color $color-theme

      .item
        display flex
        box-sizing border-box
        align-items center
        padding 0 20px 20px 20px

        .icon
          flex: 0 0 60px
          width 60px
          padding-right 20px

        .text
          display flex
          flex-direction column
          justify-content center
          flex 1
          line-height 20px
          overflow hidden
          font-size: $font-size-medium

          .name
            margin-bottom: 10px
            color: $color-text

          .desc
            color: $color-text-d
    .loading-container
      position absolute
      width 100%
      top 50%
      transform translateY(-50%)

</style>
