# amis-editor-demo

amis 可视化编辑器, 在线体验：https://aisuda.github.io/amis-editor-demo

要使用编辑器必须熟悉 React，如果不了解建议使用[速搭](https://aisuda.baidu.com/)。

## 本地运行这个项目

1. `npm i` 安装依赖
2. `npm start` 开服务
3. `npm run dev` 开始编译，等编译出现时间信息后就可以刷新页面看效果了。

## 在其他项目中使用 amis-editor

基于百度的 demo 改造，增加加载和保存的的功能，百度amis 编辑器5.2.5中打包会错误
提示，需要到打包输出文件中注释以下行：require('node_modules/amis-theme-editor/lib/renderers.css');


