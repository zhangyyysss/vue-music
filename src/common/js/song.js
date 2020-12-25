import {getSongsUrl, getLyric} from 'api/song'
import {ERR_OK} from 'api/config'
import {Base64} from 'js-base64'

export default class Song {
  constructor({id, mid, singer, name, album, duration, image, url}) {
    this.id = id
    this.mid = mid
    this.singer = singer
    this.name = name
    this.album = album
    this.duration = duration
    this.image = image
    this.url = url
  }

  getLyric() {
    if (this.lyric) {
      return Promise.resolve(this.lyric)
    }
    return new Promise((resolve, reject) => {
      getLyric(this.mid).then(res => {
        if (res.retcode === ERR_OK) {
          this.lyric = Base64.decode(res.lyric)
          resolve(this.lyric)
        } else {
          reject(new Error('no lyric'))
        }
      })
    })
  }
}

// 使用工厂方法实例化
// musicData的数据是一样的(歌曲的数据都是一样的),所以我们可以用工厂方法来抽象使用
// musicData是一个对象
// singer 是一个数组,所以这里传入singer数组是为了处理后得到singer歌手的的值
export function createSong(musicData) {
  return new Song({
    id: musicData.songid,
    mid: musicData.songmid,
    singer: filterSinger(musicData.singer),
    name: musicData.songname,
    album: musicData.albumname,
    duration: musicData.interval,
    image: `https://y.gtimg.cn/music/photo_new/T002R300x300M000${musicData.albummid}.jpg?max_age=2592000`,
    url: musicData.url
  })
}

// 对singer的name做处理~~~最后返回一个带有'/'分割的数组
function filterSinger(singer) {
  let ret = []
  if (!singer) {
    return ''
  }
  singer.forEach((s) => {
    ret.push(s.name)
  })
  return ret.join('/')
}

// 付费歌曲过滤判断
export function isValidMusic (musicData) {
  // 解释1.如果没有songid 或者 albummid的话就是false,进不去, 后面判断是是否为过费歌曲,或者该歌曲是不是付费价格如果等于0返回true
  return musicData.songid && musicData.albummid && (!musicData.pay || musicData.pay.payalbumprice === 0)
}

//  对歌曲列表做处理
//  通过 getSongsUrl 这个方法可以批量拿到这个歌曲列表的 midUrlInfo，接着遍历它就可以为每首歌获取 url 了

export function processSongsUrl(songs) {
  // 如果songs是一个空数组,直接返回这个空数组?为什么要这样判断,防止传进来的是空,然后一堆操作是错误的操作,我们在前面就截断了
  if (!songs.length) {
    return Promise.resolve(songs)
  }
  return getSongsUrl(songs).then((purlMap) => {
    // 给songs中的每一个song添加一个设置一个url,purl 就是url 例子:'http://aqqmusic.tc.qq.com/amobile.music.tc.qq.com/C4000013WPvt4fQH2b.m4a?guid=3199284457&vkey=C1E6FF82461BE87339940206F4BB83084B648DBC24C46ABB8F754AA99E7BE14FEEA8C1084A51DD73A009A9A4D5C179D577643F323AA24E9E&uin=0&fromtag=38'
    songs = songs.filter((song) => {
      const purl = purlMap[song.mid]
      if (purl) {
        // 如果purl有http,那么直接返回purl,所以就是例子:'http://aqqmusic.tc.qq.com/amobile.music.tc.qq.com/C4000013WPvt4fQH2b.m4a?guid=3199284457&vkey=C1E6FF82461BE87339940206F4BB83084B648DBC24C46ABB8F754AA99E7BE14FEEA8C1084A51DD73A009A9A4D5C179D577643F323AA24E9E&uin=0&fromtag=38'
        song.url = purl.indexOf('http') === -1 ? `http://dl.stream.qqmusic.qq.com/${purl}` : purl
        return true
      }
      return false
    })
    // 处理完数组songs对象,我们return
    return songs
  })
}
