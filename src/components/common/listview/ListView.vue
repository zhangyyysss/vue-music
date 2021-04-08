<template>
  <scroll class="listview"
          :data="data"
          ref="listview"
          :listenScroll="listenScroll"
          @scroll="scroll"
          :probeType="probeType">
    <ul>
      <li v-for="(group,index) in data" :key="index" class="list-group" ref="listGroup">
        <h2 class="list-group-title">{{group.title}}</h2>
        <ul>
          <li @click="selectItem(item)" v-for="(item,indez) in group.items" :key="indez" class="list-group-item">
            <img class="avatar" v-lazy="item.avatar" alt="">
            <span class="name">{{item.name}}</span>
          </li>
        </ul>
      </li>
    </ul>
    <div class="list-shortcut" v-show="data.length" @touchstart="onShortcutTouchStart" @touchmove.prevent.stop="onShortcutTouchMove">
      <ul>
        <li
          v-for="(item,index) in shortcutList"
          :key="index"
          class="item"
          :data-index="index"
          :class="{'current': currentIndex === index}"
        >
          {{item}}
        </li>
      </ul>
    </div>
    <!--  当没有fixedTitle内容,这个dom直接隐藏起来,边界情况处理  -->
    <div class="list-fixed" v-show="fixedTitle" ref="fixed">
      <h1 class="fixed-title">{{fixedTitle}}</h1>
    </div>
    <div class="loading-container" v-show="!data.length">
      <loading></loading>
    </div>
  </scroll>

</template>

