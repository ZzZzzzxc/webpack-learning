// const path = require("path");
const webpack = require("webpack");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const HtmlWebpackExternalsPlugin = require("html-webpack-externals-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const merge = require("webpack-merge");
const cssnano = require("cssnano");
const baseConfig = require("./webpack.base");

const prodConfig = {
  mode: "production",
  plugins: [
    // css 压缩
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: cssnano,
    }),
    // CDN 入口 html 插入 script 标签
    new HtmlWebpackExternalsPlugin({
      externals: [
        {
          module: "vue",
          entry: "https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js",
          global: "Vue",
        },
        {
          module: "vue-router",
          entry:
            "https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js",
          global: "VueRouter",
        },
        {
          module: "vuex",
          entry: "https://cdn.jsdelivr.net/npm/vuex@3.1.3/dist/vuex.min.js",
          global: "Vuex",
        },
      ],
    }),
    // scope hoising
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
  optimization: {
    // 提取公共模块
    splitChunks: {
      chunks: "async",
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      automaticNameDelimiter: "~",
      name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
        },
        commons: {
          name: "commons", // 打包文件名
          chunks: "all", // 所有引入的库进行分离（推荐）
          minChunks: 2, // 只要引用两次就打包为一个文件
        },
      },
    },
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};

module.exports = merge(baseConfig, prodConfig);
