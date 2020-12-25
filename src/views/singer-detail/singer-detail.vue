<template>
  <transition name="slide" appear>
    <music-list :songs="songs" :title="title" :bg-image="bgImage"></music-list>
  </transition>
</template>

<script>
  import {mapGetters} from 'vuex'
  import {getSingerDetail} from 'api/singer'
  import {ERR_OK} from 'api/config'
  import {createSong, isValidMusic, processSongsUrl} from 'common/js/song'

  import MusicList from 'components/content/music-list/music-list'

  export default {
    name: 'singer-detail',
    data() {
      return {
        songs: []
      }
    },
    computed: {
      title() {
        return this.singer.name
      },
      bgImage() {
        return this.singer.avatar
      },
      ...mapGetters([
        'singer'
      ])
    },
    components: {
      MusicList
    },
    created() {
      this._getDetail()
    },
    methods: {
      _getDetail() {
        // 处理边界情况
        // 如果说用户在操作过程中刷新了,那么this.singer.id就没了,因为是store中保存的,set数据是我们点击进去传进store中的
        // 刷新之后 state中的singer是一个空对象,所以获取不到数据的
        // 我们就用router,this.$router.push('/singer') 到singer页面中去
        // 在详情页没有数据的情况下刷新页面，强制回到singer页面
        if (!this.singer.id) {
          this.$router.push('/singer')
          return
        }
        // 根据父路由传过来的this.singer的id属性,我们去数据请求相对应的歌曲
        getSingerDetail(this.singer.id).then(res => {
          if (res.code === ERR_OK) {
            processSongsUrl(this._normalizeSongs(res.data.list)).then((songs) => {
              this.songs = songs
            })
          }
        })
      },
      _normalizeSongs(list) {
        let ret = []
        list.forEach(item => {
          // let musicData = item.musicData 下面代码相当于结构成这样
          let {musicData} = item
          // 权限判断~过滤作用,
          if (isValidMusic(musicData)) {
            // 再把类push进一个数组
            ret.push(createSong(musicData))
          }
        })
        // 将我们的数据整理好的ret数组返回
        return ret
      }
    }
  }
</script>

<style scoped lang="stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

    // 实现是在偏移后的右侧 ,所以进场的时候 ,所以是从右侧往左侧走
    //  退场的时候是从 translateX(0%) -> translateX(100%)的过程
  .slide-enter,.slide-leave-to
    transform: translateX(100%)
</style>
