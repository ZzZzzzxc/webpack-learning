const path = require("path");
const webpack = require("webpack");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const merge = require("webpack-merge");
const cssnano = require("cssnano");
const baseConfig = require("./webpack.base");
const HtmlWebpackPlugin = require("html-webpack-plugin");

// 构建速度分析，与 html-webpack-externals-plugin 冲突
const smp = new SpeedMeasurePlugin();

const prodConfig = {
  mode: "production",
  plugins: [
    // 环境变量
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true),
    }),
    // 体积分析
    new BundleAnalyzerPlugin(),
    // css 压缩
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: cssnano,
    }),
    // html 压缩
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "../public/index.html"),
      filename: "index.html",
      chunks: ["app"],
      inject: true,
      cdn: [
        "https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.min.js",
        "https://cdn.jsdelivr.net/npm/vue-router@3.1.6/dist/vue-router.min.js",
        "https://cdn.jsdelivr.net/npm/vuex@3.1.3/dist/vuex.min.js",
      ],
      minify: {
        html5: true,
        collapseWhitespace: true,
        preserveLineBreaks: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: false,
      },
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
    minimizer: [
      // 多进程压缩
      new TerserPlugin({
        parallel:true,
        cache:true
      }),
    ],
  },
  externals: {
    vue: "Vue",
    "vue-router": "VueRouter",
    vuex: "Vuex",
  },
};

const webpackConfig = smp.wrap(merge(baseConfig, prodConfig));

module.exports = webpackConfig;
