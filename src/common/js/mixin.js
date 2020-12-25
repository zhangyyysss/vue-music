import {mapActions, mapGetters, mapMutations} from 'vuex'
import {playMode} from './config'
import {shuffle} from './utils'

export const playlistMixin = {
  computed: {
    ...mapGetters([
      'playList'
    ])
  },
  // dom Ready 触发事件
  mounted() {
    this.handlePlaylist(this.playList)
  },
  // 在keep-alive组件中切换进来执行activated事件
  activated() {
    this.handlePlaylist(this.playList)
  },
  methods: {
    handlePlaylist(playlist) {
      throw new Error('component must implement handlePlaylist method')
    }
  },
  watch: {
    // 当监控到playlist值有变化的时候,执行this.handlePlaylist(newVal),并把新值传入
    playList(newVal) {
      this.handlePlaylist(newVal)
    }
  }
}

export const playerMixin = {
  computed: {
    // 切换不同播放模式的图片
    iconMode() {
      return this.mode === playMode.sequence ? 'icon-sequence' : this.mode === playMode.loop ? 'icon-loop' : 'icon-random'
    },
    ...mapGetters([
      // 控制播放器显示和隐藏
      'fullScreen',
      // 整个播放器是否渲染
      'playList',
      // 获取点击的对应的歌曲
      'currentSong',
      // 获取歌曲是否播放状态
      'playing',
      // 获取正在播放歌曲的索引
      'currentIndex',
      // 获取当前的播放模式
      'mode',
      // 获取当前播放顺序列表list
      'sequenceList',
      // 喜欢列表
      'favoriteList'
    ])
  },
  methods: {
    // 切换3种模式的逻辑
    changeMode() {
      // 3种模式切换用下面这个方法,(this.mode+1)%3,就会一直在0-3之间切换循环了,不会跑到4(不用使用if语句,这个简单多了)这个做模式切换最合适不过了~~~~~~~~~
      const mode = (this.mode + 1) % 3
      // let mode = this.mode + 1
      // if (mode >= 3) {
      //   mode = 0
      // }
      // 通过mutations修改mode
      this.setPlayMode(mode)
      // 设置一个list保存我们播放列表
      let list = null
      // 如果播放模式是随机模式时候
      if (mode === playMode.random) {
        // 我们进行将数组洗牌后传给list保存
        list = shuffle(this.sequenceList)
      } else {
        // 我们就把顺序列表传给list保存
        list = this.sequenceList
      }
      // 无论是乱序还是正序我们都得使用this.resetCurrentIndex(list)找到相对应的currentIndex,设置对应的currentIndex
      // 确保播放列表playList和 currentIndex 最终和表现是一致的
      // 我们修改了当前的播放列表playList,但是我们当前的CurrentSong播放歌曲是由playList决定的
      // 所以我们也要对其做修改,因为我们切换模式的时候,我们的currentSong中的currentIndex不发生改变啊~,所以我们得找到在洗牌后的数组
      // 洗牌后的数组中的的CurrentSong的Index,重新设置给CurrentIndex
      this.resetCurrentIndex(list)
      // 将洗牌过后的数组给到vuex的state中playList保存
      this.setPlayList(list)
    },
    // 因为洗牌后的的数组中的index对不上了,所以我们得找到洗牌过后的数组和正在播放的歌曲对应的索引值,重新在state中设置
    resetCurrentIndex(list) {
      // list.findIndex((item) 的意思是找到符合函数中要求的索引值,
      // 函数是找到当前播放的音乐id和洗牌后的数组的id匹配的话返回的索引,就找到重组过后当前播放歌曲的索引了
      let index = list.findIndex((item) => {
        return item.id === this.currentSong.id
      })
      this.setCurrentIndex(index)
    },
    // 喜欢歌曲模块的mixins
    // 我们怎么判断这首歌是不是喜欢歌曲?必须和我们的vuex中喜欢列表进行寻找,找得到说明是喜欢的,找不到说明是不喜欢的,
    // 具体逻辑我们用一个函数去做
    getFavoriteIcon(song) {
      if (this.isFavorite(song)) {
        return 'icon-favorite'
      } else {
        return 'icon-not-favorite'
      }
    },
    toggleFavorite(song) {
      if (this.isFavorite(song)) {
        this.deleteFavoriteList(song)
      } else {
        this.saveFavoriteList(song)
      }
    },
    isFavorite(song) {
      let index = this.favoriteList.findIndex((item) => {
        return item.id === song.id
      })
      // 找得到返回就是> -1 的值 所以是true, 否则为false
      return index > -1
    },
    ...mapMutations({
      setFullScreen: 'SET_FULL_SCREEN',
      setPlayingState: 'SET_PLAYING_STATE',
      setCurrentIndex: 'SET_CURRENT_INDEX',
      setPlayMode: 'SET_PLAY_MODE',
      setPlayList: 'SET_PLAYLIST'
    }),
    ...mapActions([
      'deleteFavoriteList',
      'saveFavoriteList'
    ])
  }
}

export const searchMixin = {
  data() {
    return {
      query: '',
      refreshDelay: 100
    }
  },
  computed: {
    ...mapGetters([
      'searchHistory'
    ])
  },
  methods: {
    // 点击父组件得到的item,怎么传给子组件中search-box中呢?能不能设置一个变量,再传进去呢?父传子就好了啊,好麻烦,还会重名,父得设置data, 子得设置props,还重名,不推荐
    // 我们给search-box添一个方法接口,setQuery, setQuery(query){ this.query = query }
    addQuery(query, index) {
      this.$refs.searchBox.setQuery(query)
    },
    // 子组件的query一旦发生改变,触发onQueryChange,再次赋予新的值,再把这个值传给suggest.vue数据请求
    onQueryChange(newQuery) {
      this.query = newQuery
    },
    // input框失去焦点
    // 调用的是searchBox的blur的方法,searchBox中的blur方法中还有方法
    blurInput() {
      this.$refs.searchBox.blur()
    },
    // 把我们当前的搜索框的query放进去
    saveSearch() {
      this.saveSearchHistory(this.query)
    },
    ...mapActions([
      'saveSearchHistory',
      'deleteSearchHistory'
    ])
  }
}
