# qqMessageBlocker
一个用于 LiteLoaderQQNT 的消息屏蔽插件。可以按关键词屏蔽你不喜欢的消息和某人的某句话冒犯了你，而你只想屏蔽这句话而不是使用QQ自带的屏蔽某人，善用此插件也可以屏蔽QQ群机器人
## 功能特性
- 支持自定义关键词屏蔽
- 支持多平台（并没有测试但应该可以）
- 效果图
- 
![test](https://github.com/user-attachments/assets/9eef9ed0-dccd-49f2-85b8-70f67a49058e)


## 安装方法
1. 下载最新版本的LiteLoaderQQNT插件和本插件。LiteLoaderQQNT 官网：https://liteloaderqqnt.github.io
3. 在设置里找到LiteLoaderQQNT的相关设置，从那里安装 
4. 重启 QQ
## 使用方法
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

复制到记事本，CTRL+F 查找 data-face-index，后面跟的代码即是表情代码，然后打开按照上面的方法打开renderer.js进行修改即可。修改完一样需要重启（对renderer.js的修改记得使用英文逗号）

![image](https://github.com/user-attachments/assets/dc68c1f3-482c-4248-ac31-57a46df2f299)
![image](https://github.com/user-attachments/assets/0ec10c41-751d-473b-88f3-897f8198048d)


## bug反馈以及其他问题
1.qq邮箱：2543971286@qq.com

## 更新日志
2024年11月11日18:59:20 1.0.2

更新了对emoji的支持，至此以后不再对屏蔽词设置界面的添加和删除功能做维护，新功能未使用localstorage
下个版本将会对图片进行屏蔽支持和开启屏蔽所有机器人的选项，机器人将只有全屏蔽选项


2024年11月11日16:45:51 1.0.1

对设置界面进行了美化，同时修改了屏蔽词相关数据的存储方式，从localstorage到直接写入renderer.js，这样子需要导入导出配置的话复制renderer.js就好了
同时保留原来的localstorage存储（假如你能正常使用的话），所以屏蔽词设置界面建议用作查看屏蔽词是否添加成功.
