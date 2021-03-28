'use strict'
// 这个是webpack本地打包使用的服务接口...还有一些文件地址
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')
//类似于后端node的写法
const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({sourceMap: config.dev.cssSourceMap, usePostCSS: true})
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,

  // these devServer options should be customized in /config/index.js
  devServer: {
    disableHostCheck: true,
    clientLogLevel: 'warning',
    historyApiFallback: {
      rewrites: [
        {from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html')},
      ],
    },
    hot: true,
    contentBase: false, // since we use CopyWebpackPlugin.
    compress: true,
    host: HOST || config.dev.host,
    port: PORT || config.dev.port,
    open: config.dev.autoOpenBrowser,
    overlay: config.dev.errorOverlay
      ? {warnings: false, errors: true}
      : false,
    publicPath: config.dev.assetsPublicPath,
    proxy: config.dev.proxyTable,
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: config.dev.poll,
    },
    // https://blog.csdn.net/HermitSun/article/details/86766299 Axios+Express简单实现前后端通信
    before(app){//前端请求我们代理服务器地址 ,我们的代理服务器再去请求qq音乐的服务器
      app.get('/api/getDiscList', (req, res) => {//到代理服务器接收到地址为/api/getDiscList的get请求会执行以下操作
        const url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'//真正的qq音乐推荐地址
        axios.get(url, {//这个对象可以配置请求头
          headers: {
            referer: 'https://c.y.qq.com/',//配置请求头的referer,欺骗他的服务器,我们的host和refer是这样的~
            host: 'c.y.qq.com'            //配置请求头的host
          },
          params: req.query               //传入浏览器发过来的请求参数,也就是recommend.js写的配置参数拼接起来
        }).then((response) => {//这里的额response是返回的响应头
          res.json(response.data)
          //拿到返回的响应头里面的数据,通过res.json()输出到浏览器端,如果请求成功,就向浏览器返回json类型的数据,res是我们本地请求本地服务器的response,response是本地服务器请求qq的返回的response
          //res.json 是express中的语法,透传,效果是从qq音乐的返回数据传到本地请求返回的res数据中,数据给到前端
        }).catch(e => {
          // eslint-disable-next-line no-console
          console.log(e + '本地服务器请求数据失败')
        })
      })

      // 这里我们代理了一个 post 请求，我们本地实现了 /api/getPurlUrl 这个 post 接口，并且接受的是 json 格式的数据，
      // 然后转发给 QQ 官网接口的时候，我们添加了 headers，伪造了 referer 和 origin，
      // 并且把 Content-Type 设置为 application/x-www-form-urlencoded，目的就是为了满足 QQ 官网接口的请求格式
      // bodyParser中间件使用bodyParser.json()对请求体进行序列化解析json数据,所以下面可以直接通过req.body得到序列化过后的字符串
      //最后，bodyParser是对中间件的引用。请求体解析后，解析值都会被放到req.body属性，所以直接拿出来就行了。
      // https://www.jianshu.com/p/94e09847dcb3
      /*
      * req.params  一个数组，包含命名过的路由参数。
      *
      * req.param(name) 返回命名的路由参数，或者 GET 请求或 POST 请求参数。建议你忽略此方法。
      *
      * req.query  一个对象，包含以键值对存放的查询字符串参数（通常称为 GET 请求参数）
      *
      * req.body 一个对象，包含 POST 请求参数。这样命名是因为 POST 请求参数在 REQUEST 正文中传递，
      * 而不像查询字符串在 URL 中传递。要使 req.body 可用，需要中间件能够解析请求正文内容类型。
      * */
      // 首先后端接受这个post请求,所以前端访问'/api/getPurlUrl'都会后端代理这个请求,并且接受的是json格式的数据
      // 我们在这个代理中再做一个axios请求,伪造请求头部中的 referer头和orgin和 'Content-type'
      // 我们使用处理过的req.body作为参数去请求数据
      app.post('/api/getPurlUrl', bodyParser.json(), function(req, res) {
        const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
        // 因为是post请求,所以参数是在response.body里面,因为之前我们做过序列化操作,所以可以直接传入当成params
        // 所以req.body序列化过后的,应该是一个字符串?????????
        axios.post(url, req.body, {
          headers: {
            referer: 'http://y.qq.com/',
            orgin: 'https://y.qq.com',
            'Content-type': 'application/x-www-form-urlencoded'
          }
        }).then((response) => {
          res.json(response.data)
        }).catch((e) => {
          console.log(e + '本地服务器请求数据失败')
        })
      })

      // 歌单的歌曲列表数据请求
      app.get('/api/lyric', function(req, res) {
        const url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'
        axios.get(url, {
          headers: {
            referer: 'https://c.y.qq.com',
            host: 'c.y.qq.com'
          },
          params: req.query
        }).then((response) => {
          // 如果是jsonp对象,我们转化成json对象
          let ret = response.data
          if (typeof ret === 'string') {
            const reg = /^\w+\(({.+})\)$/
            const matches = ret.match(reg)
            if (matches) {
              ret = JSON.parse(matches[1])
            }
          }
          res.json(ret)
        }).catch((e) => {
          console.log(e + '本地服务器请求数据失败')
        })
      })

      //歌单的歌曲列表数据请求
      app.get('/api/getCdInfo', function (req, res) {
        const url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
        axios.get(url, {
          headers: {
            referer: 'https://c.y.qq.com/',
            host: 'c.y.qq.com'
          },
          params: req.query
        }).then((response) => {
          let ret = response.data
          if (typeof ret === 'string') {
            const reg = /^\w+\(({.+})\)$/
            const matches = ret.match(reg)
            if (matches) {
              ret = JSON.parse(matches[1])
            }
          }
          res.json(ret)
        }).catch((e) => {
          console.log(e)
        })
      })

      // 获取search检索数据
      app.get('/api/search', function (req, res) {
        const url = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp'
        axios.get(url, {
          headers: {
            referer: 'https://c.y.qq.com/',
            host: 'c.y.qq.com'
          },
          params: req.query
        }).then((response) => {
          res.json(response.data)
        }).catch((e) => {
          console.log(e)
        })
      })
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})

module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({
        compilationSuccessInfo: {
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors
          ? utils.createNotifierCallback()
          : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
