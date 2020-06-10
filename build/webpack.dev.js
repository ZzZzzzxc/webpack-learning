const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');

const devConfig = {
  mode: 'development',
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devServer: {
    port: 4396,
    contentBase: '../dist',
    hot: true,
    host: 'localhost',
    overlay: {
      errors: true, // 如果在webpack编译的过程中有任何的错误直接输出到页面上
    },
  },
  // 开启监听模式 ，监听到文件发生变化后重新编译
  watch: true,
  watchOptions: {
    // 忽略某些文件或者文件夹，支持正则，默认空
    // ignored: /node_modules/,
    // 监听到变化之后等待一定时间再去执行，默认 300 毫秒
    aggregateTimeout: 300,
    // 判断文件是否发生变化是通过轮询的方式实现，默认每秒1000次
    poll: 1000,
  },
  devtool: 'source-map',
};

module.exports = merge(baseConfig, devConfig);
