## 活动预约小程序server（基于koa2和mysql的api服务器）

### 概述
基于koa2，mysql实现一个预约足球比赛的小程序，提供对比赛创建，参加，查看，删除和修改的功能

### 项目struction
TODO

### 项目features
1.实现了基于jwt和同步服务端时间的token验证

第一次签发token时会返回过期时间（expired字段），每次进入小程序时会调用/api/v1/getServerTime，同步服务端时间（因为js使用Date对象获取的是本机时间，用户可以随便修改，所以不使用）。
如果token在有效期内，直接使用，如果过期，调用wx.login重新获取。
因为用户不能在小程序打开控制台，修改localStorage，所以可以在小程序判断token是否过期。
在浏览器端要服务端判断token的有效性。

### 关于jwt
jwt相比于session是无状态的，无需存储（加解密cpu时间换空间）。
但jwt不能立即失效，比如用户退出登录，客户端清除的token依然是有效的。
如果token支持自动续签，一旦token泄露，就可以被攻击者无限续签使用。
这时可以在redis维护一组用户有效token，每次请求会经过redis检查token有效性。
当用户希望token立即失效时（修改密码或者退出登录），删除redis中token记录。

### 关于jwt自动续签
可以引入一个濒死token的概念，当token快要失效时，返回新的token





