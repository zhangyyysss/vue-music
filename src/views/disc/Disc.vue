<template>
  <transition name="slide" appear>
    <!--  把数据传递到music-list中展示 -->
    <music-list :title="title" :bg-image="bgImage" :songs="songs"></music-list>
  </transition>
</template>

<script>
  import MusicList from 'components/content/music-list/music-list'
  import {mapGetters} from 'vuex'
  import {getSongList} from 'api/recommend'
  import {ERR_OK} from 'api/config'
  import {createSong} from 'common/js/song'
  import {isValidMusic, processSongsUrl} from '../../common/js/song'

  export default {
    name: 'Disc',
    data() {
      return {
        songs: []
      }
    },
    components: {
      MusicList
    },
    computed: {
      title() {
        return this.disc.dissname
      },
      bgImage() {
        return this.disc.imgurl
      },
      ...mapGetters([
        'disc'
      ])
    },
    created() {
      this._getSongList()
      console.log(this.$route.params)
    },
    methods: {
      _getSongList() {
        if (!this.disc.dissid) {
          this.$router.push('/recommend')
          return
        }
        getSongList(this.disc.dissid).then(res => {
          if (res.code === ERR_OK) {
            console.log(res.cdlist[0].songlist)
            // console.log(this._normalizeSongs(res.cdlist[0].songlist))
            processSongsUrl(this._normalizeSongs(res.cdlist[0].songlist)).then((songs) => {
              this.songs = songs
            })
          }
        })
      },
      // 对初始数据数组进行处理
      _normalizeSongs(list) {
        let ret = []
        list.forEach((musicData) => {
          // 过滤付费和歌曲不存在的歌曲
          if (isValidMusic(musicData)) {
            ret.push(createSong(musicData))
          }
        })
        return ret
      }
    }
  }
</script>

<style scoped lang="stylus">
  .slide-enter-active, .slide-leave-active
    transition: all 0.3s

  .slide-enter,.slide-leave-to
    transform: translateX(100%)
</style>
