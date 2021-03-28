// 这是我们使用node express做的服务器,用来跨域请求数据
// 当然也可以使用nginx 服务器,里面也可以设置跨域
/* 起服务：将打包后的代码运行在服务之上 */
var express = require('express')
// var compression = require('compression')
var config = require('./config/index')
var axios = require('axios')
// express中的post请求体解析的中间件body-parser
const bodyParser = require('body-parser')
/* process是全局变量无需引入 */
var port = process.env.PORT || config.build.port

var app = express()

var apiRoutes = express.Router()   //express的路由

apiRoutes.get('/getDiscList', function (req, res) {
  var url = 'https://c.y.qq.com/splcloud/fcgi-bin/fcg_get_diss_by_tag.fcg'
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

apiRoutes.get('/getCdInfo', function (req, res) {
  var url = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg'
  axios.get(url, {
    headers: {
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    var ret = response.data
    if (typeof ret === 'string') {
      var reg = /^\w+\(({.+})\)$/
      var matches = ret.match(reg)
      if (matches) {
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }).catch((e) => {
    console.log(e)
  })
})


apiRoutes.get('/lyric', function (req, res) {
  var url = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg'

  axios.get(url, {
    headers: {
      referer: 'https://c.y.qq.com/',
      host: 'c.y.qq.com'
    },
    params: req.query
  }).then((response) => {
    var ret = response.data
    if (typeof ret === 'string') {
      var reg = /^\w+\(({.+})\)$/
      var matches = response.data.match(reg)
      if (matches) {
        ret = JSON.parse(matches[1])
      }
    }
    res.json(ret)
  }).catch((e) => {
    console.log(e)
  })
})

apiRoutes.get('/search', function (req, res) {
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

// 为什么不能使用??????
// 因为这是post请求,不能使用api路由代理,手动设置api   '/api/getPurlUrl'
app.post('/api/getPurlUrl', bodyParser.json(), function (req, res) {
  const url = 'https://u.y.qq.com/cgi-bin/musicu.fcg'
  // 安装了body-parser中间件,我们使用req.body来接受???序列化操作??post请求的在请求体中params
  // 这里的意思是首先我们后台服务接受到/api/getPurlUrl的接口请求,带过来的数据我们进行bodyParser.json(),解析之后,
  // 我们就可以使用req.body获得请求参数,我们再通过服务器发请求,伪造了请求头和请求源和格式协议,从而达到通过服务器做中间层转发请求
  axios.post(url, req.body, {
    headers: {
      referer: 'https://y.qq.com/',
      origin: 'https://y.qq.com',
      'Content-type': 'application/x-www-form-urlencoded'
    }
  }).then((response) => {
    res.json(response.data)
  }).catch((e) => {
    console.log(e)
  })
})

// 把路由容器挂载到app服务中
app.use('/api', apiRoutes)
// 开启gzip配置压缩...要写在静态资源托管之前,否则失败
// app.use(compression())

/* Express框架：提供了static中间件来设置静态文件的资源 */
app.use(express.static('./dist')) //express设置静态文件(所以会打开dist/index.html)
/* 起端口 */
module.exports = app.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
  console.log('Listening at http://localhost:' + port + '\n')
})
