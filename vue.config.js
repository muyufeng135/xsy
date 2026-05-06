module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: 'https://api-p05.xiaoshouyi.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Bearer 525696e26b0ff18ceab8b969ae589b0630a613344f4ec280bba98bb7c245cc8f.NDEwMDQ1NzE0OTQxODIwNw==0'
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
