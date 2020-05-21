const Koa = require('koa')
const Router = require('@koa/router')
const axios = require('axios')
const bodyParser = require('koa-bodyparser')
const mysql = require('mysql2/promise')
const jwt = require('koa-jwt')
const jsonwebtoken = require('jsonwebtoken')

const { extendAPIOutput } = require('./lib/middlewares')

const appId = 'wxacd7ea5f7d9a7399'
const appSecret = '9d06322c465e6a2219c20c5ce2661929'
const jwtSecret = 'jwt-secret-test'

const app = new Koa()
const router = new Router()
let connection = null

mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'aaaa7777',
  database: 'soccer_reservation'
}).then(con => {
  // console.log(res)
  connection = con
  console.log('连接mysql成功')
}).catch(err => {
  console.log(err)
  console.log('连接到mysql失败')
})

app.use(function (ctx, next) {
  return next().catch((err) => {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = {
        error: err.originalError ? err.originalError.message : err.message
      };
    } else {
      throw err;
    }
  });
});

app.use(jwt({ secret: jwtSecret }).unless({ path: [/^\/api\/v1\/login/, /^\/api\/v1\/getServerTime/] }))

router.post('/api/v1/login', async ctx => {
  let { code } = ctx.request.body
  if(!code) {
    return ctx.body = ctx.apiError({ errMsg: '必要参数code' })
  }
  const infoRes = await axios.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`)
  console.log(infoRes.data)
  const { session_key, openid } = infoRes.data
  if(!session_key || !openid) {
    return ctx.body = ctx.apiError({ errMsg: '非法的code' })
  }
  const [rows] = await connection.query(`SELECT * FROM user WHERE openid = '${openid}' LIMIT 1`)
  console.log(rows)
  let userId
  if (rows.length) {
    userId = rows[0].userid
    if (rows[0].sessionKey !== session_key) {
      await connection.query(`UPDATE user SET sessionKey = '${session_key}' WHERE openid = '${openid}'`)
    }
  } else {
    const insertUserRes = await connection.query('INSERT INTO user SET ?', { openid, sessionKey: session_key })
    userId = insertUserRes.insertId
  }

  ctx.body = ctx.apiSuccess({
    accessToken: jsonwebtoken.sign({
      userId
    }, jwtSecret, {
      expiresIn: '1d'
    }),
    expired: Date.parse(new Date()) / 1000 + 24 * 60 * 60
  })
})

router.get('/api/v1/getUserInfo', async ctx => {
  ctx.body = ctx.apiSuccess({
    user: ctx.state.user
  })
})

router.get('/api/v1/getServerTime', async ctx => {
  ctx.body = ctx.apiSuccess(parseInt(Date.parse(new Date()) / 1000))
})

app.use(bodyParser())
app.use(extendAPIOutput)

app.use(router.routes())

app.listen(3000)