<script>
  import Scroll from 'components/common/scroll/Scroll'
  import {getData} from 'common/js/dom'
  import Loading from 'components/common/loading/Loading'

  const ANCHOR_HEIGHT = 18
  const TITLE_HEIGHT = 30

  export default {
    name: 'ListView',
    components: {
      Scroll,
      Loading
    },
    // 我们需要关注这些数据变化,所以我们将这些数据写在data中,我们要使用watch
    data() {
      return {
        scrollY: 0,
        currentIndex: 0,
        diff: -1
      }
    },
    // 为什么不再data中创建这个共享的对象呢?因为在vue里面,不管是props,data,都会被添加getter和setter
    // 都会对这些数据监听,是为了和dom实现数据绑定,我们这里并不需要关注数据的变化,我们只是想要两个函数观测到这个对象
    created() {
      this.touch = {}
      this.listenScroll = true
      // this.probeType = 3 不节流监听滚动,时时刻刻监听
      this.probeType = 3
      this.listHeight = []
    },
    props: {
      data: {
        type: Array,
        default() {
          return []
        }
      }
    },
    computed: {
      // 截取item.title中的数据开头的第一个字符(例如: a-zA-Z)
      shortcutList() {
        return this.data.map(group => {
          return group.title.substr(0, 1)
        })
      },
      // fixedTitle就是障眼法的吸顶效果的title文本内容
      fixedTitle() {
        // 边界情况处理,对页面往下滚动时候,fixedTitle是不存在的,我们返回 '' ,这样固定在顶部的fixedtTitle往下滚动就不存在了
        if (this.scrollY > 0) {
          return ''
        }
        // 为什么要做判断,因为一开始this.data是一个空数组,是父组件通过props传递过来的,所以我们要进行判断,如果硬取就会报错
        return this.data[this.currentIndex] ? this.data[this.currentIndex].title : ''
      }
    },
    methods: {
      refresh() {
        this.$refs.listview.refresh()
      },
      selectItem(item) {
        this.$emit('select', item)
      },
      // 点击shortcut栏一下就进入以下内容
      onShortcutTouchStart(e) {
        // 拿到我们点击相对应li中设置的data-index的值
        let anchorIndex = getData(e.target, 'index')
        // 获得手指集合中第一个手指头的touch对象e.touches[0],我们又需要在哪个函数中共享这个数据,所以需要全局变量this.touch
        let firstTouch = e.touches[0]
        // 将手指头一放上去的y值记录到全局变量this.touch.y1
        this.touch.y1 = firstTouch.pageY
        // 记录目前的初始位置的索引
        this.touch.anchorIndex = anchorIndex
        // 根据我们拿到的索引数据,使用better-scroll的scrollToElement,跳转到左边指定的元素处this.$refs.listGroup[anchorIndex]
        this._scrollTo(anchorIndex)
      },
      // 手指在shortcut栏中移动就进入以下内容
      onShortcutTouchMove(e) {
        let firstTouch = e.touches[0]
        this.touch.y2 = firstTouch.pageY
        // 所以偏移量/每一个li的像素高度,得到偏移了几个元素高度(delta)
        // 18 怎么算出来的,就是元素高度+padding,F12也可以看出来
        // 后面 或0  | 0 是什么意思 ,相当于Math.floor(),向下取证的意思
        let delta = (this.touch.y2 - this.touch.y1) / ANCHOR_HEIGHT | 0
        // 计算出 个数偏差值,(如果 往上移动,所以delta就是负值)(如果 往下移动,所以delta就是正的)
        // 所以直接相加就可以了
        let anchorIndex = parseInt(this.touch.anchorIndex) + delta
        this._scrollTo(anchorIndex)
      },
      // 监听歌手列表落在哪个位置,右边入口高亮 这就是列表联动
      scroll(pos) {
        this.scrollY = pos.y
      },
      // 封装一个方法控制listGroup的滚动
      _scrollTo(index) {
        // 上下padding两个小黑块为null,我们做判断,我们要排除点击上面padding和下面padding出现index为0的区块,因为padding只是为了美观,但是点击一样会有index传入
        // 注意这里的判断区别的0和null的判断的区别
        // 如果是null 进的去 if语句,直接return,断了,不执行下面代码,以至于不会执行下面的代码,就不会报错
        // 如果是0,第一个条件满足,第二个条件不满足,进不去if语句,执行下面代码,
        if (!index && index !== 0) {
          return
        }

        // 判断临界情况,我们滑动shortcut的时候,继续往上面滑动,index是一个负值,或者说滑动最小面的padding,继续往下滑动,是一个无限大的值
        // 因为touchmove事件是一直在执行的,我们得处理index的边界情况,
        //  如果index<0, 就让index= 0,
        //  如果index无限大,那么我们就让最大是this.listHeight.length - 2, 为什么要减去2?
        // 因为当前索引currentIndex 就是 listHeight.length - 2 ( listHeight.length默认是比正常数组多一个0的,为了计算上限和下限的高度, -1 是变为数组长度, -1 是求得当前索引)
        if (index < 0) {
          index = 0
        } else if (index > this.listHeight.length - 2) {
          index = this.listHeight.length - 2
        }
        console.log(index)
        // 因为当我们点击shortcut,不属于滚动,所以不会派发scrollY(newY)事件,也不会计算相应高度,所以我们必须手动的设置this.scrollY的值
        // 让他到所对应index的上限位置
        // 手动设置scrollY,达成点击指定的a-z,可以调转且改变scrollY的值实现高亮
        this.scrollY = -this.listHeight[index]
        // 为什么better-scroll中的this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)不会出现index边界出错的情况
        // 例如说:index为负数,或者无限大的数字,因为better-scroll已经做了处理了,
        this.$refs.listview.scrollToElement(this.$refs.listGroup[index], 0)
      },
      // 计算每一个group列表的高度
      _calculateHeight() {
        // this.listHeight是全局变量哦~设置一个数组存储这些歌手列表的高度
        this.listHeight = []
        // 将所有li歌手总列表存入list变量中
        const list = this.$refs.listGroup
        // 一开始的高度是0
        let height = 0
        // 把这个0,第一组push进listHeight数组
        this.listHeight.push(height)
        // for遍历list数组
        for (let i = 0; i < list.length; i++) {
          let item = list[i]
          // height 累加每一个li的高度,dom可以使用clientHeight获取dom的高度
          height += item.clientHeight
          // 每次累加完的数据都push到listHeight数组中
          this.listHeight.push(height)
          // 我们可以得到一个类似 [0,222,423,456,778,904] 这样的一个高度数组
          // 我们就把这个数组中的数据和scorll滚动方法中的this.scrollY做对比,这样我们就能知道用户的歌手列表滚动到具体区间,从而获取currentIndex高亮
        }
      }
    },
    // watch观察data变量,哪个data,就是singer传递过来的数据data,<list-view :data="singers"></list-view>
    // setTimeout(() => {this._calculateHeight()},20)确保dom完全渲染完毕再调用_calculateHeight()方法计算高度
    watch: {
      data() {
        setTimeout(() => {
          this._calculateHeight()
        }, 20)
      },
      // 监控scrollY属性,变化的时候我们进行操作判断区间
      scrollY(newY) {
        const listHeight = this.listHeight
        // 第一种情况:当滚到到顶部(页面往下走,顶部空白),此时newY>0,
        if (newY >= 0) {
          // 此时就是第一个元素高亮
          this.currentIndex = 0
          return
        }
        // 第二种情况:在中件部分判断,(计算得到this.diff的差值)
        // (中间部分的上限和下限做对比)
        // 不遍历到最后一个元素,为什么?因为listHeight中的元素个数是大于列表中元素个数的,多一个,多了一个0?
        // 第一个元素的下限是第二个元素的上限
        for (let i = 0; i < listHeight.length - 1; i++) {
          let height1 = listHeight[i]
          let height2 = listHeight[i + 1]
          // 页面往上滚动,newY都是负值,所以-newY是正值对比,
          if ((-newY >= height1 && -newY < height2)) {
            this.currentIndex = i
            // 中间滚动的时候,可以得到diff的值
            // 这个diff的意思就是 热门的底部/A的头部 + newY (就是还差多少到A的距离,包含了热门title的位置哦,所以我们需要-固定的高度30)
            this.diff = height2 + newY
            return
          }
        }

        // 第三种情况: 滚动到底部,且-newY可能大于最后一个元素(Z)的上限
        // 为什么是-2呢?,因为
        // 假如说有3组数据a,b,c, 那么listHeight就是 [0, 2, 4, 6], 那么当是最后一个c的时候,currentIndex应该是2对把,所以listHeight.length(4)-2 = 2
        this.currentIndex = listHeight.length - 2
      },
      // 处理fixedTitled往上偏移多少,就往上顶的感觉
      diff(newVal) {
        // 因为是watch() 中, 所以diff的新的值一直时时刻刻会得到监控
        // 当diff有新值newVal的时候,那么条件 newVak>0 且 newVal <30的时候(说明已经fixedtTitle已经重叠了),那么我们求得偏移值就是newVal - 30
        //  如果不满足条件,我们没必要改变fixedTop的值~fixedTop就是0,但是下面如果不return的话,还是会执行dom操作的,因为移动0px也是dom的操作
        // 所以我们必须作出判断,如果fixedTop === this.fixedTop 有两种情况,这个
        let fixedTop = (newVal > 0 && newVal < TITLE_HEIGHT) ? newVal - TITLE_HEIGHT : 0
        // 下面是减少dom操作的频度~~~~~
        // 因为我们在diff实时(一直变化)变化的过程,我们不希望一直修改dom,我们做一个判断.我们存在本地一个this.fixedTop
        // 如果之前的fixedTop === 现在的fixedTop,那么们就return跳出去,不会继续执行下面的dom操作
        // 否则我们就把新的fixedTop赋值给本地this.fixedTop保存下来,用于下次比较 this.fixedTop = fixedTop
        if (this.fixedTop === fixedTop) {
          return
        }
        this.fixedTop = fixedTop
        // console.log(this.fixedTop + 'and' + fixedTop)
        // 设置3d加速 gpu加速,fixedTOP是负值,所以往上走,符合预期~~~~~
        this.$refs.fixed.style.transform = `translate3d(0, ${fixedTop}px, 0)`
        console.log(fixedTop)
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable.styl"
  // 相对定位不影响前面的布局,占有位置,width,和height100%相对于父元素,则是占据剩余空间,也相当于固定了wrapper的高度,
  // 可以正常滚动
  .listview
    position relative
    width 100%
    height 100%
    overflow hidden
    background: $color-background

    .list-group
      padding-bottom 30px

      .list-group-title
        height: 30px
        line-height: 30px
        padding-left: 20px
        font-size: $font-size-small
        color: $color-text-l
        background: $color-highlight-background

      .list-group-item
        display: flex
        align-items: center
        padding: 20px 0 0 30px

        .avatar
          width: 50px
          height: 50px
          border-radius: 50%

        .name
          margin-left: 20px
          color: $color-text-l
          font-size: $font-size-medium

    .list-shortcut
      position absolute
      right 0
      top 50%
      transform translateY(-50%)
      width: 20px
      padding: 20px 0
      text-align: center
      background: $color-background-d
      font-family: Helvetica
      border-radius: 10px

      .item
        padding 3px
        line-height 1
        color $color-text-l
        font-size $font-size-small

        &.current
          color $color-theme
    // 我们从样式可以看到,就是固定定位在顶部一个fixed一样的,固定在上面的一个元素
    .list-fixed
      position absolute
      top -2px
      left 0
      width 100%

      .fixed-title
        height 30px
        line-height 30px
        padding-left 20px
        font-size $font-size-small
        color $color-text-l
        background $color-highlight-background
    .loading-container
      position absolute
      width: 100%
      top 50%
      transform: translateY(-100%)
</style>
