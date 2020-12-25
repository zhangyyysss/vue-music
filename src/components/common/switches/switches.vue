<template>
  <!-- 居然是ul -->
  <ul class="switches">
    <li class="switch-item" v-for="(item, index) in switches" :key="index" :class="{active: currentIndex === index}" @click="switchItem(index)">
      <span>{{item.name}}</span>
    </li>
  </ul>
</template>

<script>
  export default {
    name: 'switches',
    props: {
      switches: {
        type: Array,
        default() {
          return []
        }
      },
      currentIndex: {
        type: Number,
        default: 0
      }
    },
    // 思考? 这个currentIndex 我们是做成props还是data好?
    // 为什么需要props?有什么好处吗?
    // 我们切换的目的是为了让外层的组件可以切换各自的tag,外层的组件又需要得到currentIndex去展示对应的组件?所以这种情况选择props好,其实都选择props把,就不用想那么多了~
    // 如果是通过props我们就不能通过自己组件的methods来主动修改this.currentIndex的值,会报错,因为这是父组件传过来的值,应该由父组件决定,我们只是一个base组件,不做逻辑
    // 我们可以传事件出去,
    // data() {
    //   return {
    //     currentIndex: 0
    //   }
    // },
    methods: {
      switchItem(index) {
        this.$emit('switch', index)
      }
    }
  }
</script>

<style scoped lang="stylus">
  @import "~assets/css/variable"
  // 如何设计这个通用组件的样式呢?
  // 我们最大的包裹层选择了flex ,align-items 垂直居中, 固定宽度? 为什么? width: 240px ,固定宽度后marign 0 auto 就可以水平居中了啊
  // 加了一个边框和 边框曲度
  .switches
    display: flex
    align-items: center
    width: 240px
    margin: 0 auto
    border: 1px solid $color-highlight-background
    border-radius: 5px
    // 给每一个item flex 1 平均分, padding 控制每一个item之间的距离,
    // 因为固定宽度了,所以给设置text-align,文本水平居中显示
    // 设置字体大小和颜色
    .switch-item
      flex: 1
      padding: 8px
      text-align: center
      font-size: $font-size-medium
      color: $color-text-d
      // 高亮的active,控制背景颜色和文字颜色
      &.active
        background: $color-highlight-background
        color: $color-text
</style>
