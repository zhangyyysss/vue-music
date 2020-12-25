import * as types from './mutations-types'
import {playMode} from 'common/js/config'
import {shuffle} from 'common/js/utils'
import {saveSearch, deleteSearch, clearSearch, savePlay, saveFavorite, deleteFavorite} from 'common/js/cache'

// 选择播放
export const selectPlay = function ({commit, state}, {list, index}) {
  commit(types.SET_SEQUENCE_LIST, list)
  // 如果说我是随机模式,我去到别人歌手页面,点击了一首歌曲,
  // 如果是随机模式下点击歌曲列表其中一首歌曲,那么我们都给shuffle一下然后再设置SET_PLAYLIST
  if (state.mode === playMode.random) {
    let randomList = shuffle(list)
    // 当是随机播放模式进来的
    commit(types.SET_PLAYLIST, randomList)
    // 为什么需要重置index?
    // 因为CurrentSong 是由 playList和 currentIndex决定的,
    // 所以 如果没有重置,那么列表中playList是随机的顺序 , currentIndex是点击的index,
    // 这有两个对应的上才是准确的歌曲,我们找到点击的乱序中的list[index]对应的歌曲的id和当前播放的歌曲id筛选,返回的是一个乱序数组中对应正在播放歌曲的id
    // 将index重置(让乱序后的数组列表和正在播放的歌曲对应上,从而重置index)
    index = findIndex(randomList, list[index])
  } else {
    commit(types.SET_PLAYLIST, list)
  }
  // 因为上面对index进行重置,即使这里是乱序,也能找到对应的乱序后playlist和乱序后对应的currentIndex,找到对应的currentSong
  commit(types.SET_CURRENT_INDEX, index)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}

// 随机播放模式
export const randomPlay = function ({commit}, {list}) {
  commit(types.SET_PLAY_MODE, playMode.random)
  commit(types.SET_SEQUENCE_LIST, list)
  // 产生随机列表
  let randomlist = shuffle(list)
  commit(types.SET_PLAYLIST, randomlist)
  commit(types.SET_CURRENT_INDEX, 0)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}

function findIndex(list, song) {
  return list.findIndex((item) => {
    return item.id === song.id
  })
}

// 搜索结果中点击歌曲(列表中加入歌曲)
export const insertSong = function ({commit, state}, song) {
  // 通过.slice()产生列表的副本，使playlist和sequenceList的操作不会直接修改store中的state；而数值类型的currentIndex没关系
  let playList = state.playList.slice()
  let sequenceList = state.sequenceList.slice()
  // 值类型,在栈中,赋值过去只是值,不是引用啊,所以不会有引用牵挂
  let currentIndex = state.currentIndex
  // 记录当前歌曲
  let currentSong = playList[currentIndex]
  // 在播放列表中查找点击的歌曲并返回其索引
  let fpIndex = findIndex(playList, song)
  // 因为是插入歌曲,所以索引统统+1
  if (currentIndex === 0) {
    currentIndex = 0
  } else {
    currentIndex++
  }
  // 插入这首歌曲到当前索引的下一位
  playList.splice(currentIndex, 0, song)
  // 如果列表之前就已经包含这首歌曲了
  if (fpIndex > -1) {
    // 如果插入的歌曲索引大于列表中原歌曲的索引
    if (currentIndex > fpIndex) {
      playList.splice(fpIndex, 1)
      currentIndex--
    } else {
      // 如果当前插入的索引小于列表中原歌曲的索引
      playList.splice(fpIndex + 1, 1)
    }
  }

  // 同理,顺序列表也是这样操作(为什么需要修改顺序列表,因为你新增了一首歌曲在playList中,那么顺序列表也要增加一首新的歌曲)
  // 获得歌曲在顺序列表要插入的位置  记得+1,因为在当前播放歌曲的下一位
  let currentSIndex = findIndex(sequenceList, currentSong) + 1
  let fsIndex = findIndex(sequenceList, song)
  // 插入这个歌曲
  sequenceList.splice(currentIndex, 0, song)
  // 如果顺序列表之前就包含这首歌曲了
  if (fsIndex > -1) {
    // 如果插入歌曲的位置索引大于列表中原歌曲的索引
    if (currentSIndex > fsIndex) {
      sequenceList.splice(fsIndex, 1)
      // 这里为什么不需要操作currentSIndex呢?(currentIndex呢?)
      // 因为currentIndex上面只是用来计算插入的位置 (sequenceList.splice(currentIndex, 0, song)),
      // 我们之后的state里面不会包含sequenceList中当前的索引的
      // 这个currentIndex实际上是playList的当前索引,我们这里之所以需要这个索引,是为了计算当前播放的歌曲CurrentSong
      // 所以我们这个currentSIndex只是一个临时变量我们用来算插入的位置
    } else {
      sequenceList.splice(fsIndex + 1, 1)
    }
  }

  commit(types.SET_PLAYLIST, playList)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)
  commit(types.SET_FULL_SCREEN, true)
  commit(types.SET_PLAYING_STATE, true)
}

