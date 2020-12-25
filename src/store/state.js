import {playMode} from 'common/js/config.js'
import {loadSearch, loadPlay, loadFavorite} from 'common/js/cache'

const state = {
  singer: {},
  playing: false,
  fullScreen: false,
  playList: [],
  sequenceList: [],
  mode: playMode.sequence,
  currentIndex: -1,
  // 推荐模块,跟歌手一样的性质
  disc: {},
  // 排行模块,跟歌手一样的性质
  topList: {},
  // 搜索历史,将每一次都会重新localStorage的默认值返回给searchHistory作为默认值
  searchHistory: loadSearch(),
  // 播放历史
  playHistory: loadPlay(),
  // 喜欢歌曲
  favoriteList: loadFavorite()
}

export default state
