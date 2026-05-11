module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: 'https://api-p05.xiaoshouyi.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Bearer 90c888dfcf7f7693eb68059219274e1e723f55125b1a58d51cbc8b6a4cbb499e.NDEwMDQ1NzE0OTQxODIwNw==0'
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
