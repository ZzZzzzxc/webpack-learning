# 搭建一个Vue单页应用

## 通用配置

### 资源解析

由于 Webpack 只能识别 JSON 和 JS 文件，所以我们需要 loader 来使 Webpack 能够处理各种资源。

#### 语法解析

各类语法需要通过 babel 进行编译处理。

- ECMAScript 2015+ 

- 动态 import，实现路由懒加载

创建 `.babelrc` 文件，配置 presets 和 plugins

```json
{
  "presets": [
    "@babel/preset-env" // 默认转换所有ECMAScript 2015+代码
  ],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import" // 动态 import ，路由懒加载
  ]
}
```

然后在 Webpack 配置文件中的 module 内，添加 `babel-loader`。

#### CSS 相关

项目中选择使用 `less`作为预处理器，需要依赖 `less-loader` ， `less-loader` 会将 less 文件 编译为 css 文件，然后需要使用 `css-loader` 将 css 转为 CommonJS 模块，之后我们需要将 DOM 结构与 CSS 对象结合，这一步可以有几种方法：

- mini-css-extract-plugin 的 loader：将 CSS 对象动态引入（项目使用）
- style-loader：直接向 DOM 结构中插入 style 标签 

**注意，Webpack 中 使用的是从右到左（ compose ）的方式处理多个 loader 。**

```js
 use: [

 "style-loader", // 向 DOM 插入 由JS字符串生成的 style 标签 （最后执行） 

 "css-loader", // 将 css 转成 CommonJS 模块（第二步执行）

 "less-loader", // less 转为 css （最先执行）

 ],
```

#### 静态资源文件

- file-loader：简单处理
- url-loader：依赖 file-loader ，集成了更多功能，如可以将小资源以 `base 64` 的方式插入代码。

#### 解析 vue 单文件

需要使用 `vue-loader` 和 `vue-loader/lib/plugin` 插件。

### 样式增强

#### 前缀补齐

为了满足各种浏览器的兼容性需求，我们需要使用 `postcss-loader` 进行前缀补齐。

**注意：需要在 less-loader 前引入，否则单行注释会报错。**

```js
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
```

#### 单位转换

我们可以使用 `px2rem-loader` 进行单位转换，将 px 转为 rem。

```js
// px 转 rem
{
	loader: "px2rem-loader",
	options: {
    	remUnit: 75,
    	remPrecision: 8,
	},
},
```

#### 入口文件

单页应用只有一个 html 文件，通过 js 对根节点进行替换达到多个页面的效果，所以需要配置一个入口 html 文件，引入打包后的各个 JS 模块。

使用 `html-webpack-plugin` 插件，基于设定的 html 模板，编译之后将对应的 chunks 进行引入。

```js
{
    plugins:[
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
    ]
}
```



### 目录清理

使用 `clean-webpack-plugin` 插件，可以在每次进行构建前清理文件目录。

### 配置别名

配置别名可以使项目中的资源引用更加简单，就不会出现`../../../../../`这种情况了。

```js
{
	resolve: {
    	// 配置别名，替换导入路径
    	alias: {
      	"@": path.resolve("src"),
      	vue$: "vue/dist/vue.esm.js",
    	},
  	},
}
```

### 环境变量

```js
{
    plugins:[
        // 环境变量
    	new webpack.DefinePlugin({
      		PRODUCTION: JSON.stringify(false),
    	}),
    ]
}
```



## Dev 环境配置

### 热更新

#### webpack-dev-server

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

#### webpack-dev-middleware

WDM 将 webpack 输出的文件传输给服务器，适合灵活多变的场景

#### HMR原理

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

### Sourcemap

## Prod 环境配置

### 代码压缩

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

### 文件指纹

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

### 打包分析

#### 速度分析

使用 `speed-measure-webpack-plugin` 插件，即可在控制台打印出各个插件执行花费的时间，帮助开发者分析影响构建速度的因素。

