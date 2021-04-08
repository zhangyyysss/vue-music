<template>
  <div class="recommend"  ref="recommend">
    <scroll class="recommend-content" :data="discList" ref="recommendContent">
      <div>
        <!--  这里的v-if="recommends.length > 0"是非常有必要的,因为请求的recommends是一个异步的过程,所以如果在请求完成前我们就渲染了slider组件,那么我们slider中计算的轮播图高度宽度都是不准确的    -->
        <!--  所以我们加上v-if="recommends.length > 0",是确保了数据recommends的存在(轮播图的数据存在),并且才开始进去slider中渲染slider组件,这个时候的轮播图计算就是正确的拉  -->
        <div class="slider-wrapper" v-if="recommends.length > 0">
          <slider>
            <div v-for="(item, index) in recommends" :key="index">
              <a>
                <!-- 图片加载完以后做刷新，防止scroll高度计算不对 -->
                <img :src="item.picUrl" alt="" @load="imgLoad()">
              </a>
            </div>
          </slider>
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
  import Slider from 'components/common/slider/Slider.vue'
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
      Loading,
      Slider
    },
    data() {
      return {
        recommends: [],
        discList: []
      }
    },
    created() {
      this._getRecommend()
      this._getDiscList()
    },
    methods: {
      imgLoad() {
        // checkLoaded防止图片加载完的刷新多次调用
        if (!this.checkLoaded) {
          this.$refs.recommendContent.refresh()
          this.checkLoaded = true
        }
      },
      _getRecommend() {
        getRecommend().then((res) => {
          if (res.code === ERR_OK) {
            this.recommends = res.data.slider
          }
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
      // 如果把scroll组件做成v-if="discList.length"会有一个生命周期的问题,虽然可以解决滚动的问题,我们确保有discList数据,我们采取渲染scroll组件,所以计算的高度是准确的
      // 首先handlePlaylist是在所有vue生命周期前执行的?为什么?因为mixins,会优先执行里面的生命周期
      // 此时因为是v-if="discList.length",scroll组件还没有被加载在模板中,所以this.$refs.recommend是拿不到scroll组件的所以报错了
      // 我们做成:data="discList" 传入数据再执行refresh()比较稳妥
      handlePlaylist() {
        const bottom = this.playList.length ? '60px' : ''
        this.$refs.recommend.style.bottom = bottom
        this.$refs.recommendContent.refresh()
      },
      // 点击推荐歌单事件(和singer.vue中selectSinger一样的,路由跳转而已,我们想要歌单数据传到歌单详情页,跟歌手一样的)
      selectItem(item, index) {
        // this.$router.push(`/recommend/${item.dissid}`)等效于下面的代码
        // this.$router.push(`/recommend/${item.dissid}`)
        console.log(item)
        this.$router.push(`/recommend/${item.dissid}`)
        // 把点击的item,歌单信息对象传进vuex中保管
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
      .slider-wrapper
        position: relative
        width: 100%
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
