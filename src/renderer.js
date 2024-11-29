(function () {
    // 包含匹配屏蔽词列表2.0.5版
    let INCLUDES_BLOCKED_WORDS = [
        '测试111',//会屏蔽 测试111 ，也会屏蔽测试111111
        //'@AL_1S',
        //'@幻想',
    ];
    // 完全匹配屏蔽词列表
    let EXACT_BLOCKED_WORDS = [
        //'测试222',//只会屏蔽 测试222 ，而不会屏蔽测试22222222
        //'6',
        //'？',
    ];
    // 包含匹配特殊屏蔽用户配置
    let INCLUDES_SPECIAL_BLOCKED_USERS = {
        //'AL_1S': ['',],
        //'幻想': ['',],
    
    };
    // 完全匹配特殊屏蔽用户配置
    let EXACT_SPECIAL_BLOCKED_USERS = {
        //'儒雅': ['测试444'],
    };
    // 包含匹配屏蔽表情ID
    let INCLUDES_BLOCKED_EMOJIS = [99999];  // 默认屏蔽的表情ID
    //以滑稽表情和暴筋表情为例子
    //const INCLUDES_BLOCKED_EMOJIS = [178,146];
    
    // 屏蔽人对应的表情ID
    let INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = {
        //'儒雅': [99999,66666],
        //'儒雅1': [55555],
        //以滑稽表情和暴筋表情为例子
        //'儒雅' = [178，146];
    }; 
    // 在默认配置中添加需要屏蔽的图片特征
    let INCLUDES_BLOCKED_IMAGES = [
        //'76264f7279cd8e5e2d2c597fa68da8a2.jpg',
        //'99205df846cac4d7d680997a0ed56a88.jpg',
        //'bae9b15fd28f626c6b08d01188dfb604.gif',
    
        // 可以添加更多需要屏蔽的图片特征
    ];
    let MSG_ID_BLOCK_CONFIG = {
        // 是否启用 超级表情 屏蔽功能,默认true启用，关闭用false
        enabled: true
    };
    let REPLACEMODE = {
        normalWords: false,      // 普通屏蔽词是否使用替换模式
        exactWords: false,       // 完全匹配屏蔽词是否使用替换模式
        specialUsers: false,     // 特殊用户屏蔽词是否使用替换模式
        exactSpecialUsers: false,// 特殊用户完全匹配是否使用替换模式
        emojis: false,         // 表情是否使用替换模式
        images: false,         // 图片是否使用替换模式
        superEmoji: false,      // 超级表情是否使用替换模式
        replaceword: "[已屏蔽]"
    };
        // Toast 通知管理类
        class Toast {
            static instance = null;
    
            constructor() {
                if (Toast.instance) {
                    return Toast.instance;
                }
                Toast.instance = this;
                this.initStyles();
            }
    
            initStyles() {
                const style = document.createElement('style');
                style.textContent = `
                    .message-blocker-toast {
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%) translateY(100px);
                        padding: 12px 24px;
                        border-radius: 8px;
                        color: #ffffff;
                        font-size: 14px;
                        font-weight: 500;
                        opacity: 0;
                        transition: all 0.3s ease-in-out;
                        z-index: 9999;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    }
    
                    .message-blocker-toast.success {
                        background-color: #52c41a;
                    }
    
                    .message-blocker-toast.error {
                        background-color: #ff4d4f;
                    }
    
                    .message-blocker-toast.show {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }

                    /* 添加新的样式 */
                    .msg-content-container, 
                    .message-container, 
                    .mix-message__container {
                        opacity: 0;
                        transition: opacity 0.1s ease-in-out;
                    }

                    .msg-content-container.visible, 
                    .message-container.visible, 
                    .mix-message__container.visible {
                        opacity: 1;
                    }
                `;
                document.head.appendChild(style);
            }
    
            show(message, type = 'success') {
                const toast = document.createElement('div');
                toast.className = `message-blocker-toast ${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
    
                setTimeout(() => toast.classList.add('show'), 100);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => document.body.removeChild(toast), 300);
                }, 3000);
            }
        }
    
        // 创建Toast单例并设置showToast函数
        const toastInstance = new Toast();
        function showToast(message, type = 'success') {
            toastInstance.show(message, type);
        }
    
        // 屏蔽词管理类
        class BlockedWordsManager {
            constructor() {
                this.blockedWords = new Set();
                this.exactBlockedWords = new Set();
                this.specialBlockedUsers = {};
                this.exactSpecialBlockedUsers = {};
                this.blockedEmojis = new Set();
                this.specialBlockedUsersEmojis = {};
                this.blockedImages = new Set();
                this.blockSuperEmoji = MSG_ID_BLOCK_CONFIG.enabled;
                
                // 初始化默认配置
                this.defaultConfig = {
                    blockedWords: INCLUDES_BLOCKED_WORDS,
                    exactBlockedWords: EXACT_BLOCKED_WORDS,
                    specialBlockedUsers: INCLUDES_SPECIAL_BLOCKED_USERS,
                    exactSpecialBlockedUsers: EXACT_SPECIAL_BLOCKED_USERS,
                    blockedEmojis: INCLUDES_BLOCKED_EMOJIS,
                    specialBlockedUsersEmojis: INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS,
                    blockedImages: INCLUDES_BLOCKED_IMAGES,
                    blockSuperEmoji: MSG_ID_BLOCK_CONFIG.enabled
                };
    
                // 加载配置
                this.loadAllData();
    
                // 监听窗口焦点事件，用于在QQ重启后重新加载配置
                window.addEventListener('focus', () => {
                    this.loadAllData();
                });
            }
    
            // 加载所有数据
            async loadAllData() {
                try {
                    // 使用 LiteLoader API 加载配置，使用默认配置作为基础
                    const config = await LiteLoader.api.config.get("message_blocker", this.defaultConfig);
    
                    // 清空当前数据
                    this.blockedWords.clear();
                    this.exactBlockedWords.clear();
                    this.blockedEmojis.clear();
                    this.blockedImages.clear();
    
                    // 加载普通屏蔽词配置
                    if (Array.isArray(config.blockedWords)) {
                        config.blockedWords.forEach(word => {
                            if (word && typeof word === 'string') {
                                this.blockedWords.add(word.trim());
                            }
                        });
                    }
                    // 合并默认的普通屏蔽词配置
                    INCLUDES_BLOCKED_WORDS.forEach(word => {
                        if (word && typeof word === 'string') {
                            this.blockedWords.add(word.trim());
                        }
                    });
    
                    // 加载完全匹配屏蔽词配置
                    if (Array.isArray(config.exactBlockedWords)) {
                        config.exactBlockedWords.forEach(word => {
                            if (word && typeof word === 'string') {
                                this.exactBlockedWords.add(word.trim());
                            }
                        });
                    }
                    // 合并默认的完全匹配屏蔽词配置
                    EXACT_BLOCKED_WORDS.forEach(word => {
                        if (word && typeof word === 'string') {
                            this.exactBlockedWords.add(word.trim());
                        }
                    });
    
                    // 合并默认配置和用户配置的特殊用户配置
                    this.specialBlockedUsers = { ...INCLUDES_SPECIAL_BLOCKED_USERS };
                    if (config.specialBlockedUsers) {
                        Object.entries(config.specialBlockedUsers).forEach(([userId, keywords]) => {
                            if (!this.specialBlockedUsers[userId]) {
                                this.specialBlockedUsers[userId] = [];
                            }
                            if (Array.isArray(keywords)) {
                                keywords.forEach(keyword => {
                                    if (!this.specialBlockedUsers[userId].includes(keyword)) {
                                        this.specialBlockedUsers[userId].push(keyword);
                                    }
                                });
                            }
                        });
                    }
    
                    // 合并默认配置和用户配置的完全匹配特殊用户配置
                    this.exactSpecialBlockedUsers = { ...EXACT_SPECIAL_BLOCKED_USERS };
                    if (config.exactSpecialBlockedUsers) {
                        Object.entries(config.exactSpecialBlockedUsers).forEach(([userId, keywords]) => {
                            if (!this.exactSpecialBlockedUsers[userId]) {
                                this.exactSpecialBlockedUsers[userId] = [];
                            }
                            if (Array.isArray(keywords)) {
                                keywords.forEach(keyword => {
                                    if (!this.exactSpecialBlockedUsers[userId].includes(keyword)) {
                                        this.exactSpecialBlockedUsers[userId].push(keyword);
                                    }
                                });
                            }
                        });
                    }
    
                    // 加载表情屏蔽配置
                    if (Array.isArray(config.blockedEmojis)) {
                        config.blockedEmojis.forEach(id => {
                            const numId = Number(id);
                            if (!isNaN(numId)) {
                                this.blockedEmojis.add(numId);
                            }
                        });
                    }
                    // 合并默认的表情屏蔽配置
                    INCLUDES_BLOCKED_EMOJIS.forEach(id => {
                        const numId = Number(id);
                        if (!isNaN(numId)) {
                            this.blockedEmojis.add(numId);
                        }
                    });
    
                    // 合并默认配置和用户配置的特殊用户表情配置
                    this.specialBlockedUsersEmojis = { ...INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS };
                    if (config.specialBlockedUsersEmojis) {
                        Object.entries(config.specialBlockedUsersEmojis).forEach(([userId, emojiIds]) => {
                            if (!this.specialBlockedUsersEmojis[userId]) {
                                this.specialBlockedUsersEmojis[userId] = [];
                            }
                            if (Array.isArray(emojiIds)) {
                                emojiIds.forEach(id => {
                                    const numId = Number(id);
                                    if (!isNaN(numId) && !this.specialBlockedUsersEmojis[userId].includes(numId)) {
                                        this.specialBlockedUsersEmojis[userId].push(numId);
                                    }
                                });
                            }
                        });
                    }
                    // 加载图片屏蔽配置
                    if (Array.isArray(config.blockedImages)) {
                        config.blockedImages.forEach(pattern => {
                            if (pattern && typeof pattern === 'string') {
                                this.blockedImages.add(pattern.trim());
                            }
                        });
                    }
                    // 合并默认的图片屏蔽配置
                    INCLUDES_BLOCKED_IMAGES.forEach(pattern => {
                        if (pattern && typeof pattern === 'string') {
                            this.blockedImages.add(pattern.trim());
                        }
                    });
    
                    // 加载超级表情屏蔽配置
                    if (typeof config.blockSuperEmoji === 'boolean') {
                        this.blockSuperEmoji = config.blockSuperEmoji;
                    } else {
                        // 如果没有用户配置，使用默认配置
                        this.blockSuperEmoji = MSG_ID_BLOCK_CONFIG.enabled;
                    }
    
                    // 更新全局变量
                    INCLUDES_BLOCKED_WORDS = Array.from(this.blockedWords);
                    EXACT_BLOCKED_WORDS = Array.from(this.exactBlockedWords);
                    INCLUDES_SPECIAL_BLOCKED_USERS = { ...this.specialBlockedUsers };
                    EXACT_SPECIAL_BLOCKED_USERS = { ...this.exactSpecialBlockedUsers };
                    INCLUDES_BLOCKED_EMOJIS = Array.from(this.blockedEmojis);
                    INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = { ...this.specialBlockedUsersEmojis };
                    INCLUDES_BLOCKED_IMAGES = Array.from(this.blockedImages);
                    MSG_ID_BLOCK_CONFIG.enabled = this.blockSuperEmoji;
    
                    // 更新UI
                    messageBlocker.renderWordsList();
                    messageBlocker.renderSpecialUsersList();
                    messageBlocker.renderEmojisList();
                    messageBlocker.renderSpecialEmojisList();
                    messageBlocker.renderBlockedImagesList();
                } catch (error) {
                    console.error('[Message Blocker] 加载配置时出错:', error);
                }
            }
    
            // 保存所有数据
            async saveAllData() {
                try {
                    // 更新全局变量
                    INCLUDES_BLOCKED_WORDS = Array.from(this.blockedWords);
                    EXACT_BLOCKED_WORDS = Array.from(this.exactBlockedWords);
                    INCLUDES_SPECIAL_BLOCKED_USERS = { ...this.specialBlockedUsers };
                    EXACT_SPECIAL_BLOCKED_USERS = { ...this.exactSpecialBlockedUsers };
                    INCLUDES_BLOCKED_EMOJIS = Array.from(this.blockedEmojis);
                    INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = { ...this.specialBlockedUsersEmojis };
                    INCLUDES_BLOCKED_IMAGES = Array.from(this.blockedImages);
                    MSG_ID_BLOCK_CONFIG.enabled = this.blockSuperEmoji;
    
                    const dataToSave = {
                        blockedWords: Array.from(this.blockedWords),
                        exactBlockedWords: Array.from(this.exactBlockedWords),
                        specialBlockedUsers: this.specialBlockedUsers,
                        exactSpecialBlockedUsers: this.exactSpecialBlockedUsers,
                        blockedEmojis: Array.from(this.blockedEmojis),
                        specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                        blockedImages: Array.from(this.blockedImages),
                        blockSuperEmoji: this.blockSuperEmoji
                    };
    
                    // 使用 LiteLoader API 保存配置
                    await LiteLoader.api.config.set("message_blocker", dataToSave);
                    console.log('配置已保存:', dataToSave);
                } catch (error) {
                    console.error('保存配置时出错:', error);
                    showToast('保存配置失败', 'error');
                }
            }
    
            // 添加普通屏蔽词
            addBlockedWord(word) {
                if (this.blockedWords.has(word)) {
                    return false;
                }
                this.blockedWords.add(word);
                this.saveAllData();
                return true;
            }
    
            // 添加完全匹配屏蔽词
            addExactBlockedWord(word) {
                if (this.exactBlockedWords.has(word)) {
                    return false;
                }
                this.exactBlockedWords.add(word);
                this.saveAllData();
                return true;
            }
    
            // 删除普通屏蔽词
            removeBlockedWord(word) {
                if (!this.blockedWords.has(word)) {
                    return false;
                }
                this.blockedWords.delete(word);
                this.saveAllData();
                return true;
            }
    
            // 删除完全匹配屏蔽词
            removeExactBlockedWord(word) {
                if (!this.exactBlockedWords.has(word)) {
                    return false;
                }
                this.exactBlockedWords.delete(word);
                this.saveAllData();
                return true;
            }
    
            // 获取所有普通屏蔽词
            getBlockedWords() {
                return Array.from(this.blockedWords);
            }
    
            // 获取所有完全匹配屏蔽词
            getExactBlockedWords() {
                return Array.from(this.exactBlockedWords);
            }
    
            // 检查消息是否应该被屏蔽
            isMessageBlocked(element, username, message, emojiIds) {
                if (!message && !emojiIds) return false;

                // 检查普通屏蔽词
                if (message) {
                    for (const word of this.blockedWords) {
                        if (message.includes(word)) {
                            return true;
                        }
                    }
                }

                // 检查完全匹配屏蔽词
                if (message && this.exactBlockedWords.has(message)) {
                    return true;
                }

                // 检查特殊用户屏蔽词
                if (username && message) {
                    const userBlockedWords = this.specialBlockedUsers[username];
                    if (userBlockedWords) {
                        for (const word of userBlockedWords) {
                            if (message.includes(word)) {
                                return true;
                            }
                        }
                    }
                }

                // 检查特殊用户完全匹配屏蔽词
                if (username && message) {
                    const userExactBlockedWords = this.exactSpecialBlockedUsers[username];
                    if (userExactBlockedWords && userExactBlockedWords.includes(message)) {
                        return true;
                    }
                }

                // 检查表情
                if (emojiIds && emojiIds.length > 0) {
                    // 检查全局屏蔽的表情
                    for (const emojiId of emojiIds) {
                        if (this.blockedEmojis.has(emojiId)) {
                            return true;
                        }
                    }

                    // 检查特定用户表情屏蔽
                    if (username && this.specialBlockedUsersEmojis[username]) {
                        for (const emojiId of emojiIds) {
                            if (this.specialBlockedUsersEmojis[username].includes(emojiId)) {
                                return true;
                            }
                        }
                    }
                }

                // 检查图片
                const images = element.querySelectorAll('img.image-element');
                if (images.length > 0) {
                    for (const img of images) {
                        const src = img.src;
                        const fileName = src.split('/').pop();
                        if (this.blockedImages.has(fileName)) {
                            return true;
                        }
                    }
                }

                return false;
            }
    
            extractUsername(element) {
                try {
                    // 首先尝试从父元素获取消息容器
                    let rootMessageContainer = element;
                    while (rootMessageContainer && !rootMessageContainer.classList.contains('message-container')) {
                        rootMessageContainer = rootMessageContainer.parentElement;
                    }
    
                    if (!rootMessageContainer) {
                        return '';
                    }
    
                    // 方法1：从avatar-span的aria-label属性获取
                    const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                    if (avatarSpan) {
                        const username = avatarSpan.getAttribute('aria-label');
                        if (username) {
                            return username;
                        }
                    }
    
                    // 方法2：从用户名显示区域获取
                    const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                    if (userNameElement) {
                        const username = userNameElement.textContent.trim();
                        if (username) {
                            return username;
                        }
                    }
    
                    // 方法3：从任意带有用户名的span获取
                    const allSpans = rootMessageContainer.getElementsByTagName('span');
                    for (const span of allSpans) {
                        const text = span.textContent.trim();
                        // 检查span的内容是否与用户名匹配
                        if (text && text.length > 0 && text.length < 30) {  // 用户名不太可能超过30个字符
                            // 检查是否在特殊用户列表中
                            if (text in INCLUDES_SPECIAL_BLOCKED_USERS ||
                                text in EXACT_SPECIAL_BLOCKED_USERS ||
                                text in this.specialBlockedUsers ||
                                text in this.exactSpecialBlockedUsers) {
                                return text;
                            }
                        }
                    }
    
                    return '';
                } catch (error) {
                    console.error('获取用户名时出错:', error);
                    return '';
                }
            }
            // 检查表情是否被屏蔽
            checkEmojiBlocked(emojiIds, username) {
                if (!emojiIds || emojiIds.length === 0) return false;
    
                // 将输入的emojiIds转换为数字类型
                const numericEmojiIds = emojiIds.map(id => Number(id));
    
                // 检查全局屏蔽的表情
                const isGlobalBlocked = numericEmojiIds.some(id => {
                    const isBlocked = this.blockedEmojis.has(id);
                    return isBlocked;
                });
    
                // 检查特定用户屏蔽的表情
                const isUserSpecificBlocked = username && this.specialBlockedUsersEmojis[username] &&
                    numericEmojiIds.some(id => {
                        const isBlocked = this.specialBlockedUsersEmojis[username].includes(id);
                        return isBlocked;
                    });
    
                const isBlocked = isGlobalBlocked || isUserSpecificBlocked;
    
                return isBlocked;
            }
    
            // 检查图片是否被屏蔽
            isBlockedImage(element) {
                if (!element || !this.blockedImages) return false;

                // 查找图片元素
                const imgElements = element.querySelectorAll('img, .image');
                if (!imgElements || imgElements.length === 0) return false;

                // 检查每个图片是否在屏蔽列表中
                for (const img of imgElements) {
                    // 获取所有可能包含图片路径的属性
                    const paths = [
                        img.src,
                        img.getAttribute('src'),
                        img.getAttribute('data-src'),
                        img.getAttribute('data-path')
                    ].filter(Boolean);

                    // 检查每个路径
                    for (const path of paths) {
                        // 从路径中提取文件名
                        const match = path.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
                        if (match) {
                            const fileName = match[0];
                            if (this.blockedImages.has(fileName)) {
                                return true;
                            }
                        }
                    }
                }

                return false;
            }
    
            // 添加被屏蔽的图片
            addBlockedImage(imageFileName) {
                if (!imageFileName) {
                    showToast('图片文件名不能为空', 'error');
                    return false;
                }
    
                if (this.blockedImages.has(imageFileName)) {
                    showToast('该图片已在屏蔽列表中', 'error');
                    return false;
                }
    
                this.blockedImages.add(imageFileName);
                this.saveAllData(); // 立即保存到 localStorage
                showToast('添加图片屏蔽成功', 'success');
                return true;
            }
    
            // 移除被屏蔽的图片
            removeBlockedImage(imageFileName) {
                if (this.blockedImages.has(imageFileName)) {
                    this.blockedImages.delete(imageFileName);
                    this.saveAllData();
                    return true;
                }
                return false;
            }
    
            // 添加表情屏蔽
            addBlockedEmoji(emojiId) {
                if (!emojiId) {
                    showToast('请输入要屏蔽的表情ID', 'error');
                    return false;
                }
    
                const trimmedId = emojiId.trim();
                // 检查是否为纯数字
                if (isNaN(Number(trimmedId))) {
                    showToast('表情ID必须是纯数字', 'error');
                    return false;
                }
    
                const numericId = Number(trimmedId);
                if (this.blockedEmojis.has(numericId)) {
                    showToast('该表情ID已存在', 'error');
                    return false;
                }
    
                this.blockedEmojis.add(numericId);
                this.saveAllData();
                showToast('表情屏蔽添加成功', 'success');
                return true;
            }
    
            // 删除表情屏蔽
            deleteEmoji(emojiId) {
                const numEmojiId = Number(emojiId);
                if (this.blockedEmojis.has(numEmojiId)) {
                    this.blockedEmojis.delete(numEmojiId);
                    this.saveAllData();
                    return true;
                }
                return false;
            }
    
            // 添加特殊用户屏蔽
            addSpecialBlockedUser(username, keywords) {
                if (!this.specialBlockedUsers[username]) {
                    this.specialBlockedUsers[username] = [];
                }
                keywords.forEach(keyword => {
                    if (!this.specialBlockedUsers[username].includes(keyword)) {
                        this.specialBlockedUsers[username].push(keyword);
                    }
                });
                this.saveAllData();
                return true;
            }
    
            // 移除特殊用户屏蔽
            removeSpecialBlockedUser(username) {
                if (this.specialBlockedUsers[username]) {
                    delete this.specialBlockedUsers[username];
                    this.saveAllData();
                    return true;
                }
                return false;
            }
    
            // 添加特定用户表情屏蔽
            addSpecialUserEmoji(username, emojiId) {
                if (!username || !emojiId) {
                    showToast('用户名和表情ID不能为空', 'error');
                    return false;
                }
    
                // 转换为数字类型
                const numEmojiId = Number(emojiId);
                if (isNaN(numEmojiId)) {
                    showToast('表情ID必须是数字', 'error');
                    return false;
                }
    
                // 初始化用户的表情列表（如果不存在）
                if (!this.specialBlockedUsersEmojis[username]) {
                    this.specialBlockedUsersEmojis[username] = [];
                }
    
                // 检查是否已存在
                if (this.specialBlockedUsersEmojis[username].includes(numEmojiId)) {
                    showToast('该用户已存在相同的表情屏蔽', 'error');
                    return false;
                }
    
                // 添加表情ID
                this.specialBlockedUsersEmojis[username].push(numEmojiId);
    
                // 保存数据
                this.saveAllData();
    
                return true;
            }
    
            // 删除特定用户表情屏蔽
            deleteSpecialUserEmoji(username) {
                if (this.specialBlockedUsersEmojis[username]) {
                    delete this.specialBlockedUsersEmojis[username];
                    this.saveAllData();
                    return true;
                }
                return false;
            }
    
            // 渲染特定用户表情列表
            renderSpecialEmojisList() {
                const specialEmojisList = document.getElementById('specialEmojisList');
                if (!specialEmojisList) return;
    
                const specialEmojisHtml = Object.entries(this.specialBlockedUsersEmojis)
                    .map(([username, emojiIds]) => {
                        if (!emojiIds || emojiIds.length === 0) return '';
    
                        return `
                            <div class="settings-list-item">
                                <div>
                                    <div>用户: ${username}</div>
                                    <div class="text-secondary">屏蔽表情: ${Array.from(emojiIds).join(', ')}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUserEmoji('${username}')">删除</button>
                            </div>
                        `;
                    })
                    .filter(html => html) // 过滤掉空字符串
                    .join('');
    
                specialEmojisList.innerHTML = specialEmojisHtml || '<div class="settings-list-item">暂无特定用户表情屏蔽配置</div>';
            }
    
            // 保存所有数据到配置
            saveAllData() {
                try {
                    // 更新全局变量
                    INCLUDES_BLOCKED_WORDS = Array.from(this.blockedWords);
                    EXACT_BLOCKED_WORDS = Array.from(this.exactBlockedWords);
                    INCLUDES_SPECIAL_BLOCKED_USERS = { ...this.specialBlockedUsers };
                    EXACT_SPECIAL_BLOCKED_USERS = { ...this.exactSpecialBlockedUsers };
                    INCLUDES_BLOCKED_EMOJIS = Array.from(this.blockedEmojis);
                    INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = { ...this.specialBlockedUsersEmojis };
                    INCLUDES_BLOCKED_IMAGES = Array.from(this.blockedImages);
                    MSG_ID_BLOCK_CONFIG.enabled = this.blockSuperEmoji;
    
                    const dataToSave = {
                        blockedWords: Array.from(this.blockedWords),
                        exactBlockedWords: Array.from(this.exactBlockedWords),
                        specialBlockedUsers: this.specialBlockedUsers,
                        exactSpecialBlockedUsers: this.exactSpecialBlockedUsers,
                        blockedEmojis: Array.from(this.blockedEmojis),
                        specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                        blockedImages: Array.from(this.blockedImages),
                        blockSuperEmoji: this.blockSuperEmoji
                    };
    
                    // 使用 LiteLoader API 保存配置
                    LiteLoader.api.config.set("message_blocker", dataToSave);
                    console.log('配置已保存:', dataToSave);
                } catch (error) {
                    console.error('保存配置时出错:', error);
                    showToast('保存配置失败', 'error');
                }
            }
    
            // 导出配置到文件
            exportConfig() {
                try {
                    const config = {
                        blockedWords: Array.from(this.blockedWords),
                        exactBlockedWords: Array.from(this.exactBlockedWords),
                        specialBlockedUsers: this.specialBlockedUsers,
                        exactSpecialBlockedUsers: this.exactSpecialBlockedUsers,
                        blockedEmojis: Array.from(this.blockedEmojis),
                        specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                        blockedImages: Array.from(this.blockedImages),
                        blockSuperEmoji: this.blockSuperEmoji
                    };

                    const jsonString = JSON.stringify(config, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'message_blocker_config.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    
                    showToast('配置导出成功', 'success');
                } catch (error) {
                    console.error('导出配置时出错:', error);
                    showToast('配置导出失败', 'error');
                }
            }
            
            // 从文件导入配置
            importConfig(file) {
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const config = JSON.parse(e.target.result);
                            
                            // 验证配置格式
                            if (!config || typeof config !== 'object') {
                                throw new Error('无效的配置文件格式');
                            }

                            // 清空现有配置
                            this.blockedWords.clear();
                            this.exactBlockedWords.clear();
                            this.blockedEmojis.clear();
                            this.blockedImages.clear();
                            this.specialBlockedUsers = {};
                            this.exactSpecialBlockedUsers = {};
                            this.specialBlockedUsersEmojis = {};

                            // 导入新配置
                            if (Array.isArray(config.blockedWords)) {
                                config.blockedWords.forEach(word => this.blockedWords.add(word));
                            }
                            if (Array.isArray(config.exactBlockedWords)) {
                                config.exactBlockedWords.forEach(word => this.exactBlockedWords.add(word));
                            }
                            if (Array.isArray(config.blockedEmojis)) {
                                config.blockedEmojis.forEach(id => this.blockedEmojis.add(Number(id)));
                            }
                            if (Array.isArray(config.blockedImages)) {
                                config.blockedImages.forEach(image => this.blockedImages.add(image));
                            }
                            if (config.specialBlockedUsers) {
                                this.specialBlockedUsers = { ...config.specialBlockedUsers };
                            }
                            if (config.exactSpecialBlockedUsers) {
                                this.exactSpecialBlockedUsers = { ...config.exactSpecialBlockedUsers };
                            }
                            if (config.specialBlockedUsersEmojis) {
                                this.specialBlockedUsersEmojis = { ...config.specialBlockedUsersEmojis };
                            }
                            if (typeof config.blockSuperEmoji === 'boolean') {
                                this.blockSuperEmoji = config.blockSuperEmoji;
                            }

                            // 保存并更新UI
                            await this.saveAllData();
                            messageBlocker.renderWordsList();
                            messageBlocker.renderSpecialUsersList();
                            messageBlocker.renderEmojisList();
                            messageBlocker.renderSpecialEmojisList();
                            messageBlocker.renderBlockedImagesList();

                            showToast('配置导入成功', 'success');
                        } catch (error) {
                            console.error('解析配置文件时出错:', error);
                            showToast('配置文件格式错误', 'error');
                        }
                    };
                    reader.readAsText(file);
                } catch (error) {
                    console.error('导入配置时出错:', error);
                    showToast('配置导入失败', 'error');
                }
            }
        }
        class MessageBlocker {
            constructor() {
                this.targetSelector = 'div.msg-content-container, div.message-container, .message-container, .mix-message__container';
                this.blockedWordsManager = new BlockedWordsManager();
                this.settingsContainer = null;
                this.initialized = false;
                this.targetEvent = null;
                this.init();
                this.setupUI();
                this.initMenuStyles();
            }

            initMenuStyles() {
                const style = document.createElement('style');
                style.textContent = `
                    .q-context-menu-item.blocker-menu-item {
                        display: flex;
                        align-items: center;
                        padding: 5px 8px;
                        cursor: pointer;
                        color: var(--text_primary);
                        font-size: 13px;
                        line-height: 18px;
                        position: relative;
                        min-width: 128px;
                    }

                    .q-context-menu-item.blocker-menu-item:hover {
                        background: rgba(0, 0, 0, 0.06);
                    }

                    .theme-dark .q-context-menu-item.blocker-menu-item:hover {
                        background: rgba(255, 255, 255, 0.08);
                    }

                    .q-context-menu-item__content {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        gap: 4px;
                    }

                    .q-context-menu-item.blocker-menu-item .q-icon {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 14px;
                        height: 14px;
                        flex-shrink: 0;
                        opacity: 0.6;
                    }

                    .q-context-menu-item.blocker-menu-item .q-icon svg {
                        width: 13px;
                        height: 13px;
                    }
                    .q-context-menu-item.blocker-menu-item .q-context-menu-item__text {
                        flex: 1;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        margin-top: 1px;
                    }

                    .q-context-menu-separator.blocker-menu-item {
                        height: 1px;
                        margin: 4px 8px;
                        background: rgba(0, 0, 0, 0.08);
                    }

                    .theme-dark .q-context-menu-separator.blocker-menu-item {
                        background: rgba(255, 255, 255, 0.1);
                    }
                `;
                document.head.appendChild(style);
            }
    
            init() {
                this.processExistingElements();
                this.setupObserver();
                this.setupContextMenu();
                this.initialized = true;
            }
            processExistingElements() {
                try {
                    const elements = document.querySelectorAll(this.targetSelector);
                    elements.forEach(element => {
                        // 先隐藏元素
                        element.style.opacity = '0';
                        
                        // 处理内容
                        const isBlocked = this.replaceContent(element);
                        
                        // 如果内容没有被屏蔽，显示元素
                        if (!isBlocked) {
                            requestAnimationFrame(() => {
                                element.style.opacity = '1';
                            });
                        }
                    });
                } catch (error) {
                    console.error('Error in processExistingElements:', error);
                }
            }
    
            setupObserver() {
                const config = { childList: true, subtree: true };
                const observer = new MutationObserver((mutations) => {
                    for (const mutation of mutations) {
                        if (mutation.type === 'childList') {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    const elements = node.matches(this.targetSelector) 
                                        ? [node] 
                                        : Array.from(node.querySelectorAll(this.targetSelector));
                                    
                                    elements.forEach(element => {
                                        // 先隐藏元素
                                        element.style.opacity = '0';
                                        
                                        // 处理内容
                                        const isBlocked = this.replaceContent(element);
                                        
                                        // 如果内容没有被屏蔽，显示元素
                                        if (!isBlocked) {
                                            requestAnimationFrame(() => {
                                                element.style.opacity = '1';
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }
                });

                observer.observe(document.body, config);
            }

            replaceContent(element) {
                try {
                    const username = this.extractUsername(element);
                    const message = this.getMessageContent(element);
                    const emojiElements = element.querySelectorAll('.qqemoji, .emoji');
                    const emojiIds = Array.from(emojiElements).map(emoji => {
                        const src = emoji.src || emoji.getAttribute('src');
                        return src ? src.match(/(\d+)/)?.[1] : null;
                    }).filter(Boolean);

                    // 检查是否应该屏蔽消息（包括文本、表情和图片）
                    const shouldBlock = 
                        this.blockedWordsManager.isMessageBlocked(element, username, message, emojiIds) ||
                        this.blockedWordsManager.isBlockedImage(element);

                    if (shouldBlock) {
                        if (REPLACEMODE.normalWords || REPLACEMODE.exactWords || 
                            REPLACEMODE.specialUsers || REPLACEMODE.exactSpecialUsers || 
                            REPLACEMODE.emojis || REPLACEMODE.images || 
                            REPLACEMODE.superEmoji) {
                            element.textContent = REPLACEMODE.replaceword;
                        } else {
                            element.style.display = 'none';
                        }
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Error in replaceContent:', error);
                    return false;
                }
            }

            extractUsername(element) {
                try {
                    // 首先尝试从父元素获取消息容器
                    let rootMessageContainer = element;
                    while (rootMessageContainer && !rootMessageContainer.classList.contains('message-container')) {
                        rootMessageContainer = rootMessageContainer.parentElement;
                    }
    
                    if (!rootMessageContainer) {
                        return '';
                    }
    
                    // 方法1：从avatar-span的aria-label属性获取
                    const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                    if (avatarSpan) {
                        const username = avatarSpan.getAttribute('aria-label');
                        if (username) {
                            return username;
                        }
                    }
    
                    // 方法2：从用户名显示区域获取
                    const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                    if (userNameElement) {
                        const username = userNameElement.textContent.trim();
                        if (username) {
                            return username;
                        }
                    }
    
                    // 方法3：从任意带有用户名的span获取
                    const allSpans = rootMessageContainer.getElementsByTagName('span');
                    for (const span of allSpans) {
                        const text = span.textContent.trim();
                        // 检查span的内容是否与用户名匹配
                        if (text && text.length > 0 && text.length < 30) {  // 用户名不太可能超过30个字符
                            // 检查是否在特殊用户列表中
                            if (text in INCLUDES_SPECIAL_BLOCKED_USERS ||
                                text in EXACT_SPECIAL_BLOCKED_USERS ||
                                text in this.blockedWordsManager.specialBlockedUsers ||
                                text in this.blockedWordsManager.exactSpecialBlockedUsers) {
                                return text;
                            }
                        }
                    }
    
                    return '';
                } catch (error) {
                    console.error('获取用户名时出错:', error);
                    return '';
                }
            }
            getMessageContent(element) {
                const container = element.closest('.message-container');
                if (!container) return null;
                
                // 获取消息内容容器
                const wrapper = container.querySelector('.message-content__wrapper');
                if (!wrapper) return null;

                // 获取所有文本内容
                const textElements = wrapper.querySelectorAll('.text-normal');
                if (textElements.length === 0) return wrapper.textContent.trim();

                // 合并所有文本内容
                return Array.from(textElements)
                    .map(el => el.textContent.trim())
                    .join(' ')
                    .trim();
            }
            renderWordsList() {
                const blockedWordsList = document.getElementById('blockedWordsList');
                const exactWordsList = document.getElementById('exactBlockedWordsList');

                if (blockedWordsList) {
                    blockedWordsList.innerHTML = Array.from(this.blockedWordsManager.blockedWords)
                        .map(word => {
                            const encodedWord = word.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                            return `
                                <div class="settings-list-item" ondblclick="window.messageBlocker.copyText('${encodedWord}')">
                                    <span>${word}</span>
                                    <button class="delete-button" onclick="window.messageBlocker.deleteWord('${encodedWord}')">删除</button>
                                </div>
                            `;
                        })
                        .join('');
                }

                if (exactWordsList) {
                    exactWordsList.innerHTML = '';
                    Array.from(this.blockedWordsManager.exactBlockedWords).forEach(word => {
                        const item = document.createElement('div');
                        item.className = 'settings-list-item';
                        
                        // 使用pre标签显示文本
                        const pre = document.createElement('pre');
                        pre.style.margin = '0';
                        pre.style.fontFamily = 'inherit';
                        pre.style.whiteSpace = 'pre-wrap';
                        pre.textContent = word;
                        item.appendChild(pre);

                        // 创建删除按钮
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-button';
                        deleteBtn.textContent = '删除';
                        deleteBtn.onclick = () => {
                            this.blockedWordsManager.removeExactBlockedWord(word);
                            this.blockedWordsManager.saveAllData();
                            this.renderWordsList();
                            showToast(`已删除完全匹配屏蔽词: ${word}`, 'success');
                        };
                        item.appendChild(deleteBtn);

                        exactWordsList.appendChild(item);
                    });
                }
            }
    
            renderSpecialUsersList() {
                const includesUsersList = document.querySelector('#specialBlockedUsersList');
                const exactUsersList = document.querySelector('#exactSpecialBlockedUsersList');
    
                // 渲染包含匹配的特殊用户配置
                if (includesUsersList) {
                    // 合并默认配置和用户配置
                    const allIncludesUsers = { ...INCLUDES_SPECIAL_BLOCKED_USERS, ...this.blockedWordsManager.specialBlockedUsers };
    
                    const includesHtml = Object.entries(allIncludesUsers)
                        .map(([userId, words]) => {
                            // 确保words是数组
                            const wordsList = Array.isArray(words) ? words : [];
    
                            const encodedUserId = userId.replace(/'/g, '\\\'').replace(/"/g, '\\"');
    
                            // 处理显示文本
                            const displayWords = wordsList.map(word => {
                                if (word === '') {
                                    return '[屏蔽所有消息]';
                                }
                                return word;
                            }).filter(word => word !== undefined);
    
                            // 如果有任何有效的屏蔽词（包括空字符串），就显示这个用户
                            if (displayWords.length > 0) {
                                return `
                                    <div class="settings-list-item">
                                        <div>
                                            <div>用户: ${userId}</div>
                                            <div class="text-secondary">屏蔽词: ${displayWords.join(', ')}</div>
                                        </div>
                                        <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUser('${encodedUserId}', 'includes')">删除</button>
                                    </div>
                                `;
                            }
                            return '';
                        })
                        .filter(html => html) // 过滤掉空字符串
                        .join('');
    
                    includesUsersList.innerHTML = includesHtml || '<div class="settings-list-item">暂无包含匹配的特殊用户配置</div>';
                }
    
                // 渲染完全匹配的特殊用户配置
                if (exactUsersList) {
                    // 合并默认配置和用户配置
                    const allExactUsers = { ...EXACT_SPECIAL_BLOCKED_USERS, ...this.blockedWordsManager.exactSpecialBlockedUsers };
    
                    const exactHtml = Object.entries(allExactUsers)
                        .map(([userId, words]) => {
                            // 确保words是数组
                            const wordsList = Array.isArray(words) ? words : [];
    
                            const encodedUserId = userId.replace(/'/g, '\\\'').replace(/"/g, '\\"');
    
                            // 处理显示文本
                            const displayWords = wordsList.map(word => {
                                if (word === '') {
                                    return '[屏蔽所有消息]';
                                }
                                return word;
                            }).filter(word => word !== undefined);
    
                            // 如果有任何有效的屏蔽词（包括空字符串），就显示这个用户
                            if (displayWords.length > 0) {
                                return `
                                    <div class="settings-list-item">
                                        <div>
                                            <div>用户: ${userId}</div>
                                            <div class="text-secondary">屏蔽词: ${displayWords.join(', ')}</div>
                                        </div>
                                        <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUser('${encodedUserId}', 'exact')">删除</button>
                                    </div>
                                `;
                            }
                            return '';
                        })
                        .filter(html => html) // 过滤掉空字符串
                        .join('');
    
                    exactUsersList.innerHTML = exactHtml || '<div class="settings-list-item">暂无完全匹配的特殊用户配置</div>';
                }
            }
    
            renderEmojisList() {
                const emojisList = document.getElementById('emojisList');
                if (!emojisList) return;
    
                const emojisHtml = Array.from(this.blockedWordsManager.blockedEmojis)
                    .sort((a, b) => a - b)
                    .map(emojiId => {
                        return `
                            <div class="settings-list-item" ondblclick="window.messageBlocker.copyText(${emojiId})">
                                <div>
                                    <div>表情ID: ${emojiId}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteEmoji(${emojiId})">删除</button>
                            </div>
                        `;
                    })
                    .join('');
    
                emojisList.innerHTML = emojisHtml || '<div class="settings-list-item">暂无表情屏蔽配置</div>';
            }
    
            renderSpecialEmojisList() {
                const specialEmojisList = document.getElementById('specialEmojisList');
                if (!specialEmojisList) return;
    
                const specialEmojisHtml = Object.entries(this.blockedWordsManager.specialBlockedUsersEmojis)
                    .map(([userId, emojiIds]) => {
                        if (!emojiIds || emojiIds.length === 0) return '';
    
                        return `
                            <div class="settings-list-item">
                                <div>
                                    <div>用户: ${userId}</div>
                                    <div class="text-secondary">屏蔽表情: ${Array.from(emojiIds).join(', ')}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUserEmoji('${userId}')">删除</button>
                            </div>
                        `;
                    })
                    .filter(html => html)
                    .join('');
    
                specialEmojisList.innerHTML = specialEmojisHtml || '<div class="settings-list-item">暂无特定用户表情屏蔽配置</div>';
            }
    
            renderBlockedImagesList() {
                const imagesList = document.getElementById('imagesList');
                if (!imagesList) return;
    
                const imagesHtml = Array.from(this.blockedWordsManager.blockedImages)
                    .filter(pattern => pattern.trim())
                    .map(pattern => {
                        const encodedPattern = pattern.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                        return `
                            <div class="settings-list-item" ondblclick="window.messageBlocker.copyText('${encodedPattern}')">
                                <div>
                                    <div>文件名特征: ${pattern}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteBlockedImage('${encodedPattern}')">删除</button>
                            </div>
                        `;
                    })
                    .join('');
    
                imagesList.innerHTML = imagesHtml || '<div class="settings-list-item">暂无图片屏蔽配置</div>';
            }
    
            deleteWord(word) {
                if (this.blockedWordsManager.removeBlockedWord(word)) {
                    this.renderWordsList();
                    showToast('删除成功');
                }
            }
    
            deleteExactWord(word) {
                try {
                    this.blockedWordsManager.removeExactBlockedWord(word);
                    this.blockedWordsManager.saveAllData();
                    this.renderWordsList();
                    showToast(`已删除完全匹配屏蔽词: ${word}`, 'success');
                } catch (error) {
                    console.error('Error in deleteExactWord:', error);
                    showToast('删除失败，请重试', 'error');
                }
            }
    
            deleteSpecialUser(userId, type) {
                if (type === 'includes') {
                    delete this.blockedWordsManager.specialBlockedUsers[userId];
                } else {
                    delete this.blockedWordsManager.exactSpecialBlockedUsers[userId];
                }
    
                this.blockedWordsManager.saveAllData();
                this.renderSpecialUsersList();
                showToast('删除成功');
            }
    
            deleteEmoji(emojiId) {
                if (this.blockedWordsManager.deleteEmoji(emojiId)) {
                    this.renderEmojisList();
                    showToast('表情屏蔽已删除');
                }
            }
    
            deleteSpecialUserEmoji(username) {
                if (this.blockedWordsManager.deleteSpecialUserEmoji(username)) {
                    this.renderSpecialEmojisList();
                    showToast('删除成功');
                }
            }
    
            deleteBlockedImage(pattern) {
                if (this.blockedWordsManager.removeBlockedImage(pattern)) {
                    this.renderBlockedImagesList();
                    showToast('删除成功');
                }
            }
    
            addEventListeners() {
                const addButton = document.querySelector('#addBlockedWord');
                const newBlockWordInput = document.querySelector('#newBlockWord');
                if (addButton && newBlockWordInput) {
                    addButton.addEventListener('click', () => {
                        const word = newBlockWordInput.value.trim();
                        if (!word) {
                            showToast('请输入要屏蔽的词', 'error');
                            return;
                        }
                        if (this.blockedWordsManager.addBlockedWord(word)) {
                            this.renderWordsList();
                            newBlockWordInput.value = '';
                            showToast('添加成功', 'success');
                        } else {
                            showToast('该屏蔽词已存在', 'error');
                        }
                    });

                    // 添加回车键监听
                    newBlockWordInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const word = newBlockWordInput.value.trim();
                            if (!word) {
                                showToast('请输入要屏蔽的词', 'error');
                                return;
                            }
                            if (this.blockedWordsManager.addBlockedWord(word)) {
                                this.renderWordsList();
                                newBlockWordInput.value = '';
                                showToast('添加成功', 'success');
                            } else {
                                showToast('该屏蔽词已存在', 'error');
                            }
                        }
                    });
                }

                // 添加包含匹配特殊用户屏蔽
                document.getElementById('addSpecialUserBtn')?.addEventListener('click', () => {
                    const userInput = document.getElementById('newSpecialBlockUser');
                    const wordInput = document.getElementById('newSpecialBlockWord');
                    if (userInput && wordInput) {
                        const userId = userInput.value.trim();
                        const word = wordInput.value.trim();
    
                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }
    
                        // 添加到用户配置
                        if (!this.blockedWordsManager.specialBlockedUsers[userId]) {
                            this.blockedWordsManager.specialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.specialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.specialBlockedUsers[userId].push(word);
                        }
    
                        // 保存配置
                        this.blockedWordsManager.saveAllData();
    
                        // 清空输入框
                        userInput.value = '';
                        wordInput.value = '';
    
                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    }
                });

                // 添加完全匹配特殊用户屏蔽
                document.getElementById('addExactSpecialUserBtn')?.addEventListener('click', () => {
                    const userInput = document.getElementById('newExactSpecialBlockUser');
                    const wordInput = document.getElementById('newExactSpecialBlockWord');
                    if (userInput && wordInput) {
                        const userId = userInput.value.trim();
                        const word = wordInput.value.trim();
    
                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }
    
                        // 添加到用户配置
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId]) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId].push(word);
                        }
    
                        // 保存配置
                        this.blockedWordsManager.saveAllData();
    
                        // 清空输入框
                        userInput.value = '';
                        wordInput.value = '';
    
                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    }
                });

                // 添加表情相关的事件监听和处理方法
                const addEmojiBtn = document.getElementById('addEmojiBtn');
                const newBlockEmoji = document.getElementById('newBlockEmoji');
    
                if (addEmojiBtn && newBlockEmoji) {
                    addEmojiBtn.addEventListener('click', () => {
                        const emojiId = newBlockEmoji.value.trim();
                        if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                            newBlockEmoji.value = ''; // 只有在成功添加后才清空输入框
                            this.renderEmojisList(); // 只有在成功添加后才更新列表
                        }
                    });

                    // 添加回车键监听
                    newBlockEmoji.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const emojiId = newBlockEmoji.value.trim();
                            if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                                newBlockEmoji.value = ''; // 只有在成功添加后才清空输入框
                                this.renderEmojisList(); // 只有在成功添加后才更新列表
                            }
                        }
                    });
                }

                // 添加特定用户表情屏蔽
                const addSpecialEmojiBtn = document.getElementById('addSpecialEmojiBtn');
                const specialEmojiUser = document.getElementById('specialEmojiUser');
                const specialEmojiId = document.getElementById('specialEmojiId');
                if (addSpecialEmojiBtn && specialEmojiUser && specialEmojiId) {
                    const handleAddSpecialEmoji = () => {
                        const userId = specialEmojiUser.value.trim();
                        const emojiId = specialEmojiId.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }
                        if (!emojiId) {
                            showToast('请输入表情ID', 'error');
                            return;
                        }

                        // 初始化用户的表情列表（如果不存在）
                        if (!this.blockedWordsManager.specialBlockedUsersEmojis[userId]) {
                            this.blockedWordsManager.specialBlockedUsersEmojis[userId] = [];
                        }

                        // 检查是否已存在
                        if (this.blockedWordsManager.specialBlockedUsersEmojis[userId].includes(emojiId)) {
                            showToast('该用户已存在相同的表情屏蔽', 'error');
                            return;
                        }

                        // 添加表情ID
                        this.blockedWordsManager.specialBlockedUsersEmojis[userId].push(emojiId);

                        // 保存数据
                        this.blockedWordsManager.saveAllData();

                        this.renderSpecialEmojisList();
                        showToast('添加成功', 'success');

                        // 清空输入框
                        specialEmojiUser.value = '';
                        specialEmojiId.value = '';
                    };

                    // 点击按钮添加
                    addSpecialEmojiBtn.addEventListener('click', handleAddSpecialEmoji);

                    // 回车键添加
                    const handleKeyPress = (e) => {
                        if (e.key === 'Enter') {
                            handleAddSpecialEmoji();
                        }
                    };

                    specialEmojiUser.addEventListener('keypress', handleKeyPress);
                    specialEmojiId.addEventListener('keypress', handleKeyPress);
                }

                // 添加图片屏蔽
                const addImageBtn = document.getElementById('addImageBtn');
                const newBlockImage = document.getElementById('newBlockImage');
                if (addImageBtn && newBlockImage) {
                    const handleAddImage = () => {
                        const imagePattern = newBlockImage.value.trim();
                        if (!imagePattern) {
                            showToast('请输入图片文件名特征', 'error');
                            return;
                        }

                        if (this.blockedWordsManager.addBlockedImage(imagePattern)) {
                            // 清空输入框
                            newBlockImage.value = '';
                            // 刷新列表
                            this.renderBlockedImagesList();
                            showToast('添加成功');
                        } else {
                            showToast('该图片特征已存在', 'error');
                        }
                    };

                    // 点击按钮添加
                    addImageBtn.addEventListener('click', handleAddImage);

                    // 回车键添加
                    newBlockImage.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleAddImage();
                        }
                    });
                }

                // 导出配置
                const exportConfigBtn = document.getElementById('exportConfigBtn');
                if (exportConfigBtn) {
                    exportConfigBtn.addEventListener('click', () => {
                        this.blockedWordsManager.exportConfig();
                    });
                }

                // 导入配置
                const importConfigFile = document.getElementById('importConfigFile');
                const importConfigBtn = document.getElementById('importConfigBtn');
                if (importConfigFile && importConfigBtn) {
                    importConfigBtn.addEventListener('click', () => {
                        const file = importConfigFile.files[0];
                        if (file) {
                            this.blockedWordsManager.importConfig(file);
                        } else {
                            showToast('请选择配置文件', 'error');
                        }
                    });
                }

                // Render the initial lists
                this.renderWordsList();
                this.renderSpecialUsersList();
                this.renderEmojisList();
                this.renderSpecialEmojisList();
                this.renderBlockedImagesList();
            }

            showBlockedWordsModal() {
                console.log('开始显示屏蔽词设置界面');
                const scrollView = document.querySelector('.q-scroll-view.scroll-view--show-scrollbar.liteloader');
                console.log('找到滚动视图容器:', scrollView);
                if (!scrollView) {
                    console.error('未找到滚动视图容器');
                    return;
                }
                scrollView.innerHTML = '';

                // 添加通用样式
                const style = document.createElement('style');
                style.textContent = `
                    .settings-container { padding: 16px; }
                    .settings-section { background: var(--bg_bottom_standard); border-radius: 8px; margin-bottom: 16px; }
                    .section-header { padding: 16px; border-bottom: 1px solid var(--border_standard); }
                    .section-title { font-size: 16px; font-weight: 500; color: var(--text_primary); }
                    .section-desc { font-size: 12px; color: var(--text_secondary); margin-top: 4px; }
                    .section-content { padding: 16px; }
                    .settings-list { list-style: none; padding: 0; margin: 0; }
                    .settings-list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; margin-bottom: 8px; background: var(--bg_medium_standard); border: 1px solid var(--border_standard); border-radius: 8px; gap: 12px; }
                    .settings-list-item span { flex: 1; color: var(--text_primary); word-break: break-all; white-space: pre-wrap; line-height: 1.5; font-size: 14px; }
                    .delete-button { height: 32px; padding: 0 16px; border-radius: 6px; font-size: 14px; cursor: pointer; background: #E54D42; color: white; border: none; }
                    .add-button { height: 32px; padding: 0 16px; border-radius: 6px; font-size: 14px; cursor: pointer; background: var(--brand_standard); color: white; border: none; }
                    .settings-input { flex: 1; height: 32px; padding: 0 12px; background: var(--bg_bottom_standard); border: 1px solid var(--border_standard); border-radius: 6px; color: var(--text_primary); font-size: 14px; }
                    setting-item { padding: 16px; }
                    setting-item[data-direction="row"] { display: flex; flex-direction: column; }
                    setting-text { display: block; line-height: 1.5; }
                    setting-text[data-type="secondary"] { margin-top: 4px; }
                `;
                document.head.appendChild(style);

                const container = document.createElement('div');
                container.className = 'settings-container';

                const blockedWordsSection = document.createElement('setting-section');
                blockedWordsSection.setAttribute('data-title', '屏蔽词管理');
                blockedWordsSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="column">
                                <div>
                                    <setting-text>包含匹配屏蔽词</setting-text>
                                    <setting-text data-type="secondary">添加后将自动屏蔽包含该关键词的消息（例如：屏蔽"测试111"也会屏蔽"测试111111"）</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px;">
                                    <input type="text" id="newBlockWord" class="settings-input" placeholder="输入要屏蔽的词">
                                    <button id="addBlockedWord" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="blockedWordsList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>

                            <setting-item data-direction="column" style="margin-top: 16px;">
                                <div>
                                    <setting-text>完全匹配屏蔽词</setting-text>
                                    <setting-text data-type="secondary">添加后将只屏蔽完全匹配的消息（例如：屏蔽"测试222"不会屏蔽"测试22222222"）</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px;">
                                    <input type="text" id="newExactBlockWord" class="settings-input" placeholder="输入要屏蔽的词">
                                    <button id="addExactWordBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="exactBlockedWordsList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                const specialUsersSection = document.createElement('setting-section');
                specialUsersSection.setAttribute('data-title', '特殊用户屏蔽管理');
                specialUsersSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="column">
                                <div>
                                    <setting-text>包含匹配特殊用户屏蔽（不填屏蔽词则完全屏蔽）</setting-text>
                                    <setting-text data-type="secondary">添加后将自动屏蔽该用户发送的包含关键词的消息</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px;">
                                    <input type="text" id="newSpecialBlockUser" class="settings-input" placeholder="输入用户名">
                                    <input type="text" id="newSpecialBlockWord" class="settings-input" placeholder="输入要屏蔽的词">
                                    <button id="addSpecialUserBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="specialBlockedUsersList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>

                            <setting-item data-direction="column" style="margin-top: 16px;">
                                <div>
                                    <setting-text>完全匹配特殊用户屏蔽</setting-text>
                                    <setting-text data-type="secondary">添加后将只屏蔽该用户发送的完全匹配的消息</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px;">
                                    <input type="text" id="newExactSpecialBlockUser" class="settings-input" placeholder="输入用户名">
                                    <input type="text" id="newExactSpecialBlockWord" class="settings-input" placeholder="输入要屏蔽的词">
                                    <button id="addExactSpecialUserBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="exactSpecialBlockedUsersList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                const emojiSection = document.createElement('setting-section');
                emojiSection.setAttribute('data-title', '表情屏蔽设置');
                emojiSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="row">
                                <div>
                                    <setting-text>添加表情屏蔽</setting-text>
                                    <setting-text data-type="secondary">添加后将自动屏蔽包含该表情的消息（例如：178为滑稽表情，146为暴筋表情）</setting-text>
                                </div>
                                <div class="input-group">
                                    <input type="text" id="newBlockEmoji" class="settings-input" placeholder="表情ID">
                                    <button id="addEmojiBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="emojisList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                const specialEmojiSection = document.createElement('setting-section');
                specialEmojiSection.setAttribute('data-title', '特定用户表情屏蔽');
                specialEmojiSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="row">
                                <div>
                                    <setting-text>添加特定用户表情屏蔽</setting-text>
                                    <setting-text data-type="secondary">为特定用户设置独立的表情屏蔽列表</setting-text>
                                </div>
                                <div class="input-group">
                                    <input type="text" id="specialEmojiUser" class="settings-input" placeholder="用户名">
                                    <input type="text" id="specialEmojiId" class="settings-input" placeholder="表情ID">
                                    <button id="addSpecialEmojiBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                            </setting-item>
                            <setting-item data-direction="column">
                                <div id="specialEmojisList" class="settings-list"></div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                const blockedImagesSection = document.createElement('setting-section');
                blockedImagesSection.setAttribute('data-title', '图片屏蔽管理');
                blockedImagesSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="column">
                                <div>
                                    <setting-text>图片特征屏蔽</setting-text>
                                    <setting-text data-type="secondary">添加图片文件名特征，将自动屏蔽包含该特征的图片</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px;">
                                    <input type="text" id="newBlockImage" class="settings-input" placeholder="输入图片文件名特征">
                                    <button id="addImageBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="imagesList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                const configSection = document.createElement('setting-section');
                configSection.setAttribute('data-title', '配置管理');
                configSection.innerHTML = `
                    <setting-panel>
                        <setting-list data-direction="column">
                            <setting-item data-direction="column">
                                <div>
                                    <setting-text>导入/导出配置</setting-text>
                                    <setting-text data-type="secondary">可以导出当前配置或导入之前的配置</setting-text>
                                </div>
                                <div class="input-group" style="margin-top: 8px; display: flex; gap: 8px;">
                                    <button id="exportConfigBtn" class="add-button">导出配置</button>
                                    <input type="file" id="importConfigFile" accept=".json" style="display: none;">
                                    <button id="importConfigBtn" class="add-button" onclick="document.getElementById('importConfigFile').click()">导入配置</button>
                                </div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

                container.appendChild(blockedWordsSection);
                container.appendChild(specialUsersSection);
                container.appendChild(emojiSection);
                container.appendChild(specialEmojiSection);
                container.appendChild(blockedImagesSection);
                container.appendChild(configSection);
                console.log('准备添加设置界面到滚动视图');
                scrollView.appendChild(container);
                console.log('设置界面已添加到滚动视图');

                // Add event listeners for the add buttons
                const addBlockedWordBtn = document.getElementById('addBlockedWord');
                const newBlockWordInput = document.getElementById('newBlockWord');
                if (addBlockedWordBtn && newBlockWordInput) {
                    addBlockedWordBtn.addEventListener('click', () => {
                        const word = newBlockWordInput.value.trim();
                        if (!word) {
                            showToast('请输入要屏蔽的词', 'error');
                            return;
                        }
                        if (this.blockedWordsManager.addBlockedWord(word)) {
                            this.renderWordsList();
                            newBlockWordInput.value = '';
                            showToast('添加成功', 'success');
                        } else {
                            showToast('该屏蔽词已存在', 'error');
                        }
                    });

                    // 添加回车键监听
                    newBlockWordInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const word = newBlockWordInput.value.trim();
                            if (!word) {
                                showToast('请输入要屏蔽的词', 'error');
                                return;
                            }
                            if (this.blockedWordsManager.addBlockedWord(word)) {
                                this.renderWordsList();
                                newBlockWordInput.value = '';
                                showToast('添加成功', 'success');
                            } else {
                                showToast('该屏蔽词已存在', 'error');
                            }
                        }
                    });
                }

                const addExactWordBtn = document.getElementById('addExactWordBtn');
                const newExactBlockWordInput = document.getElementById('newExactBlockWord');
                if (addExactWordBtn && newExactBlockWordInput) {
                    addExactWordBtn.addEventListener('click', () => {
                        const word = newExactBlockWordInput.value.trim();
                        if (!word) {
                            showToast('请输入要屏蔽的词', 'error');
                            return;
                        }
                        if (this.blockedWordsManager.addExactBlockedWord(word)) {
                            this.renderWordsList();
                            newExactBlockWordInput.value = '';
                            showToast('添加成功', 'success');
                        } else {
                            showToast('该屏蔽词已存在', 'error');
                        }
                    });

                    // 添加回车键监听
                    newExactBlockWordInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const word = newExactBlockWordInput.value.trim();
                            if (!word) {
                                showToast('请输入要屏蔽的词', 'error');
                                return;
                            }
                            if (this.blockedWordsManager.addExactBlockedWord(word)) {
                                this.renderWordsList();
                                newExactBlockWordInput.value = '';
                                showToast('添加成功', 'success');
                            } else {
                                showToast('该屏蔽词已存在', 'error');
                            }
                        }
                    });
                }

                const addSpecialUserBtn = document.getElementById('addSpecialUserBtn');
                const newSpecialBlockUser = document.getElementById('newSpecialBlockUser');
                const newSpecialBlockWord = document.getElementById('newSpecialBlockWord');
                if (addSpecialUserBtn && newSpecialBlockUser && newSpecialBlockWord) {
                    addSpecialUserBtn.addEventListener('click', () => {
                        const userId = newSpecialBlockUser.value.trim();
                        const word = newSpecialBlockWord.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }

                        // 添加到用户配置
                        if (!this.blockedWordsManager.specialBlockedUsers[userId]) {
                            this.blockedWordsManager.specialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.specialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.specialBlockedUsers[userId].push(word);
                        }

                        // 保存配置
                        this.blockedWordsManager.saveAllData();

                        // 清空输入框
                        newSpecialBlockUser.value = '';
                        newSpecialBlockWord.value = '';

                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    });

                    // 添加回车键监听
                    const handleSpecialUserEnter = () => {
                        const userId = newSpecialBlockUser.value.trim();
                        const word = newSpecialBlockWord.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }

                        // 添加到用户配置
                        if (!this.blockedWordsManager.specialBlockedUsers[userId]) {
                            this.blockedWordsManager.specialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.specialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.specialBlockedUsers[userId].push(word);
                        }

                        // 保存配置
                        this.blockedWordsManager.saveAllData();

                        // 清空输入框
                        newSpecialBlockUser.value = '';
                        newSpecialBlockWord.value = '';

                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    };

                    newSpecialBlockUser.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleSpecialUserEnter();
                        }
                    });

                    newSpecialBlockWord.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleSpecialUserEnter();
                        }
                    });
                }

                const addExactSpecialUserBtn = document.getElementById('addExactSpecialUserBtn');
                const newExactSpecialBlockUser = document.getElementById('newExactSpecialBlockUser');
                const newExactSpecialBlockWord = document.getElementById('newExactSpecialBlockWord');
                if (addExactSpecialUserBtn && newExactSpecialBlockUser && newExactSpecialBlockWord) {
                    addExactSpecialUserBtn.addEventListener('click', () => {
                        const userId = newExactSpecialBlockUser.value.trim();
                        const word = newExactSpecialBlockWord.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }

                        // 添加到用户配置
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId]) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId].push(word);
                        }

                        // 保存配置
                        this.blockedWordsManager.saveAllData();

                        // 清空输入框
                        newExactSpecialBlockUser.value = '';
                        newExactSpecialBlockWord.value = '';

                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    });

                    // 添加回车键监听
                    const handleExactSpecialUserEnter = () => {
                        const userId = newExactSpecialBlockUser.value.trim();
                        const word = newExactSpecialBlockWord.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }

                        // 添加到用户配置
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId]) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId] = [];
                        }
                        if (!this.blockedWordsManager.exactSpecialBlockedUsers[userId].includes(word)) {
                            this.blockedWordsManager.exactSpecialBlockedUsers[userId].push(word);
                        }

                        // 保存配置
                        this.blockedWordsManager.saveAllData();

                        // 清空输入框
                        newExactSpecialBlockUser.value = '';
                        newExactSpecialBlockWord.value = '';

                        // 刷新列表
                        this.renderSpecialUsersList();
                        showToast('添加成功');
                    };

                    newExactSpecialBlockUser.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleExactSpecialUserEnter();
                        }
                    });

                    newExactSpecialBlockWord.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleExactSpecialUserEnter();
                        }
                    });
                }

                const addEmojiBtn = document.getElementById('addEmojiBtn');
                const newBlockEmoji = document.getElementById('newBlockEmoji');

                if (addEmojiBtn && newBlockEmoji) {
                    addEmojiBtn.addEventListener('click', () => {
                        const emojiId = newBlockEmoji.value.trim();
                        if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                            newBlockEmoji.value = ''; // 只有在成功添加后才清空输入框
                            this.renderEmojisList(); // 只有在成功添加后才更新列表
                        }
                    });

                    // 添加回车键监听
                    newBlockEmoji.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            const emojiId = newBlockEmoji.value.trim();
                            if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                                newBlockEmoji.value = ''; // 只有在成功添加后才清空输入框
                                this.renderEmojisList(); // 只有在成功添加后才更新列表
                            }
                        }
                    });
                }

                const addSpecialEmojiBtn = document.getElementById('addSpecialEmojiBtn');
                const specialEmojiUser = document.getElementById('specialEmojiUser');
                const specialEmojiId = document.getElementById('specialEmojiId');

                if (addSpecialEmojiBtn && specialEmojiUser && specialEmojiId) {
                    const handleAddSpecialEmoji = () => {
                        const userId = specialEmojiUser.value.trim();
                        const emojiId = specialEmojiId.value.trim();

                        if (!userId) {
                            showToast('请输入用户名', 'error');
                            return;
                        }
                        if (!emojiId) {
                            showToast('请输入表情ID', 'error');
                            return;
                        }

                        // 初始化用户的表情列表（如果不存在）
                        if (!this.blockedWordsManager.specialBlockedUsersEmojis[userId]) {
                            this.blockedWordsManager.specialBlockedUsersEmojis[userId] = [];
                        }

                        // 检查是否已存在
                        if (this.blockedWordsManager.specialBlockedUsersEmojis[userId].includes(emojiId)) {
                            showToast('该用户已存在相同的表情屏蔽', 'error');
                            return;
                        }

                        // 添加表情ID
                        this.blockedWordsManager.specialBlockedUsersEmojis[userId].push(emojiId);

                        // 保存数据
                        this.blockedWordsManager.saveAllData();

                        this.renderSpecialEmojisList();
                        showToast('添加成功', 'success');

                        // 清空输入框
                        specialEmojiUser.value = '';
                        specialEmojiId.value = '';
                    };

                    // 点击按钮添加
                    addSpecialEmojiBtn.addEventListener('click', handleAddSpecialEmoji);

                    // 回车键添加
                    const handleKeyPress = (e) => {
                        if (e.key === 'Enter') {
                            handleAddSpecialEmoji();
                        }
                    };

                    specialEmojiUser.addEventListener('keypress', handleKeyPress);
                    specialEmojiId.addEventListener('keypress', handleKeyPress);
                }

                const addImageBtn = document.getElementById('addImageBtn');
                const newBlockImage = document.getElementById('newBlockImage');

                if (addImageBtn && newBlockImage) {
                    const handleAddImage = () => {
                        const imagePattern = newBlockImage.value.trim();
                        if (!imagePattern) {
                            showToast('请输入图片文件名特征', 'error');
                            return;
                        }

                        if (this.blockedWordsManager.addBlockedImage(imagePattern)) {
                            // 清空输入框
                            newBlockImage.value = '';
                            // 刷新列表
                            this.renderBlockedImagesList();
                            showToast('添加成功');
                        } else {
                            showToast('该图片特征已存在', 'error');
                        }
                    };

                    // 点击按钮添加
                    addImageBtn.addEventListener('click', handleAddImage);

                    // 回车键添加
                    newBlockImage.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            handleAddImage();
                        }
                    });
                }

                // 导出配置
                const exportConfigBtn = document.getElementById('exportConfigBtn');
                if (exportConfigBtn) {
                    exportConfigBtn.addEventListener('click', () => {
                        this.blockedWordsManager.exportConfig();
                    });
                }

                // 导入配置
                const importConfigFile = document.getElementById('importConfigFile');
                const importConfigBtn = document.getElementById('importConfigBtn');
                if (importConfigFile && importConfigBtn) {
                    importConfigBtn.addEventListener('click', () => {
                        const file = importConfigFile.files[0];
                        if (file) {
                            this.blockedWordsManager.importConfig(file);
                        } else {
                            showToast('请选择配置文件', 'error');
                        }
                    });
                }

                // Render the initial lists
                this.renderWordsList();
                this.renderSpecialUsersList();
                this.renderEmojisList();
                this.renderSpecialEmojisList();
                this.renderBlockedImagesList();
            }
            setupContextMenu() {
                document.addEventListener('mouseup', (event) => {
                    if (event.button === 2) { // 右键点击
                        this.targetEvent = event;
                        
                        // 等待QQ的原生菜单出现
                        setTimeout(() => {
                            const qContextMenu = document.querySelector('.q-context-menu');
                            if (!qContextMenu) return;

                            // 清除之前可能存在的菜单项
                            const oldItems = qContextMenu.querySelectorAll('.blocker-menu-item');
                            oldItems.forEach(item => item.remove());

                            // 获取点击的元素
                            const target = event.target;

                            // 创建分隔线
                            const createSeparator = () => {
                                const separator = document.createElement('div');
                                separator.className = 'q-context-menu-separator blocker-menu-item';
                                return separator;
                            };

                            // 创建菜单项的函数
                            const createMenuItem = (text, onClick) => {
                                const item = document.createElement('div');
                                item.className = 'q-context-menu-item blocker-menu-item';
                                
                                // 创建图标容器
                                const iconContainer = document.createElement('i');
                                iconContainer.className = 'q-icon';
                                iconContainer.innerHTML = '<svg width="13" height="13" viewBox="0 0 13 13"><path d="M1.5 3.5h10m-8.5 7h7a1 1 0 001-1v-6h-9v6a1 1 0 001 1zm2-9l.5-1h3l.5 1" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
                                
                                // 创建文本容器
                                const textContainer = document.createElement('span');
                                textContainer.className = 'q-context-menu-item__text';
                                textContainer.textContent = text;

                                // 创建内容包装器
                                const contentWrapper = document.createElement('div');
                                contentWrapper.className = 'q-context-menu-item__content';
                                contentWrapper.style.display = 'flex';
                                contentWrapper.style.alignItems = 'center';
                                contentWrapper.style.width = '100%';
                                
                                // 组装菜单项
                                contentWrapper.appendChild(iconContainer);
                                contentWrapper.appendChild(textContainer);
                                item.appendChild(contentWrapper);
                                
                                item.onclick = onClick;
                                return item;
                            };

                            // 添加分隔线和菜单项的函数
                            const addMenuItem = (item) => {
                                // 如果这是第一个自定义菜单项，先添加分隔线
                                if (!qContextMenu.querySelector('.blocker-menu-item')) {
                                    qContextMenu.appendChild(createSeparator());
                                }
                                qContextMenu.appendChild(item);
                            };

                            // 处理文本消息
                            const messageElement = target.closest(this.targetSelector);
                            if (messageElement) {
                                const content = this.getMessageContent(messageElement);
                                if (content) {
                                    const item = createMenuItem('添加为屏蔽词', () => {
                                        this.blockedWordsManager.addExactBlockedWord(content);
                                        this.blockedWordsManager.saveAllData();
                                        showToast(`已添加屏蔽词: ${content}`, 'success');
                                        qContextMenu.style.display = 'none';
                                    });
                                    addMenuItem(item);
                                }
                            }

                            // 处理图片
                            const imgElement = target.closest('.image-content[data-role="pic"]');
                            if (imgElement) {
                                const dataPath = imgElement.getAttribute('data-path');
                                if (dataPath) {
                                    const fileName = dataPath.split('/').pop();
                                    const item = createMenuItem('屏蔽此图片', () => {
                                        this.blockedWordsManager.addBlockedImage(fileName);
                                        this.blockedWordsManager.saveAllData();
                                        showToast(`已将此图片屏蔽: ${fileName}`, 'success');
                                        qContextMenu.style.display = 'none';
                                    });
                                    addMenuItem(item);
                                }
                            }

                            // 处理emoji表情
                            const emojiElement = target.closest('img.qqemoji, img.emoji');
                            if (emojiElement) {
                                const src = emojiElement.src;
                                const emojiId = src.match(/(\d+)/)?.[1];
                                if (emojiId) {
                                    const item = createMenuItem('屏蔽此表情', () => {
                                        this.blockedWordsManager.addBlockedEmoji(emojiId);
                                        this.blockedWordsManager.saveAllData();
                                        showToast(`已添加表情屏蔽: ${emojiId}`, 'success');
                                        qContextMenu.style.display = 'none';
                                    });
                                    addMenuItem(item);
                                }
                            }
                        }, 0);
                    }
                });
            }
            setupUI() {
                console.log('开始设置UI');
                const checkForNavBar = setInterval(() => {
                    const navBar = document.querySelector('.setting-tab .nav-bar.liteloader');
                    if (navBar) {
                        clearInterval(checkForNavBar);
                        const navItem = document.createElement('div');
                        navItem.setAttribute('data-v-282aeb44', '');
                        navItem.className = 'nav-item';
                        navItem.setAttribute('bf-list-item', '');
                        navItem.setAttribute('tabindex', '-1');
                        navItem.setAttribute('bf-label-inner', 'true');
                        navItem.setAttribute('data-slug', 'word-blocker');
                        navItem.innerHTML = `
                            <i data-v-357b03a8="" data-v-282aeb44="" class="q-svg-icon q-icon icon vue-component" style="width: 20px; height: 20px; --340fd034: inherit;">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
                                </svg>
                            </i>
                            <div data-v-282aeb44="" class="name">屏蔽词设置</div>
                        `;
                        navItem.addEventListener('click', () => this.showBlockedWordsModal());
                        navBar.appendChild(navItem);
                    }
                }, 1000);

                // 添加主题变量初始化
                this.initThemeVariables();

                // 添加主题变量监听
                this.updateThemeVariables();

                // 添加事件监听器
                this.addEventListeners();
            }

            initThemeVariables() {
                // 添加主题变量样式
                const style = document.createElement('style');
                document.head.appendChild(style);

                // 监听主题变化
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.attributeName === 'class') {
                            this.updateThemeVariables();
                        }
                    });
                });

                observer.observe(document.documentElement, {
                    attributes: true
                });

                // 初始化主题
                this.updateThemeVariables();
            }

            updateThemeVariables() {
                const root = document.documentElement;

                // 使用QQ原生的主题变量
                root.style.setProperty('--bg1', 'var(--bg_bottom_standard)');
                root.style.setProperty('--bg2', 'var(--background_02)');
                root.style.setProperty('--text1', 'var(--text_primary)');
                root.style.setProperty('--border1', 'var(--border_standard)');
                root.style.setProperty('--primary', 'var(--brand_standard)');
                root.style.setProperty('--primary-hover', 'var(--brand_hover)');
                root.style.setProperty('--danger', 'var(--error_standard)');
                root.style.setProperty('--danger-hover', 'var(--error_hover)');
            }
        }
        let messageBlocker = null;

        // 初始化函数
        function initializeAll() {
            console.log('MessageBlocker 2.0.5 loaded');
            messageBlocker = new MessageBlocker();
            window.messageBlocker = messageBlocker;
        }

        // 在页面加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAll);
        } else {
            initializeAll();
        }
    })();
