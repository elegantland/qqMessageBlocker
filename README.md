![qqMessageBlockeR](https://socialify.git.ci/elegantland/qqMessageBlockeR/image?description=1&font=KoHo&forks=1&issues=1&language=1&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDM2IDM2Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJNMjkuODEgMTZIMjlWOC44M2EyIDIgMCAwIDAtMi0yaC02QTUuMTQgNS4xNCAwIDAgMCAxNi41MSAyQTUgNSAwIDAgMCAxMSA2LjgzSDRhMiAyIDAgMCAwLTIgMlYxN2gyLjgxQTMuMTMgMy4xMyAwIDAgMSA4IDE5LjY5QTMgMyAwIDAgMSA3LjIyIDIyQTMgMyAwIDAgMSA1IDIzSDJ2OC44M2EyIDIgMCAwIDAgMiAyaDIzYTIgMiAwIDAgMCAyLTJWMjZoMWE1IDUgMCAwIDAgNS01LjUxQTUuMTUgNS4xNSAwIDAgMCAyOS44MSAxNm0yLjQxIDdBMyAzIDAgMCAxIDMwIDI0aC0zdjcuODNINFYyNWgxYTUgNSAwIDAgMCA1LTUuNTFBNS4xNSA1LjE1IDAgMCAwIDQuODEgMTVINFY4LjgzaDlWN2EzIDMgMCAwIDEgMS0yLjIyQTMgMyAwIDAgMSAxNi4zMSA0QTMuMTMgMy4xMyAwIDAgMSAxOSA3LjE5djEuNjRoOFYxOGgyLjgxQTMuMTMgMy4xMyAwIDAgMSAzMyAyMC42OWEzIDMgMCAwIDEtLjc4IDIuMzEiIGNsYXNzPSJjbHItaS1vdXRsaW5lIGNsci1pLW91dGxpbmUtcGF0aC0xIi8%2BPHBhdGggZmlsbD0ibm9uZSIgZD0iTTAgMGgzNnYzNkgweiIvPjwvc3ZnPg%3D%3D&pattern=Solid&pulls=1&stargazers=1&theme=Auto)

依然需要大家的提供更好的关于新功能的想法！如果遇到问题我很乐意解决。

问题反馈&需要帮助：直接提issue或者2543971286@qq.com 

## ✨ 功能特性

- 🚫 多样化的屏蔽选项
  - 关键字屏蔽
  - Emoji 表情屏蔽
  - 图片和表情包屏蔽
  - 群机器人屏蔽
  - 超级表情屏蔽
  - 用户屏蔽
- 📱 支持多设备配置同步（导入/导出）
- 🎨 美观的设置界面
- 🔄 实时生效的屏蔽规则（可能依然需要重启）

## 📥 安装方法

1. 下载并安装最新版本的 [LiteLoaderQQNT](https://liteloaderqqnt.github.io)
2. 在 QQ 设置中找到 LiteLoaderQQNT 的设置界面
3. 安装本插件
4. 重启 QQ 即可生效

## 🎯 使用指南

> 💡 建议：每次更新前都导出一下自己的配置！

### 基础使用

更全面的相关介绍在[elegantland.github.io](https://elegantland.github.io/)

现在插件提供了可视化的设置界面，你可以直接在设置中进行规则配置。以下是一些基本的规则添加说明：

### 添加文字屏蔽规则

直接在设置界面添加关键词即可，许多配置均支持两种匹配模式：
- 完全匹配：消息需要与规则完全一致
- 包含匹配：消息包含规则内容即可

### 添加 Emoji 屏蔽规则

1. 安装 [chii-devtools](https://github.com/mo-jinran/chii-devtools/tree/v4)
2. 按 F12 打开开发工具
3. 右键需要屏蔽的表情消息
4. 在开发工具中找到 `data-face-index` 属性
5. 将对应的表情代码添加到屏蔽规则中

### 添加图片屏蔽规则

1. 同样使用 chii-devtools
2. 对需要屏蔽的图片进行点击右键然后在开发工具中查找 `data-path` 属性
3. 复制类似 `1A930D2313002CD5A7F2572DE36F9257.jpg` 的图片 ID
4. 将 ID 添加到屏蔽规则中
5. 现在在2.0.5版本可以直接右键屏蔽了

## ⚙️ 高级功能

### 配置导入导出
在设置界面中可以方便地导入导出配置，支持多设备间的配置同步。

### 右键菜单快捷屏蔽
- 右键点击文字或图片可快速添加屏蔽规则
- 自动使用完全匹配模式
- 可在设置界面查看和管理添加的规则

## ❗ 已知问题

- 查看聊天记录时消息也会被屏蔽（底层逻辑限制，暂无解决方案）

## 🔜 开发计划

- [ ] 添加回复去除@的功能
- [ ] 提供功能开关以精简各种栏的无用功能

## 🔌 推荐插件

- [chii-devtools](https://github.com/mo-jinran/chii-devtools/tree/v4) - 开发调试工具
- [QQ禁用更新](https://github.com/xh321/LiteLoaderQQNT-Kill-Update/tree/master) - 禁止 QQ 自动更新
- [插件列表查看](https://github.com/ltxhhz/LL-plugin-list-viewer/tree/main) - 查看和管理插件
- [QQ防撤回](https://github.com/xh321/LiteLoaderQQNT-Anti-Recall/tree/master) - 防止消息被撤回
-  [MessageSave](https://github.com/elegantland/qqMessageSave) - 方便的将QQ消息保存到本地

## 📝 更新日志

### v2.0.8 (2024-12-27)
- 完美修复了没法屏蔽拍一拍的功能，默认开启。原来从2.0.6版本开始拍一拍屏蔽功能就一直有问题，于是修修补补一个月。
- 现在可以屏蔽系统消息了，指各种和你无关的进群/撤回消息以及未来的任何新的系统提示消息，当然这需要去设置里手动设置屏蔽词，公共消息屏蔽那一栏。
- 对转发消息进行优化，外面展示消息内容也会被屏蔽。
- 从这个版本开始暂缓一周打包，真急需功能可以直接替换renderer.js。

### v2.0.7 (2024-12-26)
- 右键菜单优化了文本的选取和图片新加了屏蔽某人全部图片，还有把emoji表情的具体代码实现了，右键菜单变的更好用了！
- 去掉了2.0.6版本的消息保存函数，迁移到我的新插件，欢迎体验我的新插件，假如有消息被屏蔽而你又有点想知道内容也可以在这里找到，目前还在测试中... [MessageSave](https://github.com/elegantland/qqMessageSave) 
- 添加了屏蔽拍一拍功能，然后发现某些系统信息（xxx加入了群）这类消息显示有点问题，于是一起屏蔽了，结果发现系统消息也是必要的，目前取消了系统消息的限制，如果有人需要的话后续版本可能会添加相应逻辑但不会做到设置界面里。
- 优化了代码的底层逻辑，精简了部分代码，方便后续的二次开发。
- 修正了一个manifest的错误，非常感谢PR！
  
### v2.0.5 (2024-11-29)
- ✨ 新增右键菜单功能
- 🔧 优化底层屏蔽逻辑，提升稳定性
- 🎨 支持纯文字/图片的快捷屏蔽

### v2.0.4 (2024-11-27)
- 🐛 修复设置不显示的 bug
- 🎨 优化导入导出配置界面
- ✨ 添加消息浏览过渡动画
- 🔧 解决消息划动卡顿问题

### v2.0.2 (2024-11-25)
- ✨ 新增版本号日志
- 🔧 添加回车键监听支持
- 🎨 精简默认配置和日志输出
- ✨ 新增精细化屏蔽设定
- 📥 新增配置导入导出功能

### v2.0.1 (2024-11-21)
- 🔧 重构代码，提升稳定性
- 🐛 修复各种已知问题

### v2.0.0 (2024-11-20)
- ✨ 支持夜间模式
- 🔄 重写设置界面
- 🔧 重构大量底层逻辑

### v1.0.8 (2024-11-15)
- 🐛 修复图片全部被屏蔽的 bug
- 🔧 优化屏蔽逻辑

### v1.0.6 (2024-11-15)
- ✨ 新增完全匹配和包含匹配逻辑
- 🔧 优化 emoji 屏蔽功能

### v1.0.5 (2024-11-14)
- ✨ 新增图片和超级表情支持
- 🔧 重写屏蔽词设定
- ✨ 新增 @ 识别支持
- 🎨 更新插件图标

### v1.0.2 (2024-11-11)
- ✨ 新增 emoji 支持
- 🔧 优化功能结构

### v1.0.1 (2024-11-11)
- 🎉 首次发布
