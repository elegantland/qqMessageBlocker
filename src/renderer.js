(function () {
    // 包含匹配屏蔽词列表2.0.7版�
    let INCLUDES_BLOCKED_WORDS = [
        //'测试111',//会屏蔽 测试111 ，也会屏蔽测试111111
        //'@AL_1S',
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
    let INCLUDES_BLOCKED_EMOJIS = [];  // 默认屏蔽的表情ID
    //以滑稽表情和暴筋表情为例子
    //let INCLUDES_BLOCKED_EMOJIS = [178,146];
    // 完全匹配屏蔽表情ID
    let EXACT_BLOCKED_EMOJIS = []; 
    // 屏蔽对应人的表情ID
    let INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = {
        //以滑稽表情和暴筋表情为例子
        //'儒雅' = [178，146];
    };
    // 在默认配置中添加需要屏蔽的图片特征
    let INCLUDES_BLOCKED_IMAGES = [
        //'76264f7279cd8e5e2d2c597fa68da8a2.jpg',
        //'bae9b15fd28f626c6b08d01188dfb604.gif',
    ];
    let MSG_ID_BLOCK_CONFIG = {
        // 是否启用 超级表情 屏蔽功能,默认true启用，关闭用false
        enabled: true
    };
    let INTERACTION_MESSAGE_CONFIG = {
        // 是否启用 互动消息(拍一拍/戳一戳等) 屏蔽功能,默认false不启用
        enabled: true
    };
    //屏蔽单用户图片
    let USER_IMAGES = {
        //'儒雅', // 只屏蔽儒雅所有图片消息
    };
    //系统消息屏蔽
    let PUBLIC_MESSAGE_KEYWORDS = [
        //'撤回',  // 屏蔽撤回消息提示
        //'拒绝了你的消息', // 屏蔽拒绝消息提示
        //'邀请',          // 屏蔽群邀请消息
    ];
    let REPLACEMODE = {
        normalWords: false,      // 普通屏蔽词是否使用替换模式
        exactWords: false,       // 完全匹配屏蔽词是否使用替换模式
        specialUsers: false,     // 特殊用户屏蔽词是否使用替换模式
        exactSpecialUsers: false,// 特殊用户完全匹配是否使用替换模式
        emojis: false,         // 表情是否使用替换模式
        images: false,         // 图片是否使用替换模式
        superEmoji: false,      // 超级表情是否使用替换模式
        publicMessage: false,    // 公共消息是否使用替换模式
        replaceword: "[已屏蔽]" // 替换词
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
            this.exactBlockedEmojis = new Set();  // 完全匹配的表情
            this.includeBlockedEmojis = new Set(); // 包含匹配的表情
            this.publicMessageKeywords = new Set(PUBLIC_MESSAGE_KEYWORDS);
            this.blockInteractionMessage = INTERACTION_MESSAGE_CONFIG.enabled;
            
            // 初始化默认配置
            this.defaultConfig = {
                blockedWords: INCLUDES_BLOCKED_WORDS,
                exactBlockedWords: EXACT_BLOCKED_WORDS,
                specialBlockedUsers: INCLUDES_SPECIAL_BLOCKED_USERS,
                exactSpecialBlockedUsers: EXACT_SPECIAL_BLOCKED_USERS,
                blockedEmojis: INCLUDES_BLOCKED_EMOJIS,
                exactBlockedEmojis: EXACT_BLOCKED_EMOJIS,  
                includeBlockedEmojis: INCLUDES_BLOCKED_EMOJIS,  
                specialBlockedUsersEmojis: INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS,
                blockedImages: INCLUDES_BLOCKED_IMAGES,
                blockSuperEmoji: MSG_ID_BLOCK_CONFIG.enabled,
                blockPublicMessage: MSG_ID_BLOCK_CONFIG.enabled,
                publicMessageKeywords: PUBLIC_MESSAGE_KEYWORDS,
                blockInteractionMessage: INTERACTION_MESSAGE_CONFIG.enabled
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
                this.exactBlockedEmojis.clear();
                this.includeBlockedEmojis.clear();

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
                if (Array.isArray(config.exactBlockedEmojis)) {
                    config.exactBlockedEmojis.forEach(id => {
                        const numId = Number(id);
                        if (!isNaN(numId)) {
                            this.exactBlockedEmojis.add(numId);
                        }
                    });
                }

                if (Array.isArray(config.includeBlockedEmojis)) {
                    config.includeBlockedEmojis.forEach(id => {
                        const numId = Number(id);
                        if (!isNaN(numId)) {
                            this.includeBlockedEmojis.add(numId);
                        }
                    });
                }

                // 合并默认的表情屏蔽配置到包含匹配集合中
                INCLUDES_BLOCKED_EMOJIS.forEach(id => {
                    const numId = Number(id);
                    if (!isNaN(numId)) {
                        this.includeBlockedEmojis.add(numId);
                    }
                });

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

                // 加载公共消息屏蔽配置
                if (typeof config.blockPublicMessage === 'boolean') {
                    this.blockPublicMessage = config.blockPublicMessage;
                } else {
                    this.blockPublicMessage = MSG_ID_BLOCK_CONFIG.enabled;
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

                // 加载公共消息关键词
                if (Array.isArray(config.publicMessageKeywords)) {
                    this.publicMessageKeywords.clear();
                    config.publicMessageKeywords.forEach(keyword => {
                        if (keyword && typeof keyword === 'string') {
                            this.publicMessageKeywords.add(keyword);
                        }
                    });
                }
                
                // 合并默认配置
                PUBLIC_MESSAGE_KEYWORDS.forEach(keyword => {
                    if (keyword && typeof keyword === 'string') {
                        this.publicMessageKeywords.add(keyword);
                    }
                });

                // 加载互动消息屏蔽配置
                if (typeof config.blockInteractionMessage === 'boolean') {
                    this.blockInteractionMessage = config.blockInteractionMessage;
                } else {
                    this.blockInteractionMessage = INTERACTION_MESSAGE_CONFIG.enabled;
                }
                
                // 更新全局变量
                INTERACTION_MESSAGE_CONFIG.enabled = this.blockInteractionMessage;

                // 只有在 messageBlocker 实例存在时才更新UI
                if (window.messageBlocker) {
                    window.messageBlocker.renderWordsList();
                    window.messageBlocker.renderSpecialUsersList();
                    window.messageBlocker.renderEmojisList();
                    window.messageBlocker.renderSpecialEmojisList();
                    window.messageBlocker.renderBlockedImagesList();
                    window.messageBlocker.renderImageBlockedUsersList();
                }

                // 在 loadAllData 方法中修改加载 USER_IMAGES 的代码
                if (config.userImages) {
                    // 直接合并配置,保留默认值
                    Object.assign(USER_IMAGES, config.userImages);
                }
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
                INTERACTION_MESSAGE_CONFIG.enabled = this.blockInteractionMessage;
                PUBLIC_MESSAGE_KEYWORDS = Array.from(this.publicMessageKeywords);

                const dataToSave = {
                    blockedWords: Array.from(this.blockedWords),
                    exactBlockedWords: Array.from(this.exactBlockedWords),
                    specialBlockedUsers: this.specialBlockedUsers,
                    exactSpecialBlockedUsers: this.exactSpecialBlockedUsers,
                    blockedEmojis: Array.from(this.blockedEmojis),
                    exactBlockedEmojis: Array.from(this.exactBlockedEmojis),
                    includeBlockedEmojis: Array.from(this.includeBlockedEmojis),
                    specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                    blockedImages: Array.from(this.blockedImages),
                    blockSuperEmoji: this.blockSuperEmoji,
                    blockPublicMessage: this.blockPublicMessage,
                    publicMessageKeywords: Array.from(this.publicMessageKeywords),
                    blockInteractionMessage: this.blockInteractionMessage,
                    userImages: USER_IMAGES  // 添加 USER_IMAGES 配置
                };

                // 使用 LiteLoader API 保存配置
                await LiteLoader.api.config.set("message_blocker", dataToSave);
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
            try {
                // 检查公共消息和系统消息
                if (element.classList.contains('gray-tip-message') || element.classList.contains('system-msg')) {
                    const grayTipContent = element.querySelector('.gray-tip-content, .system-msg-content');
                    if (grayTipContent && (grayTipContent.classList.contains('babble') || grayTipContent.classList.contains('system-msg-content'))) {
                        const text = grayTipContent.textContent;
                        
                        // 先检查普通公共消息关键词
                        for (const keyword of this.publicMessageKeywords) {
                            if (text.includes(keyword)) {
                                return { blocked: true, type: 'publicMessage' };
                            }
                        }

                        // 再检查互动类消息
                        const actions = grayTipContent.querySelectorAll('.gray-tip-action');
                        const img = grayTipContent.querySelector('.gray-tip-img');
                        if (this.blockInteractionMessage && actions.length >= 2 && img && img.src.includes('nudgeaction')) {
                            return { blocked: true, type: 'publicMessage', subType: 'interaction' };
                        }
                    }
                }

                // 首先检查用户名是否在屏蔽列表中
                if (username && INCLUDES_BLOCKED_WORDS.includes(username)) {
                    return { blocked: true, type: 'user' };
                }

                // 检查图片
                if (this.isBlockedImage(element)) {
                    return { blocked: true, type: 'image' };
                }

                // 检查普通屏蔽词
                if (message) {
                    for (const word of this.blockedWords) {
                        if (message.includes(word)) {
                            return { blocked: true, type: 'include' };
                        }
                    }
                }

                // 检查完全匹配屏蔽词
                if (message && this.exactBlockedWords.has(message)) {
                    return { blocked: true, type: 'exact' };
                }

                // 检查特殊用户屏蔽词
                if (username && message) {
                    const userBlockedWords = this.specialBlockedUsers[username];
                    if (userBlockedWords) {
                        for (const word of userBlockedWords) {
                            if (message.includes(word)) {
                                return { blocked: true, type: 'special' };
                            }
                        }
                    }
                }

                // 检查特殊用户完全匹配屏蔽词
                if (username && message) {
                    const userExactBlockedWords = this.exactSpecialBlockedUsers[username];
                    if (userExactBlockedWords && userExactBlockedWords.includes(message)) {
                        return { blocked: true, type: 'exactSpecial' };
                    }
                }

                // 检查表情
                if (emojiIds && emojiIds.length > 0) {
                    // 获取消息的文本内容用于判断是否是纯表情消息
                    const messageContent = this.getMessageContent(element);
                    if (this.checkEmojiBlocked(emojiIds, username, messageContent)) {
                        return { blocked: true, type: 'emoji' };
                    }
                }

                // 检查超级表情
                if (this.blockSuperEmoji) {
                    const lottieElement = element.querySelector('.lottie.is-relay-sticker--self, .lottie[msg-id]');
                    if (lottieElement) {
                        return { blocked: true, type: 'superEmoji' };
                    }
                }

                return { blocked: false };
            } catch (error) {
                console.error('Error in isMessageBlocked:', error);
                return { blocked: false };
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

                // 方法1：从 user-name 区域获取（最准确的方法）
                const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                if (userNameElement) {
                    const username = userNameElement.textContent.trim();
                    if (username) {
                        return username;
                    }
                }

                // 方法2：从avatar-span的aria-label属性获取（备用方法）
                const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                if (avatarSpan) {
                    const username = avatarSpan.getAttribute('aria-label');
                    if (username) {
                        return username;
                    }
                }

                return '';
            } catch (error) {
                console.error('获取用户名时出错:', error);
                return '';
            }
        }
        // 检查表情是否被屏蔽
        checkEmojiBlocked(emojiIds, username, messageContent) {
            if (!emojiIds || emojiIds.length === 0) return false;

            const numericEmojiIds = emojiIds.map(id => Number(id));
            // 只获取文本内容，不包括表情内容
            const textContent = messageContent?.replace(/\[表情\]|\[emoji\]/g, '').trim();
            const hasOtherContent = textContent && textContent.length > 0;

            return numericEmojiIds.some(id => {
                // 检查完全匹配（仅当消息只包含表情时）
                if (!hasOtherContent && this.exactBlockedEmojis.has(id)) {
                    return true;
                }
                // 检查包含匹配（无论消息是否包含其他内容）
                if (this.includeBlockedEmojis.has(id)) {
                    return true;
                }
                // 检查用户特定屏蔽
                if (username && this.specialBlockedUsersEmojis[username]?.includes(id)) {
                    return true;
                }
                return false;
            });
        }

        // 检查图片是否被屏蔽
        isBlockedImage(element) {
            if (!element || !this.blockedImages) return false;

            const imgElements = element.querySelectorAll('div.image.pic-element img.image-content, div.pic-element img.image-content');
            if (!imgElements || imgElements.length === 0) return false;

            for (const img of imgElements) {
                const src = img.src || img.getAttribute('src');
                if (!src) continue;

                const fileName = src.split('/').pop();
                
                // 检查是否在屏蔽列表中
                if (this.blockedImages.has(fileName)) {
                    return true;
                }

                // 检查用户屏蔽配置
                const messageContainer = img.closest('.message-container');
                if (messageContainer) {
                    const username = this.extractUsername(messageContainer);
                    if (username && USER_IMAGES[username]) {
                        return true;
                    }
                }
            }

            return false;
        }

        // 添加统一的用户屏蔽检查方法
        isUserBlocked(username) {
            return INCLUDES_BLOCKED_WORDS.includes(username) || 
                   Object.keys(this.specialBlockedUsers).includes(username) ||
                   username in INCLUDES_SPECIAL_BLOCKED_USERS ||
                   username in EXACT_SPECIAL_BLOCKED_USERS;
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
        addBlockedEmoji(emojiId, type = 'include') {
            if (!emojiId) {
                showToast('表情ID不能为空', 'error');
                return false;
            }

            // 转换为数字类型
            const numEmojiId = Number(emojiId);
            if (isNaN(numEmojiId)) {
                showToast('表情ID必须是数字', 'error');
                return false;
            }

            // 根据类型选择对应的集合
            const targetSet = type === 'exact' ? this.exactBlockedEmojis : this.includeBlockedEmojis;

            // 检查是否已存在
            if (targetSet.has(numEmojiId)) {
                return false;
            }

            // 添加表情ID
            targetSet.add(numEmojiId);
            this.saveAllData();
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
                .filter(html => html)
                .join('');

            specialEmojisList.innerHTML = specialEmojisHtml || '<div class="settings-list-item">暂无特定用户表情屏蔽配置</div>';
        }

        // 修改 exportConfig 方法
        exportConfig() {
            try {
                const config = {
                    blockedWords: Array.from(this.blockedWords),
                    exactBlockedWords: Array.from(this.exactBlockedWords),
                    specialBlockedUsers: this.specialBlockedUsers,
                    exactSpecialBlockedUsers: this.exactSpecialBlockedUsers,
                    blockedEmojis: Array.from(this.blockedEmojis),
                    exactBlockedEmojis: Array.from(this.exactBlockedEmojis),
                    includeBlockedEmojis: Array.from(this.includeBlockedEmojis),
                    specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                    blockedImages: Array.from(this.blockedImages),
                    publicMessageKeywords: Array.from(this.publicMessageKeywords),
                    userImages: USER_IMAGES
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

        // 修改 importConfig 方法
        importConfig(file) {
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        console.log('读取到的配置文件内容:', e.target.result); // 添加日志
                        const config = JSON.parse(e.target.result);

                        // 验证配置格式
                        if (!config || typeof config !== 'object') {
                            throw new Error('无效的配置文件格式');
                        }

                        console.log('解析后的配置对象:', config); // 添加日志

                        // 清空现有配置
                        this.blockedWords.clear();
                        this.exactBlockedWords.clear();
                        this.blockedEmojis.clear();
                        this.exactBlockedEmojis.clear();
                        this.includeBlockedEmojis.clear();
                        this.specialBlockedUsers = {};
                        this.exactSpecialBlockedUsers = {};
                        this.specialBlockedUsersEmojis = {};
                        this.blockedImages.clear();
                        this.publicMessageKeywords.clear();
                        Object.keys(USER_IMAGES).forEach(key => delete USER_IMAGES[key]);

                        // 导入新配置
                        if (Array.isArray(config.blockedWords)) {
                            console.log('导入 blockedWords:', config.blockedWords); // 添加日志
                            config.blockedWords.forEach(word => this.blockedWords.add(word));
                        }
                        if (Array.isArray(config.exactBlockedWords)) {
                            config.exactBlockedWords.forEach(word => this.exactBlockedWords.add(word));
                        }
                        if (config.specialBlockedUsers) {
                            this.specialBlockedUsers = { ...config.specialBlockedUsers };
                        }
                        if (config.exactSpecialBlockedUsers) {
                            this.exactSpecialBlockedUsers = { ...config.exactSpecialBlockedUsers };
                        }
                        if (Array.isArray(config.blockedEmojis)) {
                            config.blockedEmojis.forEach(id => this.blockedEmojis.add(Number(id)));
                        }
                        if (Array.isArray(config.exactBlockedEmojis)) {
                            config.exactBlockedEmojis.forEach(id => this.exactBlockedEmojis.add(Number(id)));
                        }
                        if (Array.isArray(config.includeBlockedEmojis)) {
                            config.includeBlockedEmojis.forEach(id => this.includeBlockedEmojis.add(Number(id)));
                        }
                        if (config.specialBlockedUsersEmojis) {
                            this.specialBlockedUsersEmojis = { ...config.specialBlockedUsersEmojis };
                        }
                        if (Array.isArray(config.blockedImages)) {
                            config.blockedImages.forEach(image => this.blockedImages.add(image));
                        }
                        if (Array.isArray(config.publicMessageKeywords)) {
                            console.log('导入 publicMessageKeywords:', config.publicMessageKeywords); // 添加日志
                            config.publicMessageKeywords.forEach(keyword => {
                                console.log('添加关键词:', keyword); // 添加日志
                                this.publicMessageKeywords.add(keyword);
                            });
                        }
                        if (config.userImages) {
                            Object.assign(USER_IMAGES, config.userImages);
                        }

                        // 打印导入后的状态
                        console.log('导入后的 publicMessageKeywords:', Array.from(this.publicMessageKeywords));

                        // 保存并更新UI
                        await this.saveAllData();
                        console.log('保存完成，开始更新UI'); // 添加日志

                        if (window.messageBlocker) {
                            window.messageBlocker.renderWordsList();
                            window.messageBlocker.renderSpecialUsersList();
                            window.messageBlocker.renderEmojisList();
                            window.messageBlocker.renderSpecialEmojisList();
                            window.messageBlocker.renderBlockedImagesList();
                            window.messageBlocker.renderImageBlockedUsersList();
                            console.log('UI更新完成'); // 添加日志
                        }

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

        // 添加图片屏蔽用户
        addImageBlockedUser(username) {
            if (!username) {
                showToast('用户名不能为空', 'error');
                return false;
            }

            if (USER_IMAGES[username]) {
                showToast('该用户已在图片屏蔽列表中', 'error');
                return false;
            }

            USER_IMAGES[username] = true;
            this.saveAllData();
            showToast('添加图片屏蔽用户成功', 'success');
            return true;
        }

        // 删除图片屏蔽用户
        removeImageBlockedUser(username) {
            if (USER_IMAGES[username]) {
                delete USER_IMAGES[username];
                this.saveAllData();
                return true;
            }
            return false;
        }

        // 添加 getMessageContent 方法到 BlockedWordsManager 类
        getMessageContent(element) {
            const container = element.closest('.message-container');
            if (!container) return null;

            // 获取消息内容容器
            const wrapper = container.querySelector('.message-content__wrapper');
            if (!wrapper) return null;

            // 获取所有文本内容，包括 @提及
            const textElements = wrapper.querySelectorAll('.text-normal, .text-element--at');
            if (textElements.length === 0) return wrapper.textContent.trim();

            // 合并所有文本内容
            return Array.from(textElements)
                .map(el => el.textContent.trim())
                .join(' ')
                .trim();
        }

        // 添加公共消息关键词
        addPublicMessageKeyword(keyword) {
            if (!keyword || this.publicMessageKeywords.has(keyword)) {
                return false;
            }
            this.publicMessageKeywords.add(keyword);
            this.saveAllData();
            return true;
        }

        // 删除公共消息关键词
        removePublicMessageKeyword(keyword) {
            if (this.publicMessageKeywords.has(keyword)) {
                this.publicMessageKeywords.delete(keyword);
                this.saveAllData();
                return true;
            }
            return false;
        }
    }
    class MessageBlocker {
        constructor() {
            if (MessageBlocker.instance) {
                return MessageBlocker.instance;
            }
            MessageBlocker.instance = this;
            this.targetSelector = 'div.msg-content-container, div.message-container, .message-container, .mix-message__container, .gray-tip-message';
            this.blockedWordsManager = new BlockedWordsManager();
            this.settingsContainer = null;
            this.initialized = false;
            this.targetEvent = null;

            // 在实例创建后再加载数据
            this.blockedWordsManager.loadAllData();

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
                    const result = this.replaceContent(element);

                    // 如果内容没有被屏蔽或只是部分屏蔽，显示元素
                    if (!result.blocked || result.partial) {
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
                                    // 检查是否是公众号消息或转发消息
                                    if (element.classList.contains('is-pub-account') || 
                                        element.querySelector('.forward-msg')) {
                                        element.style.opacity = '1';  // 直接显示这些消息
                                        return;
                                    }

                                    // 处理其他消息
                                    element.style.opacity = '0';
                                    const result = this.replaceContent(element);
                                    if (!result.blocked || result.partial) {
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
                const emojiElements = element.querySelectorAll('.face-element, .qqemoji, .emoji');
                const emojiIds = Array.from(emojiElements).map(emoji => {
                    const img = emoji.querySelector('img');
                    if (img) {
                        return img.getAttribute('data-face-index') || 
                               img.src.match(/(\d+)\/png\/(\d+)\.png$/)?.[2] || 
                               img.src.match(/(\d+)/)?.[1];
                    }
                    return null;
                }).filter(Boolean);

                // 检查是否应该屏蔽消息
                const blockResult = this.blockedWordsManager.isMessageBlocked(element, username, message, emojiIds);
                
                // 根据配置决定如何处理被屏蔽的消息
                if (blockResult.blocked) {
                    // 找到消息的根容器
                    const messageContainer = element.closest('.message-container, .gray-tip-message');
                    if (messageContainer) {
                        if (REPLACEMODE[blockResult.type]) {
                            messageContainer.textContent = REPLACEMODE.replaceword;
                        } else {
                            // 完全移除元素而不是仅仅隐藏
                            messageContainer.remove();
                        }
                    }
                    return { blocked: true };
                }
                return { blocked: false };
            } catch (error) {
                console.error('Error in replaceContent:', error);
                return { blocked: false };
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

                // 方法1：从 user-name 区域获取（最准确的方法）
                const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                if (userNameElement) {
                    const username = userNameElement.textContent.trim();
                    if (username) {
                        return username;
                    }
                }

                // 方法2：从avatar-span的aria-label属性获取（备用方法）
                const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                if (avatarSpan) {
                    const username = avatarSpan.getAttribute('aria-label');
                    if (username) {
                        return username;
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

            // 获取所有文本内容，包括 @提及
            const textElements = wrapper.querySelectorAll('.text-normal, .text-element--at');
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

                    // 用pre标签显示文本
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
            const exactEmojisList = document.getElementById('exactEmojisList');
            const includeEmojisList = document.getElementById('includeEmojisList');

            if (exactEmojisList) {
                const exactEmojisHtml = Array.from(this.blockedWordsManager.exactBlockedEmojis)
                    .sort((a, b) => a - b)
                    .map(emojiId => {
                        return `
                            <div class="settings-list-item" ondblclick="window.messageBlocker.copyText(${emojiId})">
                                <div>
                                    <div>表情ID: ${emojiId}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteEmoji(${emojiId}, 'exact')">删除</button>
                            </div>
                        `;
                    })
                    .join('');

                exactEmojisList.innerHTML = exactEmojisHtml || '<div class="settings-list-item">暂无完全匹配表情屏蔽配置</div>';
            }

            if (includeEmojisList) {
                const includeEmojisHtml = Array.from(this.blockedWordsManager.includeBlockedEmojis)
                    .sort((a, b) => a - b)
                    .map(emojiId => {
                        return `
                            <div class="settings-list-item" ondblclick="window.messageBlocker.copyText(${emojiId})">
                                <div>
                                    <div>表情ID: ${emojiId}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteEmoji(${emojiId}, 'include')">删除</button>
                            </div>
                        `;
                    })
                    .join('');

                includeEmojisList.innerHTML = includeEmojisHtml || '<div class="settings-list-item">暂无包含匹配表情屏蔽配置</div>';
            }
        }

        renderSpecialEmojisList() {
            const specialEmojisList = document.getElementById('specialEmojisList');
            if (!specialEmojisList) return;

            const specialEmojisHtml = Object.entries(this.blockedWordsManager.specialBlockedUsersEmojis)
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

        deleteEmoji(emojiId, mode = 'exact') {
            const numEmojiId = Number(emojiId);
            if (mode === 'exact' && this.blockedWordsManager.exactBlockedEmojis.has(numEmojiId)) {
                this.blockedWordsManager.exactBlockedEmojis.delete(numEmojiId);
                this.blockedWordsManager.saveAllData();
                this.renderEmojisList();
                showToast('完全匹配表情屏蔽已删除');
                return true;
            } else if (mode === 'include' && this.blockedWordsManager.includeBlockedEmojis.has(numEmojiId)) {
                this.blockedWordsManager.includeBlockedEmojis.delete(numEmojiId);
                this.blockedWordsManager.saveAllData();
                this.renderEmojisList();
                showToast('包含匹配表情屏蔽已删除');
                return true;
            }
            return false;
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
            // Render the initial lists
            this.renderWordsList();
            this.renderSpecialUsersList();
            this.renderEmojisList();
            this.renderSpecialEmojisList();
            this.renderBlockedImagesList();
        }

        showBlockedWordsModal() {
            const scrollView = document.querySelector('.q-scroll-view.scroll-view--show-scrollbar.liteloader');
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
                                    <setting-text>包含匹配特殊用户屏蔽（不填屏蔽则完全屏蔽）</setting-text>
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
                                    <setting-text>完全匹配表情屏蔽</setting-text>
                                    <setting-text data-type="secondary">添加后将只屏蔽单个表情的消息（例如：只屏蔽单独发送的滑稽表情）</setting-text>
                                </div>
                                <div class="input-group">
                                    <input type="text" id="newExactBlockEmoji" class="settings-input" placeholder="表情ID">
                                    <button id="addExactEmojiBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="exactEmojisList" class="settings-list" style="margin-top: 12px;"></div>
                            </setting-item>

                            <setting-item data-direction="row" style="margin-top: 16px;">
                                <div>
                                    <setting-text>包含匹配表情屏蔽</setting-text>
                                    <setting-text data-type="secondary">添加后将屏蔽所有包含该表情的消息（例如：屏蔽所有包含滑稽表情的消息）</setting-text>
                                </div>
                                <div class="input-group">
                                    <input type="text" id="newIncludeBlockEmoji" class="settings-input" placeholder="表情ID">
                                    <button id="addIncludeEmojiBtn" class="add-button" style="margin-left: 8px;">添加</button>
                                </div>
                                <div id="includeEmojisList" class="settings-list" style="margin-top: 12px;"></div>
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
                                    <button id="importConfigBtn" class="add-button">导入配置</button>
                                </div>
                            </setting-item>
                        </setting-list>
                    </setting-panel>
                `;

            // 添加图片屏蔽用户部分
            const imageBlockedUsersSection = document.createElement('setting-section');
            imageBlockedUsersSection.setAttribute('data-title', '图片屏蔽用户管理');
            imageBlockedUsersSection.innerHTML = `
                <setting-panel>
                    <setting-list data-direction="column">
                        <setting-item data-direction="column">
                            <div>
                                <setting-text>添加图片屏蔽用户</setting-text>
                                <setting-text data-type="secondary">添加后将自动屏蔽该用户发送的所有图片</setting-text>
                            </div>
                            <div class="input-group" style="margin-top: 8px;">
                                <input type="text" id="newImageBlockUser" class="settings-input" placeholder="输入用户名">
                                <button id="addImageBlockUserBtn" class="add-button" style="margin-left: 8px;">添加</button>
                            </div>
                            <div id="imageBlockedUsersList" class="settings-list" style="margin-top: 12px;"></div>
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
            container.insertBefore(imageBlockedUsersSection, blockedImagesSection);
            scrollView.appendChild(container);

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


            // 导入配置事件监听
            const importConfigFile = document.getElementById('importConfigFile');
            const importConfigBtn = document.getElementById('importConfigBtn');
            if (importConfigFile && importConfigBtn) {
                // 移除之前可能存在的事件监听器
                importConfigBtn.replaceWith(importConfigBtn.cloneNode(true));
                importConfigFile.replaceWith(importConfigFile.cloneNode(true));
                
                // 重新获取新的元素
                const newImportConfigBtn = document.getElementById('importConfigBtn');
                const newImportConfigFile = document.getElementById('importConfigFile');
                
                // 添加新的事件监听器
                newImportConfigBtn.addEventListener('click', () => {
                    newImportConfigFile.click();
                });

                newImportConfigFile.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (file) {
                        this.blockedWordsManager.importConfig(file);
                        newImportConfigFile.value = '';
                    } else {
                        showToast('请选择配置文件', 'error');
                    }
                });
            }

            // 添加事件监听
            const addImageBlockUserBtn = document.getElementById('addImageBlockUserBtn');
            const newImageBlockUser = document.getElementById('newImageBlockUser');
            if (addImageBlockUserBtn && newImageBlockUser) {
                const handleAddImageBlockUser = () => {
                    const username = newImageBlockUser.value.trim();
                    if (this.blockedWordsManager.addImageBlockedUser(username)) {
                        newImageBlockUser.value = '';
                        this.renderImageBlockedUsersList();
                    }
                };

                addImageBlockUserBtn.addEventListener('click', handleAddImageBlockUser);
                newImageBlockUser.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddImageBlockUser();
                    }
                });
            }

            // 初始渲染列表
            this.renderImageBlockedUsersList();

            // Render the initial lists
            this.renderWordsList();
            this.renderSpecialUsersList();
            this.renderEmojisList();
            this.renderSpecialEmojisList();
            this.renderBlockedImagesList();

            // 添加公共消息设置部分
            const publicMessageSection = document.createElement('setting-section');
            publicMessageSection.setAttribute('data-title', '公共消息屏蔽管理');
            publicMessageSection.innerHTML = `
                <setting-panel>
                    <setting-list data-direction="column">
                        <setting-item data-direction="column">
                            <div>
                                <setting-text>公共消息关键词屏蔽</setting-text>
                                <setting-text data-type="secondary">添加后将屏蔽包含该关键词的公共消息</setting-text>
                            </div>
                            <div class="input-group" style="margin-top: 8px;">
                                <input type="text" id="newPublicMessageKeyword" class="settings-input" placeholder="输入关键词">
                                <button id="addPublicMessageKeywordBtn" class="add-button" style="margin-left: 8px;">添加</button>
                            </div>
                            <div id="publicMessageKeywordsList" class="settings-list" style="margin-top: 12px;"></div>
                        </setting-item>
                    </setting-list>
                </setting-panel>
            `;

            // 在适当位置插入新的设置部分
            container.insertBefore(publicMessageSection, configSection);

            // 渲染公共消息关键词列表
            this.renderPublicMessageKeywordsList();

            // 添加事件监听
            const addPublicMessageKeywordBtn = document.getElementById('addPublicMessageKeywordBtn');
            const newPublicMessageKeyword = document.getElementById('newPublicMessageKeyword');
            if (addPublicMessageKeywordBtn && newPublicMessageKeyword) {
                const handleAddKeyword = () => {
                    const keyword = newPublicMessageKeyword.value.trim();
                    if (!keyword) {
                        showToast('请输入关键词', 'error');
                        return;
                    }
                    if (this.blockedWordsManager.addPublicMessageKeyword(keyword)) {
                        newPublicMessageKeyword.value = '';
                        this.renderPublicMessageKeywordsList();
                        showToast('添加成功');
                    } else {
                        showToast('该关键词已存在', 'error');
                    }
                };

                addPublicMessageKeywordBtn.addEventListener('click', handleAddKeyword);
                newPublicMessageKeyword.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddKeyword();
                    }
                });
            }

            // 添加完全匹配表情屏蔽事件监听
            const addExactEmojiBtn = document.getElementById('addExactEmojiBtn');
            const newExactBlockEmoji = document.getElementById('newExactBlockEmoji');
            if (addExactEmojiBtn && newExactBlockEmoji) {
                const handleAddExactEmoji = () => {
                    const emojiId = newExactBlockEmoji.value.trim();
                    if (!emojiId) {
                        showToast('请输入表情ID', 'error');
                        return;
                    }
                    if (this.blockedWordsManager.addBlockedEmoji(emojiId, 'exact')) {
                        newExactBlockEmoji.value = '';
                        this.renderEmojisList();
                        showToast('添加成功', 'success');
                    } else {
                        showToast('该表情ID已存在', 'error');
                    }
                };

                addExactEmojiBtn.addEventListener('click', handleAddExactEmoji);
                newExactBlockEmoji.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddExactEmoji();
                    }
                });
            }

            // 添加包含匹配表情屏蔽事件监听
            const addIncludeEmojiBtn = document.getElementById('addIncludeEmojiBtn');
            const newIncludeBlockEmoji = document.getElementById('newIncludeBlockEmoji');
            if (addIncludeEmojiBtn && newIncludeBlockEmoji) {
                const handleAddIncludeEmoji = () => {
                    const emojiId = newIncludeBlockEmoji.value.trim();
                    if (!emojiId) {
                        showToast('请输入表情ID', 'error');
                        return;
                    }
                    if (this.blockedWordsManager.addBlockedEmoji(emojiId, 'include')) {
                        newIncludeBlockEmoji.value = '';
                        this.renderEmojisList();
                        showToast('添加成功', 'success');
                    } else {
                        showToast('该表情ID已存在', 'error');
                    }
                };

                addIncludeEmojiBtn.addEventListener('click', handleAddIncludeEmoji);
                newIncludeBlockEmoji.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleAddIncludeEmoji();
                    }
                });
            }
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
                        const messageElement = target.closest('.msg-content-container');
                        if (messageElement) {
                            // 优先获取文本元素内容
                            const textElement = messageElement.querySelector('.text-element .text-normal');
                            if (textElement) {
                                const content = textElement.textContent.trim();
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
                        }

                        // 处理图片
                        const imgElement = target.closest('.image-content[data-role="pic"]');
                        if (imgElement) {
                            const dataPath = imgElement.getAttribute('data-path');
                            if (dataPath) {
                                const fileName = dataPath.split('/').pop();
                                
                                // 获取发送图片的用户名
                                const messageContainer = imgElement.closest('.message-container');
                                const username = messageContainer ? this.extractUsername(messageContainer) : null;
                                
                                // 添加屏蔽图片选项
                                const blockImageItem = createMenuItem('屏蔽此图片', () => {
                                    this.blockedWordsManager.addBlockedImage(fileName);
                                    this.blockedWordsManager.saveAllData();
                                    showToast(`已将此图片屏蔽: ${fileName}`, 'success');
                                    qContextMenu.style.display = 'none';
                                });
                                addMenuItem(blockImageItem);
                                
                                // 如果能获取到用户名,添加屏蔽该用户所有图片的选项
                                if (username) {
                                    const blockUserImagesItem = createMenuItem('屏蔽此人所有图片', () => {
                                        this.blockedWordsManager.addImageBlockedUser(username);
                                        this.blockedWordsManager.saveAllData();
                                        showToast(`已屏蔽 ${username} 的所有图片`, 'success');
                                        qContextMenu.style.display = 'none';
                                    });
                                    addMenuItem(blockUserImagesItem);
                                }
                            }
                        }

                        // 处理emoji表情
                        const emojiElement = target.closest('img.qqemoji, img.emoji, .face-element__icon');
                        if (emojiElement) {
                            // 获取表情ID
                            const emojiId = emojiElement.src.match(/(\d+)\/png\/(\d+)\.png$/)?.[2] || // 新格式
                                   emojiElement.getAttribute('data-face-index') ||             // data-face-index属性
                                   emojiElement.src.match(/(\d+)/)?.[1];                      // 旧格式
                            if (emojiId) {
                                // 获取消息容器，用于后续刷新
                                const messageContainer = emojiElement.closest('.message-container');

                                // 添加完全匹配屏蔽选项
                                const exactItem = createMenuItem('完全屏蔽此表情', () => {
                                    if (this.blockedWordsManager.addBlockedEmoji(emojiId, 'exact')) {
                                        showToast(`已添加表情完全屏蔽: ${emojiId}`, 'success');
                                        // 重新处理当前消息
                                        if (messageContainer) {
                                            this.replaceContent(messageContainer);
                                        }
                                    }
                                    qContextMenu.style.display = 'none';
                                });
                                addMenuItem(exactItem);

                                // 添加包含匹配屏蔽选项
                                const includeItem = createMenuItem('包含屏蔽此表情', () => {
                                    if (this.blockedWordsManager.addBlockedEmoji(emojiId, 'include')) {
                                        showToast(`已添加表情包含屏蔽: ${emojiId}`, 'success');
                                        // 重新处理当前消息
                                        if (messageContainer) {
                                            this.replaceContent(messageContainer);
                                        }
                                    }
                                    qContextMenu.style.display = 'none';
                                });
                                addMenuItem(includeItem);
                            }
                        }
                    }, 0);
                }
            });
        }
        setupUI() {
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

        renderImageBlockedUsersList() {
            const imageUsersList = document.getElementById('imageBlockedUsersList');
            if (!imageUsersList) return;

            const usersHtml = Object.keys(USER_IMAGES)
                .map(username => {
                    return `
                        <div class="settings-list-item">
                            <div>
                                <div>用户: ${username}</div>
                                <div class="text-secondary">屏蔽所有图片</div>
                            </div>
                            <button class="delete-button" onclick="window.messageBlocker.deleteImageBlockedUser('${username}')">删除</button>
                        </div>
                    `;
                })
                .join('');

            imageUsersList.innerHTML = usersHtml || '<div class="settings-list-item">暂无图片屏蔽用户配置</div>';
        }

        deleteImageBlockedUser(username) {
            if (this.blockedWordsManager.removeImageBlockedUser(username)) {
                this.renderImageBlockedUsersList();
                showToast('除成功');
            }
        }

        // 渲染公共消息关键词列表
        renderPublicMessageKeywordsList() {
            const keywordsList = document.getElementById('publicMessageKeywordsList');
            if (!keywordsList) {
                console.log('找不到 publicMessageKeywordsList 元素'); // 添加日志
                return;
            }

            console.log('当前的 publicMessageKeywords:', Array.from(this.blockedWordsManager.publicMessageKeywords)); // 添加日志

            const keywordsHtml = Array.from(this.blockedWordsManager.publicMessageKeywords)
                .map(keyword => {
                    const encodedKeyword = keyword.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                    return `
                        <div class="settings-list-item">
                            <div>
                                <div>关键词: ${keyword}</div>
                            </div>
                            <button class="delete-button" onclick="window.messageBlocker.deletePublicMessageKeyword('${encodedKeyword}')">删除</button>
                        </div>
                    `;
                })
                .join('');

            keywordsList.innerHTML = keywordsHtml || '<div class="settings-list-item">暂无公共消息关键词配置</div>';
        }

        // 删除公共消息关键词
        deletePublicMessageKeyword(keyword) {
            if (this.blockedWordsManager.removePublicMessageKeyword(keyword)) {
                this.renderPublicMessageKeywordsList();
                showToast('删除成功');
            }
        }
    }
    let messageBlocker = null;

    // 初始化函数
    function initializeAll() {
        console.log('MessageBlocker 2.0.7 loaded');
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
