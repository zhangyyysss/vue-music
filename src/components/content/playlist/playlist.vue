<template>
  <transition name="list-fade">
    <!--  点击蒙层也会hide隐藏  -->
    <div class="playlist" v-show="showFlag" @click.stop="hide">
      <div class="list-wrapper" @click.stop>
        <div class="list-header">
          <h1 class="title">
            <!--     想法:点击文字也可以切换模式, 可以给一个div包裹着,div监控事件,这里布局需要更改,也可以两个都添加上这个事件也可以,样式不需要改变   -->
            <i class="icon" :class="iconMode" @click="changeMode()"></i>
            <span class="text" @click="changeMode()">{{modeText}}</span>
            <span class="clear" @click="showConfirm">
              <i class="icon-clear"></i>
            </span>
          </h1>
        </div>
        <scroll class="list-content" :data="sequenceList" ref="listContent" :refreshDelay="200">
          <!--     对列表使用动画,我们使用transition-group,name是动画名字,tag是最后渲染成一个什么标签,默认是span标签
                      它的子元素需要一个唯一的:key   ,可以是用item.id来区分,我们试试index可以不
                      index 不行啊,只能使用item.id这样才有动画的效果-->
          <transition-group name="list" tag="ul">
            <!-- 为什么使用sequenceList来遍历?不是使用playList遍历? 因为逻辑就是顺序列表,网易云就是这样-->
            <li
              class="item"
              v-for="(item, index) in sequenceList"
              :key="item.id"
              @click="selectItem(item, index)"
              ref="listItem"
            >
              <i class="current" :class="getCurrentIcon(item)"></i>
              <span class="text">{{item.name}}</span>
              <!--  这里有很多难点,1.我们是给i还是span哪个标签添加喜欢事件或者喜欢样式?为什么? player是对i标签使用的,这里为什么对span呢?
                 首先这里是span是包裹着i标签,为了更好的用户体验,span有一个样式是extend-click() 这个的样式是relative,
                 且它的content: '' before伪类top left bottom bottom 都为-10px,增大了点击区域,所以体验好一点~~~~~
                 里面的标签控制颜色,满满都是细节~~~~~~~~~~
                 -->
              <span class="like" @click.stop="toggleFavorite(item)">
                <i :class="getFavoriteIcon(item)"></i>
              </span>
              <span class="delete" @click.stop="deleteOne(item)">
                <i class="icon-delete"></i>
              </span>
            </li>
          </transition-group>
        </scroll>
        <div class="list-operate">
          <div class="add">
            <i class="icon-add"></i>
            <span class="text" @click="showAddSong">添加歌曲到队列</span>
          </div>
        </div>
        <div class="list-close" @click="hide">
          <span>关闭</span>
        </div>
      </div>
      <confirm
        ref="confirm"
        text="是否清空播放列表"
        confirmBtnText="清空"
        cancelBtnText="取消"
        @confirm="confirmClear"
      ></confirm>
      <add-song ref="addSong" @back="hide"></add-song>
    </div>
  </transition>
</template>