```js
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
// 构建速度分析，与 html-webpack-externals-plugin 冲突
const smp = new SpeedMeasurePlugin();
const webpackconfig = {}
smp.wrap( webpackconfig );
```

不过该插件可能会与部分插件产生冲突，比如 `html-webpack-externals-plugin` ，会导致该插件未能在 html 模板中插入 script 标签。

#### 构建结果分析

当然是选择 `webpack-bundle-analyzer` 插件啦。

```js
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const config = {
    plugins:[
        new BundleAnalyzerPlugin(),
    ]
}
```

打包完成之后，该插件会默认启用 8888 端口，以网页的形式输出构建后的文件依赖图。

### 体积优化

#### Tree Shaking

生产模式下默认已经开启了 Tree Sharking ，用于清理代码中的无用部分，由于 Tree Sharking 只能处理 ES6 模块，而 babel 的preset 会将代码转为 CommonJS 模块。

所以需要在 babel 的配置文件中添加 `modules:false`

```js
{
  "presets": [
    [
      "@babel/preset-env",// 默认转换所有ECMAScript 2015+代码
      {
        "useBuiltIns": "usage",// 按需加载 polyfill
        "corejs": 3,
        "modules": false // Tree sharking
      }
    ] 
  ],
  "plugins": [
    "@babel/plugin-syntax-dynamic-import" // 动态 import ，路由懒加载
  ]
}
```

#### Scope Hoisting

作用域提升，合并模块的作用域，不仅减小了打包后的体积，也减小了运行时的体积，只需要在插件中引用即可开启。

```js
const webpack = require("webpack");

const prodConfig = {
  plugins: [
    // scope hoising
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};

```

#### 抽离基础库

使用 Webpack 提供的 `externals` ，可以将我们不想打包进去的依赖剔除。

```js
const config = {
    externals: {
    	vue: "Vue",
    	"vue-router": "VueRouter",
    	vuex: "Vuex",
  	},
}
```

去除了依赖之后，我们可以通过 CDN 的方式进行引入，有两种方式，一是直接在模板 html 中通过 script 标签进行引入，不过这也太呆了，所以我们可以利用 `html-webpack-plugin` 插件，在其配置项中新增一个自定义选型，将我们需要额外引入的依赖 url 存入，然后通过遍历的方式动态引入。

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <div id="app"></div>
    <% if(htmlWebpackPlugin.options.cdn){ %> <% for(var i in
    htmlWebpackPlugin.options.cdn){ %>
    <script src="<%= htmlWebpackPlugin.options.cdn[i] %>"></script>
    <% } %> <% } %>
  </body>
</html>
```



### 性能优化

#### 缩小文件搜索范围

当我们在项目中引入一个依赖的时候， Webpack 会通过递归的方式进行查找，所以可以在 `alias` 选项中配置，直接告诉 Webpack 要到哪里去取对应的依赖，缩小文件的查找范围。

#### 多进程并行处理

使用 `terser-webpack-plugin` 插件，在 `optimization` 的 `minimizer` 配置下引入插件，开启多进程并行 压缩代码。

```js
const TerserPlugin = require('terser-webpack-plugin');
 
module.exports = {
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};
```

#### 缓存

使用 `hard-source-webpack-plugin` 插件开启缓存，大多数的 loader 也已经内置了缓存开关。

## 流程规范

### Git

通过使用 `husky` ，我们可以使用 git 的大量钩子，在其中嵌入我们想要执行的动作即可完成 Lint 检查和 commit 信息规范等操作。

commit 信息规范可以使用 `commitlint` 进行配置，语法检查则一般使用 `Eslint` 。

### Changelog

安装 `conventional-changelog-cli` 和 `conventional-changelog` 

创建 `.czrc`

```json
{ "path": "cz-conventional-changelog" }
```

然后在 package.json 里面配置命令即可快速使用，

```json
"scripts": {
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s -r 0"
  },
```



