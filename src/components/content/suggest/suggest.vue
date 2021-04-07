<template>
  <scroll
    class="suggest"
    :data="result"
    :pullup="pullup"
    @scrollToEnd="searchMore"
    ref="suggest"
    :beforeScroll="beforeScroll"
    @beforeScroll="listScroll"
    @beforeFlick="listflick">
    <ul class="suggest-list">
      <li class="suggest-item" @click="selectItem(item)" v-for="(item, index) in result" :key="index">
        <div class="icon">
          <i :class="getIconCls(item)"></i>
        </div>
        <div class="name">
          <p class="text" v-html="getDisplayName(item)"></p>
        </div>
      </li>
      <loading v-show="hasMore" title=""></loading>
    </ul>
    <div class="no-result-wrapper" v-show="!hasMore && !result.length">
      <!--   传入常量,不需要加:   -->
      <no-result title="抱歉，暂无搜索结果"></no-result>
    </div>
  </scroll>
</template>

<script>
  import {search} from 'api/search'
  import {ERR_OK} from 'api/config'
  import {createSong, isValidMusic, processSongsUrl} from 'common/js/song'
  import Scroll from 'components/common/scroll/Scroll'
  import Loading from 'components/common/loading/Loading'
  import NoResult from 'components/common/no-result/no-result'
  import {Singer} from 'common/js/singer'
  import {mapMutations, mapActions} from 'vuex'

  const perpage = 20
  const TYPE_SINGER = 'singer'

  export default {
    name: 'suggest',
    components: {
      Scroll,
      Loading,
      NoResult
    },
    props: {
      // 接收传入的query,不同的querykey调用服务器接口不同的数据,每打一个词就会检索
      // 因为下面watch了query调用search
      query: {
        type: String,
        default: ''
      },
      // 控制展示不展示歌手
      showSinger: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        // page 保存页面数
        page: 1,
        // result 保存我们的歌曲和歌手歌曲数据
        result: [],
        // 上拉加载更多
        pullup: true,
        // 标识符判断数据是否全部加载完毕(数据库还有没有数据了)
        hasMore: true,
        // 设置滚动前设置为true,开启beforeScrollStart事件
        beforeScroll: true,
        // 网速过慢,我们设置一个标识符,判断请求是否完成,完成才能触发下一次请求(防止重复请求)
        isRepeat: true
      }
    },
    // 这个数据和父组件的关系不大,和其他耦合度不大的请求,可以在子组件中完成传递
    methods: {
      // 什么时候使用methods,什么时候时候使用computed
      // 需要传入值得时候是用methods,而且需要传入值做复杂判断值,
      // 不需要传入值,根据data中的数据做判断 例如: return this.songReady ? '' : 'disable'
      // computed是计算属性,是计算一个常量,我们常用watch来监视这个常量的变化
      // percent() {
      // return this.currentTime / this.currentSong.duration
      // }
      // 根据item的type的类型返回不同的icon
      getIconCls(item) {
        if (item.type === TYPE_SINGER) {
          return 'icon-mine'
        } else {
          return 'icon-music'
        }
      },
      // 根据item的type的类型返回不同的歌手名字/歌曲名字-歌手名字
      getDisplayName(item) {
        if (item.type === TYPE_SINGER) {
          return item.singername
        } else {
          // 处理完毕以后,那么我们的Song类遍历下的item.name和item.singer就可以获得歌手名字
          return `${item.name} - ${item.singer}`
        }
      },
      search() {
        this.hasMore = true
        this.page = 1
        this.$refs.suggest.scrollTo(0, 0)
        // 传入输入的query,控制keyWord,传入 this.page控制页面,传入this.showSinger控制展不展示歌手,传入定量perpage控制获取多少首歌曲
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          // 第一次查询也要将请求锁解开
          this.isRepeat = false
          this.hasMore = true
          if (res.code === ERR_OK) {
            // console.log(res.data)
            this._genResult(res.data).then((result) => {
              // this.result = this.result.concat(result)
              this.result = result
              // console.log(this.result)
              setTimeout(() => {
                this._checkMore(res.data)
              }, 20)
            })
          }
        })
      },
      // 上拉加载更多
      searchMore() {
        if (!this.hasMore) {
          return false
        }
        // 加入一个请求锁,防止用户多次点击,等待数据返回后打开锁
        if (this.isRepeat) return false
        this.isRepeat = true
        this.page++
        search(this.query, this.page, this.showSinger, perpage).then((res) => {
          if (res.code === ERR_OK) {
            // 将新的数据拼接到之前的this.result之后
            this._genResult(res.data).then((result) => {
              // 将请求锁解开
              this.isRepeat = false
              // this.result = this.result.concat(result)
              // 测试push行不行哦~行是行,解构之后push进去,但是呢?中间有一个歌手的类,为什么?
              // this.result.push(...result)
              this.result = this.result.concat(result)
              setTimeout(() => {
                this._checkMore(res.data)
              }, 20)
              console.log(this.result)
            })
          }
        })
      },
      _checkMore(data) {
        const song = data.song
        // 什么时候hasMore变false,当歌曲列表没有长度或者 当前已经加载歌曲数量 + 当前歌曲页数 * 每一页歌曲数量 大于 总歌曲数量
        // 假设totalnum为30条内容,那么是什么样的结果呢? song.curnum当前歌曲数量?是20吗? 当前歌曲页数是1吗?每一页歌曲数量20 那就40,满足,那就不加载
        // 剩余的10条吗?不合理啊,待会测试一测试(因为是先加载进去,再去判断还有没有更多,所以这10条被添加进数组了,判断30 >= 30 ,所以没有更多的歌曲了,设置hasMore为false)
        if (!song.list.length || (song.curnum + (song.curpage - 1) * perpage) >= song.totalnum) {
          this.hasMore = false
        }
      },
      // 对服务器请求回的数据进行处理(一般都是在normalize中处理,但是这个分为两个类型,所以我们另外使用一个函数来对歌手和歌曲分开处理,最后拼接起来)
      _genResult(data) {
        let ret = []
        // 先把歌手放前面push是因为我们也准备把歌手放前面~~~~秒
        if (data.zhida && data.zhida.singerid && this.page === 1) {
          // 如果是歌手的数据, 检测data中是否有zhida,zhida是否有singerid,this.page === 1 只有满足第一页我们才把这个歌手push进数组
          // 我们只需要一个这个歌手在首页第一行啊啊,如果都可以.下面每一次请求数据,都会得到一个歌手数据在第一行
          // 扩展运算符,外面有一个大的{},说明里面怎么扩展运算符,都在这个对象内,最后也是把这个对象push进ret中
          // 其次,我们把...data.zhida的对象展开了,后面的type是为了我们展示图标的不同设置的标识符,相当于歌手对象中我们有type: 'singer'这个键值对
          // 注意: 都是键值对哦,所以说解构键值对就用这种方法 所以...data.zhida ...{type: TYPE_SINGER}
          // 这种写法叫做扩展运算符，会将一个数组或者对象转为用逗号分隔的参数序列。所以需要一个{}包裹着啊
          // ret.push(...data.zhida) 是错误的,因为只是一段用逗号分隔开的参数序列,游离,打印不出来,只有ret.push({..data.zhida})
          // 其实ret.push({...data.zhida, type: TYPE_SINGER}) 也行啊,想当一个参数序列最后一个而已,会覆盖掉前面的type: 0
          ret.push({...data.zhida, ...{type: TYPE_SINGER}})
        }
        if (data.song) {
          // 如果是数据歌曲数据,我们这里为什么不解构push?
          // 主要是我们的数据结构是想做成一个数组[{歌手数据},{歌曲1},{歌曲2},{歌曲3},{歌曲4}],
          // 如果是ret.push({...data.song.list}) 那么解构后都放在一个对象里面了,其实一开始data.song.list就是一个数组啊[{},{},{}],我们直接拼接就行了
          // 对象拼接返回给ret完事了
          // ret = ret.concat(data.song.list)
          // ret = ret.concat(this._normalizeSongs(data.song.list))
          // 如果是Song歌曲的话,
          // 1.我们使用_normalize(传入的未处理的song数组做付费处理过滤)
          // 2.我们通过return processSongsUrl对处理的song数组的url处理
          // 3.在return processSongsUrl的then中进行处理后的Song类拼接到ret数组中
          // 4.返回这个数组ret
          return processSongsUrl(this._normalizeSongs(data.song.list)).then((songs) => {
            ret = ret.concat(songs)
            return ret
          })
        }
      },
      // 对数据做付费过滤和使用工厂模式创建Song类
      _normalizeSongs(list) {
        let ret = []
        list.forEach((musicData) => {
          if (isValidMusic(musicData)) {
            ret.push(createSong(musicData))
          }
        })
        return ret
      },
      // 又把时间派发出去,实际上关心input失去焦点只是search这个组件
      listScroll() {
        this.$emit('listScroll')
      },
      // scroll轻浮时候触发
      listflick() {
        this.$emit('listflick')
        console.log('flick')
      },
      // 当作为子组件形式的时候,一定需要做一层scroll的代理refresh()
      refresh() {
        this.$refs.suggest.refresh()
      },
      selectItem(item) {
        // 如果是歌手页面,那么路由跳转和mutations设置singer
        if (item.type === TYPE_SINGER) {
          const singer = new Singer({
            id: item.singermid,
            name: item.singername
          })
          this.$router.push({
            path: `/search/${singer.id}`
          })
          this.setSinger(singer)
        } else {
          // 如果只是歌曲,那么我们就插入一首歌曲到当前播放列表
          this.insertSong(item)
        }
        // 派发出select事件,具体逻辑外部处理,基础组件不关心
        this.$emit('select')
      },
      ...mapMutations({
        setSinger: 'SET_SINGER'
      }),
      ...mapActions([
        'insertSong'
      ])
    },
    watch: {
      // query一变化就search()调取数据
      query() {
        this.search()
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  .suggest
    // 由于父元素.suggest-wrapper中fixed布局,定死了宽高,所以height 100%就是可视区下半区域,不会超出范围,到时候也可以滚动
    // 超出部分隐藏
    height 100%
    overflow hidden
    .suggest-list
      // ul 一般都控制padding,控制左右距离
      padding 0 30px
      .suggest-item
        // li 我们使用flex布局 ,垂直居中,每一个li有一个padding-bottom
        display flex
        align-items center
        padding-bottom 20px
        // div 我们设置固定的 flex 0 0 30px width 30px 相当于容器
        // i icon-开头的我们设置字体颜色和大小
        .icon
          flex 0 0 30px
          width 30px
          [class^="icon-"]
            font-size 14px
            color $color-text-d
        // div 容器 剩下的部分都吃掉了剩下flex布局 flex 1
        // 设置字体大小颜色,超出隐藏,
        .name
          flex 1
          font-size $font-size-medium
          color $color-text-d
          overflow hidden
          // p 文本不换行
          .text
            no-wrap()
    // no-result的容器,绝对定位,垂直居中,水平由子内容的text-align和 margin: 0 auto决定了
    .no-result-wrapper
      position: absolute
      width: 100%
      top: 50%
      transform: translateY(-50%)
</style>
