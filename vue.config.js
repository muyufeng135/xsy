module.exports = {
  devServer: {
    proxy: {
      '/rest': {
        target: 'https://api-p05.xiaoshouyi.com',
        changeOrigin: true,
        secure: false,
        headers: {
          Authorization: 'Bearer 98b95cb9255972c0b1721524cf9543b03810aa48bb449cb0c06b03cf4f729b26.NDEwMDQ1NzE0OTQxODIwNw==0'
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
