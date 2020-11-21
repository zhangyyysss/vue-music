<template>
  <div id="app">
    <m-header></m-header>
    <tab></tab>
    <router-view></router-view>
  </div>
</template>

<script>
  import MHeader from 'components/content/m-header/m-header'
  import Tab from 'components/content/tab/tab'

  export default {
    name: 'App',
    components: {
      MHeader,
      Tab
    }
  }
</script>

<style scoped lang="stylus">
  // @import 'assets/css/test.css'
</style>
