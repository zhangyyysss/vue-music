<template>
  <div id="app">
    <m-header></m-header>
    <tab></tab>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
    <player></player>
  </div>
</template>

<script>
  import MHeader from 'components/content/m-header/m-header'
  import Tab from 'components/content/tab/Tab'
  import Player from 'components/content/player/player'

  export default {
    name: 'App',
    components: {
      MHeader,
      Tab,
      Player
    }
  }
</script>

<style scoped lang="stylus">
  // @import 'assets/css/test.css'
</style>
