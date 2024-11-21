# qqMessageBlocker
一个用于 LiteLoaderQQNT 的消息屏蔽插件。目前QQ的唯一一个能处理消息内容的插件。支持按关键字屏蔽文字，emoji表情，图片表情包，群机器人，超级表情。觉得好用github给我点个star吧！
## 功能特性
- 支持自定义关键词屏蔽
- 支持配置多设备手动同步
- 效果图
- 
![test](https://github.com/user-attachments/assets/9eef9ed0-dccd-49f2-85b8-70f67a49058e)


## 安装方法
1. 下载最新版本的LiteLoaderQQNT插件和本插件。LiteLoaderQQNT 官网：https://liteloaderqqnt.github.io

2. 在设置里找到LiteLoaderQQNT的相关设置，从那里安装

3. 重启 QQ
## 使用方法

首先保留好你修改过后的renderer.js，那是你本地的所有屏蔽逻辑，如果使用插件自动安装可能会覆盖数据！

下面是可以稳定运行但是麻烦的办法，现在在设置界面已经有可视化的操作界面了，当然下面的办法也是完全没bug的。

1. 在设置中找到LiteLoaderQQNT选项，点击进入数据目录
   
![f643b13ae4c6129486731a2bc6ffe7cc](https://github.com/user-attachments/assets/39aab0b8-c12f-401d-82c1-d2793a516af8)

2.然后在该路径下以记事本方式打开\plugins\message_blocker\src\renderer.js

![QQ_1731315348067](https://github.com/user-attachments/assets/7fe364dc-5755-4c9c-bbc9-e6ad98498344)

3. 仿照默认的样例添加需要屏蔽的关键词（对renderer.js的修改记得使用英文逗号）

![3420a0fe6c8608ed92781cfb93d9b31f](https://github.com/user-attachments/assets/0d074c22-a066-4988-a52e-76b2a72e113c)

4. 修改后保存renderer.js，重启QQ即可生效

5.添加emoji屏蔽

首先安装chii-devtools https://github.com/mo-jinran/chii-devtools/tree/v4

然后按f12，点击新出来的窗口左上角，再点击你需要屏蔽的表情的那条信息，则右边会高亮一串代码

![image](https://github.com/user-attachments/assets/561c408d-5f0a-4e42-a1ac-5964bb293d22)


点击该代码，右键，copy，copy element即可复制该代码

![image](https://github.com/user-attachments/assets/7e896ef2-cda1-4cd6-9d7b-04bf8895ee84)

复制到记事本，CTRL+F 查找 data-face-index，后面跟的代码即是表情代码，然后打开按照上面的方法打开renderer.js进行修改即可。

修改完一样需要重启（对renderer.js的修改记得使用英文逗号）

![image](https://github.com/user-attachments/assets/dc68c1f3-482c-4248-ac31-57a46df2f299)
![image](https://github.com/user-attachments/assets/0ec10c41-751d-473b-88f3-897f8198048d)

6.添加了对图片的屏蔽

图片的id获取逻辑同上，但是CTRL+F 查找的是data-path，然后可以找到类似这样的格式

"/1A930D2313002CD5A7F2572DE36F9257.jpg"，只需要斜杠后的这一段。

7.在1.0.6新加了区分完全匹配的逻辑和包含匹配的逻辑，具体逻辑见图

![QQ_1731654303922](https://github.com/user-attachments/assets/4067e4fa-1647-4520-9954-a7917e83279c)

## 已知问题

查看聊天记录时也会被屏蔽（底层逻辑，无法解决）

需要一个导出配置的功能

## LiteLoaderQQNT插件推荐

chii-devtools https://github.com/mo-jinran/chii-devtools/tree/v4

QQ禁用更新 https://github.com/xh321/LiteLoaderQQNT-Kill-Update/tree/master

插件列表查看 https://github.com/ltxhhz/LL-plugin-list-viewer/tree/main

QQ防撤回 https://github.com/xh321/LiteLoaderQQNT-Anti-Recall/tree/master

## bug反馈以及其他问题
1.qq邮箱：2543971286@qq.com

## 更新日志

2024年11月21日15:34:00 2.0.1

上个版本实在是太不稳定了，所以又重构了一下，现在不存在任何bug（应该）

有可能某些模块功能表现不正常，如果遇到这种情况欢迎反馈。

下个版本将会继续重构代码，保持代码的简洁性（如果不是修bug的话）

2024年11月20日17:10:27 2.0.0

夜间模式（已适配），设置界面功能无效（已重构）

重写了大量逻辑。

2024年11月15日15:54:40 1.0.8

修图片全被屏蔽的bug，现在是稳定版，1.0.7也是稳定版但是修复逻辑略有不同。

2024年11月15日15:01:22 1.0.6

这个版本新加了区分完全匹配的逻辑和包含匹配的逻辑，具体逻辑见图

![QQ_1731654303922](https://github.com/user-attachments/assets/4067e4fa-1647-4520-9954-a7917e83279c)


优化了emoji的屏蔽，将会只隐藏emoji表情

2024年11月14日17:15:06 1.0.5

更新了对图片和超级表情（就是那个突然变大的表情）的支持，重写了屏蔽词设定，现在可以正常的识别@和屏蔽了！完善了代码，

不会像上个版本一样存在没处理的消息

更新了icon，将于晚上提交release

2024年11月11日18:59:20 1.0.2

更新了对emoji的支持，至此以后不再对屏蔽词设置界面的添加和删除功能做维护，新功能未使用localstorage
下个版本将会对图片进行屏蔽支持和屏蔽特定机器人的选项


2024年11月11日16:45:51 1.0.1

对设置界面进行了美化，同时修改了屏蔽词相关数据的存储方式，从localstorage到直接写入renderer.js，

这样子需要导入导出配置的话复制renderer.js就好了

同时保留原来的localstorage存储（假如你能正常使用的话），所以屏蔽词设置界面建议用作查看屏蔽词是否添加成功.
