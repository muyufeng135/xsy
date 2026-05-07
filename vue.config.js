module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: 'https://api-p05.xiaoshouyi.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Bearer f8328a14ea5fbf35af1ecf020fe2b8bb37f78f25e9271c364d4ef1ec9410c27a.NDEwMDQ1NzE0OTQxODIwNw==0'
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
