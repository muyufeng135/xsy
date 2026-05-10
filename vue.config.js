module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: 'https://api-p05.xiaoshouyi.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Bearer 245e0a8efa31abc95ababce15d235f2ed9e82cd3f9d0403d6d7cb19349797ed1.NDEwMDQ1NzE0OTQxODIwNw==0'
        }
      }
    }
  },
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].inject = false
      return args
    })
  }
}
