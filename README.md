# 基础概念

- entry
- output
- loaders
- plugins
- mode

# 基础配置

## 资源解析

在 Webpack 中只能识别 JSON 和 JS 文件，所以我们需要 loader 来使 Webpack 能够处理各种资源。

### 语法

各类语法需要通过 babel 进行编译处理，

- es6 ：@babel/preset-env
- react ：@babel/preset-react

通过在 babel 配置文件中设置 `presets`， 

### 样式文件

- style-loader ： 向 DOM 结构中插入由 JS 字符串生成的 style 标签
- css-loader ： 解析 css 文件，将 css 转成 CommonJS 模块
- less-loader ： 解析 less 文件，转为 css ，其他预处理器也类似

**注意，Webpack 中 使用的是从右到左（ compose  ）的方式处理多个 loader 。**

```js
 use: [
	"style-loader", // 向 DOM 插入 由JS字符串生成的 style 标签 （最后执行）	
	"css-loader", // 将 css 转成 CommonJS 模块（第二步执行）
	"less-loader", // less 转为 css （最先执行）
 ],
```

### 静态资源文件

- file-loader ：简单处理
- url-loader ：依赖 file-loader ，但是功能更多，比如可以将大小小于 `x ` 的资源以 base 64 的方式直接插入代码中

### 简单配置demo

Webpack 中 module 配置

```js
// webpack.config.js
module.exports = {
    module: {
        rules: [
          {
            test: /.js$/,
            use: "babel-loader", // 解析 语法
          },
          {
            test: /.css$/,
            use: [
              "style-loader", //向 DOM 插入 style 标签
              "less-loader", // 解析 less
            ],
          },
          {
            test: /.less$/,
            use: [
              "style-loader", // 向 DOM 插入 由JS字符串生成的 style 标签 （最后执行）	
              "css-loader", // 将 css 转成 CommonJS 模块（第二步执行）
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
                  limit: 10240, // 小于10kb则以base 64嵌入
                },
              },
            ],
          },
          // 解析字体资源
          {
            test: /.(woff|woff2|eot|ttf|otf)$/,
            use: ["file-loader"],
          },
        ],
      },
}
```



babel 配置

```json
// .babelrc
{
    "presets": [
        "@babel/preset-env",  // 默认转换所有ECMAScript 2015+代码
        "@babel/preset-react" // react语法 
    ]
}
```



## 文件监听

Webpack 支持对文件进行监听，当监听到变化后会重新进行编译，通过**轮询判断文件的最后编辑时间是否变化**，若某个文件发生了变化，不会立即告诉监听者，而是会先缓存起来，等待 aggregateTimeout  再进行通知。

在 dev 的环境下，开发者需要手动刷新浏览器查看变化。

```js
// webpack.config.js
module.exports = {
    // 开启监听模式 ，监听到文件发生变化后重新编译
  	watch: true,
  	watchOptions: {
    	// 忽略某些文件或者文件夹，支持正则，默认空
    	ignored: /node_modules/,
    	// 监听到变化之后等待一定时间再去执行，默认 300 毫秒
    	aggregateTimeout: 300,
    	// 判断文件是否发生变化是通过轮询的方式实现，默认每秒1000次
    	poll: 1000,
  },
}
```

启动 Webpack 的时候，添加 --watch 

```json
// package.json
{
    "scripts": {
    	"build:watch": "webpack --watch",
    },
}
```



## 热更新

### webpack-dev-server

- WDS 不刷新浏览器
- WDS 不输出文件，而是放在内存中
- 使用 HotModuleReplacementPlugin 插件

```js
const webpack = require("webpack");

module.exports = {
    // 省略部分代码
   plugins: [new webpack.HotModuleReplacementPlugin()],
   devServer: {
     contentBase: "./dist",
     hot: true,
   },
};
```

- webpack-dev-server 提供 bundle server 的能力，使生成的文件能够通过 localhost:8080 的方式进行访问，并且也提供了浏览器自动刷新的能力。
- hot-module-replacement-plugin 的作用是提供 HMR 的 runtime，并且将 runtime 注入到 bundle.js 代码里面去。一旦磁盘里面的文件修改，那么 HMR server 会将有修改的 js module 信息发送给 HMR runtime，然后 HMR runtime 去局部更新页面的代码。因此这种方式可以不用刷新浏览器。相对于`live reload`刷新页面的方案，HMR 的优点在于可以保存应用的状态，提高了开发效率

### webpack-dev-middleware

WDM 将 webpack 输出的文件传输给服务器，适合灵活多变的场景

### HMR原理

