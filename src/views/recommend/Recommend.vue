<template>
  <div class="recommend">
    <scroll class="recommend-content" :data="discList">
      <div>
        <div class="slider-wrapper">
        </div>
        <div class="recommend-list">
          <div class="list-title">热门歌单推荐</div>
          <ul>
            <li v-for="(item, index) in discList" :key="index" class="item">
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
  </div>
</template>

<script>
  import Loading from 'components/common/loading/Loading.vue'
  import Scroll from 'components/common/scroll/Scroll.vue'
  import {getRecommend, getDiscList} from 'api/recommend.js'
  import {ERR_OK} from 'api/config.js'

  export default {
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
      }
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
