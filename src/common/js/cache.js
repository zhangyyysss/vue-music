import storage from 'good-storage'

// 设置关键词SEARCH_KEY
const SEARCH_KEY = '__search__'
// 设置数组最大长度15
const SEARCH_MAX_LENGTH = 15

// 设置关键词PLAY_KEY
const PLAY_KEY = '__play__'
// 设置播放历史最大长度为200
const PLAY_MAX_LENGTH = 200

// 设置喜欢 FAVORITE_KEY
const FAVORITE_KEY = '__favorite__'
// 设置喜欢列表的最大长度为200
const FAVORITE_MAX_LENGTH = 200

// 搜索记录模块

// vuex 和 localStorage 历史记录的插入逻辑
function insertArray(arr, val, compare, maxLen) {
  // 返回新的val在数组中的索引值
  let index = arr.findIndex(compare)
  // 如果索引是第一个,那么就不需要改变了,默认就是第一,不做操作
  if (index === 0) {
    return
  }
  // 如果是索引大于0,那么删除这个索引对应的值,并且数组开头加上这个值
  if (index > 0) {
    arr.splice(index, 1)
  }
  arr.unshift(val)
  // 如果maxLen存在,并且数组长度大于maxLen,那么就是超过了最大值,我们把最后的去除掉,数组.pop()
  if (maxLen && arr.length > maxLen) {
    arr.pop()
  }
}

// vuex 和 localStorage 历史记录的删除逻辑 定义一个从数组中删除元素的函数
function deleteOneArray(arr, compare) {
  const index = arr.findIndex(compare)
  if (index > -1) {
    arr.splice(index, 1)
  }
}

// 保存数据到localStorage 并且返回一个数组列表,给actions中savaHistory使用
export function saveSearch(query) {
  // 先得到当前storages当前列表的存储空间的情况,注意这里[]不是空数组哦~~~~~~~~why?
  let searches = storage.get(SEARCH_KEY, [])
  // 往searches 中 插入query
  insertArray(searches, query, (item) => {
    return item === query
  }, SEARCH_MAX_LENGTH)
  // 存入storage中
  storage.set(SEARCH_KEY, searches)
  // 返回新的searches
  return searches
}

// 获取本地localStorage中的搜索历史记录数据值返回给state中作为默认值
export function loadSearch() {
  return storage.get(SEARCH_KEY, [])
}

// 删除localStorage中的历史记录
export function deleteSearch(query) {
  let searches = storage.get(SEARCH_KEY, [])
  deleteOneArray(searches, (item) => {
    return item === query
  })
  // 存入本地storage中
  storage.set(SEARCH_KEY, searches)
  // 返回新的searches
  return searches
}

// 清空搜索结果的vuex,和localStorage缓存的所有历史记录
// 使用storage.remove('SEARCH_KEY')
export function clearSearch() {
  // 本地清除所有搜索记录
  storage.remove(SEARCH_KEY)
  // 返回一个空数组
  return []
}

// 最近播放列表模块

export function savePlay(song) {
  // 从本地localStorage中获取最近播放数据,注意这里[]不是空数组哦~~~~~~~~why?
  let songs = storage.get(PLAY_KEY, [])
  // 将播放歌曲插入songs数组中,且遵循我们插入规则
  insertArray(songs, song, (item) => {
    return item.id === song.id
  }, PLAY_MAX_LENGTH)
  // 将插入数据的songs保存到到本地localStorage
  storage.set(PLAY_KEY, songs)
  // 将songs数组返回
  return songs
}

// 获取本地localStorage中的最近播放记录数据值返回给state中作为默认值
export function loadPlay() {
  return storage.get(PLAY_KEY, [])
}

// 喜欢列表模块

export function saveFavorite(song) {
  // 从本地localStorage获取喜欢列表
  let songs = storage.get(FAVORITE_KEY, [])
  insertArray(songs, song, (item) => {
    return song.id === item.id
  }, FAVORITE_MAX_LENGTH)
  storage.set(FAVORITE_KEY, songs)
  return songs
}

// 删除喜欢
export function deleteFavorite(song) {
  let songs = storage.get(FAVORITE_KEY, [])
  deleteOneArray(songs, (item) => {
    return song.id === item.id
  })
  storage.set(FAVORITE_KEY, songs)
  return songs
}

// 获取本地localStorage中的喜欢数据值返回给state中作为默认值
export function loadFavorite() {
  return storage.get(FAVORITE_KEY, [])
}