// 删除播放列表中一首歌曲
export const deleteSong = function ({commit, state}, song) {
  // 通过.slice()产生列表的副本，使playlist和sequenceList的操作不会直接修改store中的state；而数值类型的currentIndex没关系
  let playList = state.playList.slice()
  let sequenceList = state.sequenceList.slice()
  // 值类型,在栈中,赋值过去只是值,不是引用啊,所以不会有引用牵挂
  let currentIndex = state.currentIndex
  // 找到对应的索引歌曲并且删除该歌曲
  let PIndex = findIndex(playList, song)
  playList.splice(PIndex, 1)
  let SIndex = findIndex(sequenceList, song)
  sequenceList.splice(SIndex, 1)
  // 情况1.如果说当前播放歌曲索引 小于 要删除的在播放列表中的歌曲的索引 [..播放歌曲.....要删除的歌曲...]  那就无影响,因为currentIndex不会收到影响,不操作
  // 情况2.如果说当前播放的歌曲索引 大于 要删除的在播放列表中的歌曲的索引 [...要删除的歌曲....播放歌曲...]
  // 还有播放歌曲的索引 等于 playlist数组的的长度, 我们也要--,为什么呢?
  // 如果说我们删除了最后一首歌曲,那么currentIndex 就不会等于Pindex,就不会执行currentIndex--
  if (currentIndex > PIndex) {
    currentIndex--
  }
  // 如果正在播放歌曲的是playList最后一首歌曲,那么播放第一首歌曲
  if (currentIndex === playList.length) {
    currentIndex = 0
  }

  commit(types.SET_PLAYLIST, playList)
  commit(types.SET_SEQUENCE_LIST, sequenceList)
  commit(types.SET_CURRENT_INDEX, currentIndex)

  // 如果我们删光了列表,我们播放状态设置为false
  if (!playList.length) {
    commit(types.SET_PLAYING_STATE, false)
  }
}

// 清空歌单列表
export const deleteSongList = function ({commit}) {
  commit(types.SET_PLAYLIST, [])
  commit(types.SET_SEQUENCE_LIST, [])
  commit(types.SET_CURRENT_INDEX, -1)
  commit(types.SET_PLAYING_STATE, false)
}

// 将历史记录存储到vuex中和本地localStorage中
export const saveSearchHistory = function({commit}, query) {
  // saveSearch 做了两件事情,1.将query写进了localStorage,2.返回一个存储过localStorage的一个数组(列表)
  // 我们再commit进去types.SET_SEARCH_HISTORY,这样就可以了
  commit(types.SET_SEARCH_HISTORY, saveSearch(query))
}

// 删除vuex中的历史记录和本地localStorage记录
export const deleteSearchHistory = function({commit}, query) {
  commit(types.SET_SEARCH_HISTORY, deleteSearch(query))
}

// 清空所有vuex中的历史记录和本地localStorage记录
export const clearSearchHistory = function ({commit}) {
  commit(types.SET_SEARCH_HISTORY, clearSearch())
}

// 每一次有歌曲播放就会储存起来
export const savePlayHistory = function ({commit}, song) {
  // savePlay返回一个数组,我们在把这个数组通过mutations设置进vuex中
  commit(types.SET_PLAY_HISTORY, savePlay(song))
}

// 传入的是song,因为我们都是单个操作
// 保存喜欢歌曲
export const saveFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, saveFavorite(song))
}

// 删除喜欢歌曲
export const deleteFavoriteList = function ({commit}, song) {
  commit(types.SET_FAVORITE_LIST, deleteFavorite(song))
}
