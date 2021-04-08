<template>
  <div class="singer" ref="singer">
    <list-view :data="singers" @select="selectSinger" ref="listView"></list-view>
    <router-view></router-view>
  </div>
</template>

<script>
  import {getSingerList} from 'api/singer'
  import {ERR_OK} from 'api/config'
  import {Singer} from 'common/js/singer'
  import ListView from 'components/common/listview/ListView.vue'
  // 我们可以在methods最后,使用扩展运算符的方式,对象映射
  import {mapMutations} from 'vuex'
  import {playlistMixin} from 'common/js/mixin'

  const HOT_NAME = '热门'
  const HOT_SINGER_LEN = 10

  export default {
    mixins: [playlistMixin],
    name: 'Singer',
    components: {
      ListView
    },
    data() {
      return {
        singers: []
      }
    },
    created() {
      this._getSingerList()
    },
    methods: {
      // mixins混入解决底部被遮挡的问题
      handlePlaylist() {
        const bottom = this.playList.length ? '60px' : ''
        this.$refs.singer.style.bottom = bottom
        this.$refs.listView.refresh()
      },
      // 路由跳转到相应个歌手页面,并把相对应的singer设置到state保存起来
      selectSinger(singer) {
        this.$router.push({
          path: `/singer/${singer.id}`
        })
        this.setSinger(singer)
      },
      _getSingerList() {
        getSingerList().then((res) => {
          if (res.code === ERR_OK) {
            this.singers = this._normalizeSinger(res.data.list)
          }
        })
      },
      _normalizeSinger(list) {
        // 建立一个map对象存储我们的数据结构
        let map = {
          // 设置hot对象里面标题为"热门",并且有items数组
          hot: {
            title: HOT_NAME,
            items: []
          }
        }
        // 我们遍历我们请求得到的数组,整理我们想要的数据
        list.forEach((item, index) => {
          // 把前10条数据push进热门里面
          if (index < HOT_SINGER_LEN) {
            // 我们设置了一个对象化的新类,帮我们节省重复的代码,类里面记得需要解构,new Singer({记得写详细点:id: item.Fsinger_mid})
            map.hot.items.push(new Singer({
              id: item.Fsinger_mid,
              name: item.Fsinger_name
            }))
          }
          // 我们把item.Findex给到一个key保存
          const key = item.Findex
          // 如果map对象没有属性key,那么我们以这个key属性新建一个对象,以title = key ,设置,为了得到a-z
          // 也让首字母相同的歌手归类
          if (!map[key]) {
            map[key] = {
              title: key,
              items: []
            }
          }
          // 各自的key中的items推入我们的各自的歌手(热门已经跑到热门,A跑到A,B跑到B......,但是还不是有序列表)
          map[key].items.push(new Singer({
            id: item.Fsinger_mid,
            name: item.Fsinger_name
          }))
        })
        // 为了得到有序列表,我们 需要处理map
        let hot = []
        let ret = []
        // 遍历map
        for (let key in map) {
          // val是一个每一个对象 val对象: { title: a, items: [啊栏,啊一] }.... { title: b, item: [ 宝哥, 豹哥 ] }
          // match() 方法可在字符串内检索指定的值，或找到一个或多个正则表达式的匹配。
          // 该方法类似 indexOf() 和 lastIndexOf()，但是它返回指定的值，而不是字符串的位置。
          let val = map[key]
          // 返回匹配的所有a-z或者A-Z的val对象然后push进ret数组中(未必是顺序排列)
          if (val.title.match(/[a-zA-Z]/)) {
            ret.push(val)
          } else if (val.title === HOT_NAME) {
            hot.push(val)
          }
        }
        // 我们使用ret中的全是英文字母分类的val对象进行排序,使用里面的title(就是英文字母a-z,A-Z)的charCodeAt(0) 的值进行排序
        ret.sort((a, b) => {
          return a.title.charCodeAt(0) - b.title.charCodeAt(0)
        })
        // hot.concat(ret) ,所以是热门数组在前面,其他英文字母按顺序排列的数组在后面
        return hot.concat(ret)
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      })
    }
  }
</script>

<style scoped lang="stylus">
  .singer
    position fixed
    top 88px
    bottom 0
    width 100%
</style>