此部分出自[Webpack HMR 原理解析](https://zhuanlan.zhihu.com/p/30669007)

![](README.assets/hmr.jpg)

1. 第一步，在 webpack 的 watch 模式下，文件系统中某一个文件发生修改，webpack 监听到文件变化，根据配置文件对模块重新编译打包，并将打包后的代码通过简单的 JavaScript 对象保存在内存中。
2. 第二步是 webpack-dev-server 和 webpack 之间的接口交互，而在这一步，主要是 dev-server 的中间件 webpack-dev-middleware 和 webpack 之间的交互，webpack-dev-middleware 调用 webpack 暴露的 API对代码变化进行监控，并且告诉 webpack，将代码打包到内存中。
3. 第三步是 webpack-dev-server 对文件变化的一个监控，这一步不同于第一步，并不是监控代码变化重新打包。当我们在配置文件中配置了[devServer.watchContentBase](https://webpack.js.org/configuration/dev-server/#devserver-watchcontentbase) 为 true 的时候，Server 会监听这些配置文件夹中静态文件的变化，变化后会通知浏览器端对应用进行 live reload。注意，这儿是浏览器刷新，和 HMR 是两个概念。
4. 第四步也是 webpack-dev-server 代码的工作，该步骤主要是通过 [sockjs](https://webpack.js.org/configuration/dev-server/#devserver-watchcontentbase)（webpack-dev-server 的依赖）在浏览器端和服务端之间建立一个 websocket 长连接，将 webpack 编译打包的各个阶段的状态信息告知浏览器端，同时也包括第三步中 Server 监听静态文件变化的信息。浏览器端根据这些 socket 消息进行不同的操作。当然服务端传递的最主要信息还是新模块的 hash 值，后面的步骤根据这一 hash 值来进行模块热替换。
5. webpack-dev-server/client 端并不能够请求更新的代码，也不会执行热更模块操作，而把这些工作又交回给了 webpack，webpack/hot/dev-server 的工作就是根据 webpack-dev-server/client 传给它的信息以及 dev-server 的配置决定是刷新浏览器呢还是进行模块热更新。当然如果仅仅是刷新浏览器，也就没有后面那些步骤了。
6. HotModuleReplacement.runtime 是客户端 HMR 的中枢，它接收到上一步传递给他的新模块的 hash 值，它通过 JsonpMainTemplate.runtime 向 server 端发送 Ajax 请求，服务端返回一个 json，该 json 包含了所有要更新的模块的 hash 值，获取到更新列表后，该模块再次通过 jsonp 请求，获取到最新的模块代码。这就是上图中 7、8、9 步骤。
7. 而第 10 步是决定 HMR 成功与否的关键步骤，在该步骤中，HotModulePlugin 将会对新旧模块进行对比，决定是否更新模块，在决定更新模块后，检查模块之间的依赖关系，更新模块的同时更新模块间的依赖引用。
8. 最后一步，当 HMR 失败后，回退到 live reload 操作，也就是进行浏览器刷新来获取最新打包代码。

## 文件指纹策略

- Hash：和整个项目的构建相关，只要项目中的文件修改，整个项目构建的 Hash 就会更改
- Chunkhash：和 webpack 打包的 chunk 有关，不同的 entry 会生成不同的 Chunkhash 值
- Contenthash：根据文件内容定义 hash ，文件内容不变，则 Contenthash 不改变

对于 JS 文件使用 chunkhash 策略，在 output 中进行设置

```js
output: {
    path: path.join(__dirname, "dist"),
    filename: "[name]_[chunkhash:8].js", // chunkhash 策略 8位hash
  },
```

对于静态资源文件，使用 hash 策略

```js
 module: {
    rules: [
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
    ],
  },
```

对于样式文件，使用 contenthash 策略，需要依赖 mini-css-extract-plugin 插件，**注意：该 loader 与 style-loader 冲突**

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  module: {
    rules: [
      {
        test: /.less$/,
        use: [
          // "style-loader", //向 DOM 插入 由JS字符串生成的 style 标签 （最后执行）
          MiniCssExtractPlugin.loader,
          "css-loader", // 将 css 转成 CommonJS 模块（第二步执行）
          "less-loader", // less 转为 css （最先执行）
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name]_[contenthash:8].css",
    }),
  ],
};
```



## 代码压缩

- html-webpack-plugin：负责 HTML 文件的压缩
- optimize-css-assets-webpack-plugin：负责 CSS 文件的压缩
- uglifyjs-webpack-plugin：负责 JS 文件的压缩，已经内置

```js
const HtmlWebpackPlugin = require("html-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports = {
     // 省略部分配置
     plugins: [
       new OptimizeCSSAssetsPlugin({
         assetNameRegExp: /\.css$/g,
         cssProcessor: require("cssnano"),
       }),
       new HtmlWebpackPlugin({
         template: path.join(__dirname, "src/index.html"),
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
     ],
};
```



# 进阶配置

## Tree Shaking

## SourceMap

## Scope Hoisting

## 动态import

## 项目规范

### Eslint

### Git

# 搭建一个完整项目

## 基础配置

### 资源解析

### 样式增强

### 目录清理

### 多页面打包

### 命令行信息显示优化

### 错误捕捉和处理

### CSS提取

## 开发阶段配置

### 代码热更新

### sourcemap

## 生产阶段配置

### 代码压缩

### 文件指纹

### Tree Shaking

### Scope Hoisting

### 速度优化

### 体积优化

## 测试模块

## SSR配置