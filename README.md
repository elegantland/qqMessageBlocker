![qqMessageBlocker](https://socialify.git.ci/elegantland/qqMessageBlocker/image?description=1&forks=1&issues=1&language=1&name=1&stargazers=1&theme=Light)
一个LiteLoaderQQNT 插件，依然需要大家的提供更好的关于新功能的想法！如果遇到问题我很乐意解决。

问题反馈&需要帮助：直接提issue或者2543971286@qq.com 

## ✨ 功能特性

- 🚫 多样化的屏蔽选项
  - 关键字屏蔽
  - Emoji 表情屏蔽
  - 图片屏蔽和表情包屏蔽
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
- 现在在2.0.5之后的版本可以直接右键屏蔽了

### 添加 Emoji 屏蔽规则

1. 安装 [chii-devtools](https://github.com/mo-jinran/chii-devtools/tree/v4)
2. 按 F12 打开开发工具
3. 右键需要屏蔽的表情消息
4. 在开发工具中找到 `data-face-index` 属性
5. 将对应的表情代码添加到屏蔽规则中
6. 现在在2.0.5之后的版本可以直接右键屏蔽了

### 添加图片屏蔽规则

1. 同样使用 chii-devtools
2. 对需要屏蔽的图片进行点击右键然后在开发工具中查找 `data-path` 属性
3. 复制类似 `1A930D2313002CD5A7F2572DE36F9257.jpg` 的图片 ID
4. 将 ID 添加到屏蔽规则中
5. 现在在2.0.5之后的版本可以直接右键屏蔽了

## ⚙️ 高级功能

### 配置导入导出
在设置界面中可以方便地导入导出配置，支持多设备间的配置同步。

### 右键菜单快捷屏蔽
- 右键点击文字或图片可快速添加屏蔽规则
- 自动使用完全匹配模式
- 可在设置界面查看和管理添加的规则

## ❗ 已知问题

- 查看聊天记录时消息也会被屏蔽（底层逻辑限制，暂无解决方案，但是你可以使用MessageSave来查看历史消息）

## 🔌 推荐插件

- [chii-devtools](https://github.com/mo-jinran/chii-devtools/tree/v4) - 开发调试工具
- [QQ禁用更新](https://github.com/xh321/LiteLoaderQQNT-Kill-Update/tree/master) - 禁止 QQ 自动更新
- [插件列表查看](https://github.com/ltxhhz/LL-plugin-list-viewer/tree/main) - 查看和管理插件
- [QQ防撤回](https://github.com/xh321/LiteLoaderQQNT-Anti-Recall/tree/master) - 防止消息被撤回
-  [MessageSave](https://github.com/elegantland/qqMessageSave) - 方便的将QQ消息保存到本地