<script>
  import {mapGetters, mapMutations, mapActions} from 'vuex'
  import Scroll from 'components/common/scroll/Scroll'
  import Confirm from 'components/common/confirm/confirm'
  import AddSong from 'components/content/add-song/add-song'
  import {playMode} from 'common/js/config'
  import {playerMixin} from 'common/js/mixin'

  export default {
    mixins: [playerMixin],
    name: 'playlist',
    components: {
      Scroll,
      Confirm,
      AddSong
    },
    computed: {
      modeText() {
        return this.mode === playMode.random ? '随机播放' : this.mode === playMode.sequence ? '顺序播放' : '单曲循环'
      },
      // 其实在mixins 中定义了,就可以删掉了,但是我为了逻辑更加清晰,所以我们继续保留这些数据吧
      ...mapGetters([
        'sequenceList',
        'currentSong',
        'playList',
        'mode'
      ])
    },
    data() {
      return {
        showFlag: false
      }
    },
    methods: {
      // 控制playlist显示 ,setTimeout(()=>{},20)为了保证dom渲染完毕后刷新,display: none --> 显示都需要这样做
      show() {
        this.showFlag = true
        setTimeout(() => {
          this.$refs.listContent.refresh()
          // 确保scroll组件可以正常使用之后我们偏移到正在播放的歌曲
          this.scrollToCurrent(this.currentSong)
        }, 20)
      },
      // 控制playlist 隐藏
      hide() {
        this.showFlag = false
      },
      // 设置当前播放歌曲前面有一个图标
      // 其实就是设置i标签的class,我们样式里面早就定义好了
      getCurrentIcon(item) {
        return this.currentSong.id === item.id ? 'icon-play' : ''
      },
      // 点击列表中的歌曲
      // 其实能不能把this.song也给过来,它也使用?会乱套吗?,应该用同一套播放列表~~~~~~比较合理
      selectItem(item, index) {
        //  因为默认展示是顺序列表,sequenceList
        // 因为我们的 currentSong 是由 playList 和 currentIndex 决定的
        //  所以我们如果是乱序的情况下,playList就会乱,具体看actions中的selectPlay
        if (this.mode === playMode.random) {
          index = this.playList.findIndex((song) => {
            return song.id === item.id
          })
        }
        this.setCurrentIndex(index)
      },
      // 滚到到当前播放的歌曲的位置
      // 其实想想我在哪个生命周期滚动呢?created?mounted?updated? 都不合适,我们又想它可以滚动到相应的位置?怎么办呢?
      // 其实换个思路,不从vue的生命周期触发,我们可以监控currentSong这个值,只要歌曲一变化,我们就可以滚动了对吧
      scrollToCurrent(current) {
        // 当前播放歌曲在sequenceList中的索引值
        const index = this.sequenceList.findIndex((song) => {
          return current.id === song.id
        })
        // 原来v-for遍历的li使用this.$refs.listItem[index],可以找到对应的索引啊!!!!!!!!
        this.$refs.listContent.scrollToElement(this.$refs.listItem[index - 2], 300)
      },
      // 删除歌单中的一首歌曲
      deleteOne(item) {
        this.deleteSong(item)
        // 如果是歌曲列表没有了,那么我们就隐藏起来
        if (!this.playList.length) {
          this.hide()
        }
      },
      // 垃圾桶按钮控制弹出这个confirm组件
      showConfirm() {
        this.$refs.confirm.show()
      },
      // confirm 确定派发出事件来处理清理内容的工作
      confirmClear() {
        this.deleteSongList()
        // 歌曲列表没有了,那么我们就隐藏起来(否则清空完歌曲列表,再点一首歌曲,playlist有了,player渲染,那么这个组件就会马上显示)
        this.hide()
      },
      showAddSong() {
        this.$refs.addSong.show()
      },
      // 其实是用了mixin就可以删除这里的了,因为重复了,但是我为了看的清晰逻辑就不删除了
      ...mapMutations({
        setCurrentIndex: 'SET_CURRENT_INDEX'
      }),
      ...mapActions([
        'deleteSong',
        'deleteSongList'
      ])
    },
    watch: {
      // Error in callback for watcher "currentSong": "TypeError: Cannot read property '3' of undefined"
      // TypeError: Cannot read property '3' of undefined
      // at VueComponent.scrollToCurrent (playlist.vue?8856:111)
      // at VueComponent.currentSong (playlist.vue?8856:128)
      // at Watcher.run (vue.runtime.esm.js?ff9b:4568)
      // at flushSchedulerQueue (vue.runtime.esm.js?ff9b:4310)
      // at Array.eval (vue.runtime.esm.js?ff9b:1980)
      // at flushCallbacks (vue.runtime.esm.js?ff9b:1906)
      // 如果没加下面的判断就会报这个错误,为什呢?
      // 因为如果说这个组件如果没有显示的状态下,那么scroll组件就
      // this.$refs.listContent.scrollToElement(this.$refs.listItem[index], 300) 执行到这句就会报错了,
      // 是因为display: none 根本就没显示,所有this.$refs.listItem[index]报错了吗?也是这个问题,所以我们在show()之后再移动
      // 是因为scroll组件没有初始化好吗? 对的,就是scroll组件没有做好
      // 为什么呢?
      // 因为如果当this.showFlag为false的时候,我们的dom结构是没有好的,只有当true的时候,才会渲染到页面的dom中去,那么我们scroll还得refresh()才可以正常使用呢?
      // 所以我们需要判断如下判断,确保我们scroll组件完全可以用,实在不行就refresh()
      // 但是呢?有一个bug,当我们首次点开playList的时候,是一个过程,display: none -> 显示,所以scroll没有刷新好,但是我们直接
      currentSong(newVal, oldVal) {
        // 如果有其中一个条件不满足我们就return   if(!显示 || 新老一样)
        // 如果其中一个条件不满足我们就return     if(显示 && 新老不一样)
        // 如果组件没显示 或者 新歌曲和旧歌曲的id是一样的我们直接return
        if (!this.showFlag || newVal.id === oldVal.id) {
          return
        }
        this.scrollToCurrent(newVal)
      }
    }
    // created() {
    //   console.log('playlist建立好了额')
    //   console.log(this.$refs.listContent)
    // },
    // // mouted scoll组件才做好了
    // mounted() {
    //   console.log(this.$refs.listContent)
    // }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  @import "~assets/css/mixin"
  // 铺满的的上层,fixed布局
  .playlist
    position: fixed
    left: 0
    right: 0
    top: 0
    bottom: 0
    z-index: 200
    background-color: $color-background-d
    // 这个动画和player入场动画很像 ,
    // 这个opacity是什么?应该是all? vue 官网就是用这个opacity
    &.list-fade-enter-active, &.list-fade-leave-active
      transition: opacity 0.3s
      // 这个为什么在这里?意思是 &.list-fade-enter-active类的子类.list-wrapper才有这个效果
      // 翻译是有动画的时候才有这个transition,否则就不需要有,不用长期放在.playlist下
      .list-wrapper
        transition: all 0.3s
    // list-fade入场前的情况
    &.list-fade-enter, &.list-fade-leave-to
      // 事先整个遮罩层是透明的,从 opacity: 0 -> opacity: 1 的过程
      opacity: 0
      .list-wrapper
        // 里面wrapper 的过渡是 是先在偏移在下面的 100% ,所以效果是从下往上的过程
        transform: translate3d(0, 100%, 0)
    // 下面这个&.list-fade-enter存在有必要吗?为什么?
    &.list-fade-enter
    // list包裹层使用绝对定位布局left:0, bottom:0 宽度100%,就是在下方,高度自适应,统一背景色
    .list-wrapper
      position: absolute
      left: 0
      bottom: 0
      width: 100%
      background-color: $color-highlight-background
      // list-header 相对定位布局
      .list-header
        position: relative
        padding: 20px 30px 10px 20px
        // title是包裹图标和文字的使用flex布局 align-items垂直居中
        .title
          display: flex
          align-items: center
          .icon
            margin-right: 10px
            font-size: 30px
            color: $color-theme-d
          // text flex 1 撑满整个title,留给一点给clear
          .text
            flex: 1
            font-size: $font-size-medium
            color: $color-text-l
          .clear
            extend-click()
            // 给字体图标设置大小和颜色
            .icon-clear
              font-size: $font-size-medium
              color: $color-text-d
      // list-content 不使用布局,因为高度是自适应的,我们给设置一个最高高度,这样就算歌曲再多也不会挡住整个屏幕, overflow
      .list-content
        max-height: 240px
        overflow: hidden
        // 每一列歌曲都是用flex align-items垂直居中, 设置固定高度和 padding overflow
        .item
          display: flex
          align-items: center
          height: 40px
          padding: 0 30px 0 20px
          overflow: hidden
          // 过后的list列表删除deletSong和进场会有一个动画效果,会设置进场和离场动画
          &.list-enter-active, &.list-leave-active
            transition: all 0.1s
            // 我们删除的时候,item高度是从40 -> 0 的一个过程
          &.list-enter, &.list-leave-to
            // 如果从增加歌曲的角度看(进场应该是height0啊), 那么增加歌曲,就是从事先高度height为0 -> 40px 的的过程
            // 如果从删除歌曲的角度看,为什么是从height 40 -> 0 的过程
            // 所以是 0 - > 40 -> 0 这个过程
            // 所以&.list-enter删除了也没有关系的,&.list-leave-to才是离场动画,我们需要的是离场动画啊~
            height: 0
          // 当前歌曲图标设置flex 0 0 20px 固定宽度 ,占据20px的位置,给字体图标设置大小和颜色
          .current
            flex: 0 0 20px
            width: 20px
            font-size: $font-size-small
            color: $color-theme-d
          // 文字flex 1 占领剩下的位置 ,不换行 ,设置字体颜色和字体大小
          .text
            flex: 1
            no-wrap()
            font-size: $font-size-medium
            color: $color-text-d
          // like和 delete span标签 占据dom最后两个区域
          // 设置点击区域增大,体验更加好,字体图标字体大小和颜色
          .like
            extend-click()
            margin-right: 15px
            font-size: $font-size-small
            color: $color-theme
            // 字体图标设置喜欢颜色,桃色
            .icon-favorite
              color: $color-sub-theme
          // 字体图标i可以继承 span中的颜色和字体大小,所以字体图标用span包裹会比较好,用于定位啥的
          .delete
            extend-click()
            font-size: $font-size-small
            color: $color-theme
      // list-operate 没有使用布局 ,设置宽度 和 margin 上下距离, 水平auto就会居中
      .list-operate
        width: 140px
        margin: 20px auto 30px auto
        // 设置flex布局 ,align-items垂直居中 padding撑起内容content,设置border边框和边框radius和字体颜色
        .add
          display: flex
          align-items: center
          padding: 8px 16px
          border: 1px solid $color-text-l
          border-radius: 100px
          color: $color-text-l
          .icon-add
            margin-right: 5px
            font-size: $font-size-small-s
          .text
            font-size: $font-size-small
      // 最后一个list-close
      // 没有设置定位,只有关闭两个字在中间,
      // 设置文本水平居中,字体大小,字体颜色,背景颜色
      // padding可以代替行高吗? 可以哦~
      // 单行文字用行高会比较好,整个区域都是内容
      .list-close
        text-align: center
        line-height: 50px
        background: $color-background
        font-size: $font-size-medium-x
        color: $color-text-l
</style>
