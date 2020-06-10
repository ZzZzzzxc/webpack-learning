const path = require("path");
// const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

module.exports = {
  // 入口
  entry: {
    app: "./src/main.js",
  },
  output: {
    // 输出路径
    path: path.join(__dirname, "../dist"),
    // 输出文件名
    filename: "[name]_[hash:8].js", // hash 策略 8位hash
  },
  module: {
    rules: [
      {
        test: /.js$/,
        use: [
          "babel-loader", // 解析 语法
        ],
      },
      {
        test: /.css$/,
        use: [
          //   "style-loader",
          MiniCssExtractPlugin.loader,
          "css-loader", // 解析 cess
        ],
      },
      {
        test: /.less$/,
        use: [
          // "style-loader", //向 DOM 插入 由JS字符串生成的 style 标签 （最后执行）
          MiniCssExtractPlugin.loader,
          "css-loader", // 将 css 转成 CommonJS 模块
          // 需要在 less-loader 前引入，否则单行注释会报错
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [
                // css 前缀补全
                require("autoprefixer")({
                  overrideBrowserslist: ["last 2 version", ">1%", "ios 7"],
                }),
              ],
            },
          },
          // px 转 rem
          {
            loader: "px2rem-loader",
            options: {
              remUnit: 75,
              remPrecision: 8,
            },
          },
          "less-loader", // less 转为 css （最先执行）
        ],
      },
      // 解析图片资源
      {
        test: /.(png|jpg|gif|jpeg)$/,
        use: [
          {
            loader: "url-loader", // url-loader内依赖了file-loader
            options: {
              name: "[name]_[hash:8].[ext]", // hash 策略 8位hash
              limit: 10240,
            },
          },
        ],
      },
      // 解析字体资源
      {
        test: /.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: "url-loader", // url-loader内依赖了file-loader
            options: {
              name: "[name]_[hash:8].[ext]", // hash 策略 8位hash
            },
          },
        ],
      },
      // 解析 vue 文件
      {
        test: /.vue$/,
        use: "vue-loader",
      },
    ],
  },
  plugins: [
    // css 文件
    new MiniCssExtractPlugin({
      filename: "[name]_[contenthash:8].css",
    }),
    // html 压缩
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "../public/index.html"),
      filename: "index.html",
      chunks: ["app"],
      inject: true,
      minify: {
        html5: true,
        collapseWhitespace: true,
        preserveLineBreaks: false,
        minifyCSS: true,
        minifyJS: true,
        removeComments: false,
      },
    }),
    // 自动清理构建目录
    new CleanWebpackPlugin(),
    new VueLoaderPlugin(),
    new FriendlyErrorsWebpackPlugin(),
  ],
  resolve: {
    // 配置别名，替换导入路径
    alias: {
      "@": path.resolve("src"),
      vue$: "vue/dist/vue.esm.js",
    },
  },
  stats: "errors-only",
};