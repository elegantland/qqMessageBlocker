(function () {
    // 包含匹配屏蔽词列表2.0.2版
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
        'AL_1S': ['',],
        '幻想': ['',],
    
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
                                    if (keyword !== undefined && !this.specialBlockedUsers[userId].includes(keyword)) {
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
                                    if (keyword !== undefined && !this.exactSpecialBlockedUsers[userId].includes(keyword)) {
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
    
                    console.log('[Message Blocker] 配置加载完成');
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
                try {
                    // 1. 先检查是否是超级表情
                    if (this.blockSuperEmoji) {
                        // 检查是否包含 msg-id 的元素
                        const lottieContent = element.querySelector('[msg-id]');
                        if (lottieContent) {
                            console.log('检测到带有msg-id的消息，已屏蔽');
                            return { type: 'superEmoji' };
                        }
                    }
    
                    // 2. 检查图片屏蔽（如果有图片元素）
                    if (element && this.isBlockedImage(element)) {
                        console.log('检测到被屏蔽的图片:', element);
                        return { type: 'images' };
                    }
    
                    // 3. 检查包含匹配屏蔽词
                    for (const word of this.blockedWords) {
                        if (message.includes(word)) {
                            console.log('消息被屏蔽，原因：包含屏蔽词', word);
                            return { type: 'normalWords', word };
                        }
                    }
    
                    // 4. 检查完全匹配屏蔽词
                    const hasExactBlockedWord = Array.from(this.exactBlockedWords).some(word => {
                        const isBlocked = message.trim().toLowerCase() === word.toLowerCase();
                        if (isBlocked) {
                            console.log('消息被屏蔽，原因：完全匹配屏蔽词', word);
                        }
                        return isBlocked;
                    });
    
                    if (hasExactBlockedWord) {
                        return { type: 'exactWords', word: message };
                    }
    
                    // 5. 检查特殊用户关键词（包含匹配）
                    // 获取默认配置和用户配置的关键词
                    const defaultKeywords = INCLUDES_SPECIAL_BLOCKED_USERS[username] || [];
                    const userKeywords = this.specialBlockedUsers[username] || [];
                    const allKeywords = [...defaultKeywords, ...userKeywords];
    
                    // 检查是否包含空字符串，如果包含则屏蔽所有消息
                    if (allKeywords.includes('')) {
                        console.log('消息被屏蔽，原因：特殊用户所有消息屏蔽', { user: username });
                        return { type: 'specialUsers', word: '' };
                    }
    
                    const hasIncludesSpecialBlockedUserKeyword = allKeywords.some(keyword => {
                        if (!keyword || keyword.trim() === '') return false;
                        const isBlocked = message.includes(keyword);
                        if (isBlocked) {
                            console.log('消息被屏蔽，原因：特殊用户包含匹配关键词', { user: username, keyword });
                        }
                        return isBlocked;
                    });
    
                    if (hasIncludesSpecialBlockedUserKeyword) {
                        return { type: 'specialUsers', word: message };
                    }
    
                    // 6. 检查特殊用户完全匹配
                    const defaultExactKeywords = EXACT_SPECIAL_BLOCKED_USERS[username] || [];
                    const userExactKeywords = this.exactSpecialBlockedUsers[username] || [];
                    const allExactKeywords = [...defaultExactKeywords, ...userExactKeywords];
    
                    const hasExactSpecialBlockedUserKeyword = allExactKeywords.some(keyword => {
                        if (!keyword || keyword.trim() === '') return false;
                        const isBlocked = message.trim().toLowerCase() === keyword.toLowerCase();
                        if (isBlocked) {
                            console.log('消息被屏蔽，原因：特殊用户完全匹配关键词', { user: username, keyword });
                        }
                        return isBlocked;
                    });
    
                    if (hasExactSpecialBlockedUserKeyword) {
                        return { type: 'exactSpecialUsers', word: message };
                    }
    
                    // 7. 检查表情屏蔽
                    if (emojiIds && emojiIds.length > 0) {
                        const isEmojiBlocked = this.checkEmojiBlocked(emojiIds, username);
                        if (isEmojiBlocked) {
                            console.log('表情被屏蔽', { user: username, emojiIds });
                            // 不再返回true，让消息继续处理
                        }
                    }
    
                    return false;
                } catch (error) {
                    console.error('检查消息屏蔽时出错:', error);
                    return false; // 出错时不屏蔽消息
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
                        console.log('未找到消息容器');
                        return '';
                    }
    
                    // 方法1：从avatar-span的aria-label属性获取
                    const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                    if (avatarSpan) {
                        const username = avatarSpan.getAttribute('aria-label');
                        if (username) {
                            //console.log('从avatar-span的aria-label获取到用户名:', username);
                            return username;
                        }
                    }
    
                    // 方法2：从用户名显示区域获取
                    const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                    if (userNameElement) {
                        const username = userNameElement.textContent.trim();
                        if (username) {
                            //console.log('从user-name区域获取到用户名:', username);
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
                                //console.log('从span获取到用户名:', text);
                                return text;
                            }
                        }
                    }
    
                    //console.log('未能获取到用户名');
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
                    console.log('检查全局表情:', { id, isBlocked, blockedEmojis: Array.from(this.blockedEmojis) });
                    return isBlocked;
                });
    
                // 检查特定用户屏蔽的表情
                const isUserSpecificBlocked = username && this.specialBlockedUsersEmojis[username] &&
                    numericEmojiIds.some(id => {
                        const isBlocked = this.specialBlockedUsersEmojis[username].includes(id);
                        console.log('检查用户特定表情:', { username, id, isBlocked, userEmojis: this.specialBlockedUsersEmojis[username] });
                        return isBlocked;
                    });
    
                const isBlocked = isGlobalBlocked || isUserSpecificBlocked;
    
                console.log('表情屏蔽检查结果:', {
                    emojiIds: numericEmojiIds,
                    username,
                    isGlobalBlocked,
                    isUserSpecificBlocked,
                    blockedEmojis: Array.from(this.blockedEmojis),
                    userBlockedEmojis: username ? this.specialBlockedUsersEmojis[username] : []
                });
    
                return isBlocked;
            }
    
            // 检查图片是否被屏蔽
            isBlockedImage(element) {
                if (!element || !this.blockedImages) return false;
    
                // 查找图片元素
                const imgElements = element.querySelectorAll('img');
                if (!imgElements || imgElements.length === 0) return false;
    
                // 检查每个图片是否在屏蔽列表中
                for (const img of imgElements) {
                    const src = img.src || '';
                    // 从 src 中提取文件名
                    const match = src.match(/[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/);
                    if (match) {
                        const fileName = match[0];
                        if (this.blockedImages.has(fileName)) {
                            console.log('图片被屏蔽:', fileName);
                            return true;
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
                console.log('添加屏蔽图片:', imageFileName, Array.from(this.blockedImages));
                return true;
            }
    
            // 移除被屏蔽的图片
            removeBlockedImage(imageFileName) {
                if (this.blockedImages.has(imageFileName)) {
                    this.blockedImages.delete(imageFileName);
                    this.saveAllData();
                    console.log('移除屏蔽图片:', imageFileName);
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
                    console.log('表情ID必须是纯数字:', trimmedId);
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
                console.log('添加特殊用户屏蔽:', username, keywords);
                return true;
            }
    
            // 移除特殊用户屏蔽
            removeSpecialBlockedUser(username) {
                if (this.specialBlockedUsers[username]) {
                    delete this.specialBlockedUsers[username];
                    this.saveAllData();
                    console.log('移除特殊用户屏蔽:', username);
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
    
                //console.log('Current specialBlockedUsersEmojis:', this.specialBlockedUsersEmojis);
    
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
                this.init();
                this.setupUI();
                console.log('MessageBlocker 初始化完成');
            }
    
            init() {
                this.setupObserver();
                this.processExistingElements();
                console.log('消息处理器初始化完成');
            }
            processExistingElements() {
                console.log('开始处理现有消息');
                const containers = document.querySelectorAll(this.targetSelector);
                //console.log(`找到 ${containers.length} 个消息容器`);
                containers.forEach(container => {
                    setTimeout(() => {
                        console.log('处理消息容器:', container);
                        this.replaceContent(container);
                    }, 0);
                });
            }
    
            setupObserver() {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'childList') {
                            mutation.addedNodes.forEach((node) => {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    // 检查节点本身和其子节点
                                    const containers = [
                                        ...(node.matches(this.targetSelector) ? [node] : []),
                                        ...node.querySelectorAll(this.targetSelector)
                                    ];
    
                                    if (containers.length > 0) {
                                        //console.log(`发现 ${containers.length} 个新消息容器`);
                                        containers.forEach(container => {
                                            setTimeout(() => {
                                                // 先检查是否有 msg-id
                                                if (container.querySelector('[msg-id]')) {
                                                    console.log('发现带有 msg-id 的元素，准备屏蔽');
                                                    if (this.blockedWordsManager.blockSuperEmoji) {
                                                        container.style.display = 'none';
                                                        console.log('已屏蔽带有 msg-id 的消息');
                                                        return;
                                                    }
                                                }
                                                this.replaceContent(container);
                                            }, 0);
                                        });
                                    }
                                }
                            });
                        }
                    });
                });
    
                // 观察整个文档
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
                //console.log('MutationObserver 已设置完成');
            }
    
            replaceContent(element) {
                try {
                    //console.log('开始处理消息内容:', element);
    
                    // 1. 先检查是否是超级表情
                    if (this.blockedWordsManager.blockSuperEmoji) {
                        const msgIdElement = element.querySelector('[msg-id]');
                        if (msgIdElement) {
                            console.log('检测到带有msg-id的消息，准备屏蔽:', {
                                element: msgIdElement,
                                msgId: msgIdElement.getAttribute('msg-id')
                            });
                            if (REPLACEMODE.superEmoji) {
                                const replacementText = document.createTextNode(REPLACEMODE.replaceword);
                                element.parentNode.replaceChild(replacementText, element);
                            } else {
                                element.style.display = 'none';
                            }
                            return;
                        }
                    }
    
                    // 获取用户名
                    const username = this.extractUsername(element);
    
                    // 获取消息文本内容
                    let messageContent = '';
    
                    // 1. 尝试从 markdown-element 获取内容
                    const markdownElement = element.querySelector('.markdown-element');
                    if (markdownElement) {
                        // 获取所有文本节点，包括 a 标签和普通文本
                        const textNodes = Array.from(markdownElement.querySelectorAll('p, h1, h2, h3, h4, h5, h6, div, span, a'))
                            .map(node => node.textContent.trim())
                            .filter(text => text);
                        messageContent = textNodes.join('\n');
                    }
    
                    // 2. 如果没有找到 markdown 内容，尝试从 msg-content-container 获取
                    if (!messageContent) {
                        const msgContentContainer = element.querySelector('.msg-content-container');
                        if (msgContentContainer) {
                            messageContent = msgContentContainer.textContent || '';
                        }
                    }
    
                    // 3. 如果还是没有内容，使用元素本身的文本
                    if (!messageContent) {
                        messageContent = element.textContent || '';
                    }
    
                    // 清理消息内容
                    messageContent = messageContent
                        .replace(/\s+/g, ' ')  // 将多个空白字符替换为单个空格
                        .trim();               // 移除首尾空白
                    // 提取表情ID
                    const emojiElements = element.querySelectorAll('img[data-face-index], .face-element__icon[data-face-index], [data-face-index]');
                    const emojiIds = Array.from(emojiElements).map(el => {
                        const id = el.getAttribute('data-face-index');
                        return Number(id); // 确保转换为数字
                    });
    
                    // 检查消息是否应该被屏蔽
                    const shouldBlockMessage = this.blockedWordsManager.isMessageBlocked(element, username, messageContent, emojiIds);

                    if (shouldBlockMessage) {
                        // 根据不同类型的内容使用不同的替换策略
                        if (shouldBlockMessage.type === 'normalWords' && REPLACEMODE.normalWords) {
                            // 替换包含屏蔽词的文本
                            this.replaceText(element, shouldBlockMessage.word, REPLACEMODE.replaceword);
                        } else if (shouldBlockMessage.type === 'exactWords' && REPLACEMODE.exactWords) {
                            // 替换完全匹配的屏蔽词
                            this.replaceText(element, shouldBlockMessage.word, REPLACEMODE.replaceword);
                        } else if (shouldBlockMessage.type === 'specialUsers' && REPLACEMODE.specialUsers) {
                            // 替换特殊用户的屏蔽词
                            this.replaceText(element, shouldBlockMessage.word, REPLACEMODE.replaceword);
                        } else if (shouldBlockMessage.type === 'exactSpecialUsers' && REPLACEMODE.exactSpecialUsers) {
                            // 替换特殊用户的完全匹配屏蔽词
                            this.replaceText(element, shouldBlockMessage.word, REPLACEMODE.replaceword);
                        } else if (shouldBlockMessage.type === 'images' && REPLACEMODE.images) {
                            // 替换被屏蔽的图片
                            const replacementText = document.createTextNode(REPLACEMODE.replaceword);
                            element.parentNode.replaceChild(replacementText, element);
                        } else {
                            // 如果没有启用对应的替换模式，则使用默认的隐藏方式
                            element.style.display = 'none';
                        }
                        return;
                    }

                    // 处理表情屏蔽
                    let hasBlockedEmojis = false;
                    if (emojiElements.length > 0) {
                        emojiElements.forEach(emojiElement => {
                            const emojiId = Number(emojiElement.getAttribute('data-face-index'));
                            if (this.blockedWordsManager.checkEmojiBlocked([emojiId], username)) {
                                const container = emojiElement.closest('.face-element') || emojiElement.parentNode;
                                if (REPLACEMODE.emojis) {
                                    // 替换表情为文本
                                    const replacementText = document.createTextNode(REPLACEMODE.replaceword);
                                    container.parentNode.replaceChild(replacementText, container);
                                } else {
                                    container.style.display = 'none';
                                }
                                hasBlockedEmojis = true;
                            }
                        });
                    }

                    if (hasBlockedEmojis) {
                        const messageContainer = element.closest('.message-container');
                        if (messageContainer) {
                            const messageContentContainer = messageContainer.querySelector('.message-content');
                            if (messageContentContainer) {
                                const visibleContent = Array.from(messageContentContainer.children).some(child => {
                                    return !child.classList.contains('face-element') || child.style.display !== 'none';
                                });
                                if (!visibleContent) {
                                    messageContainer.style.display = 'none';
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error('替换内容时出错:', error);
                }
            }

            replaceText(element, word, replacement) {
                // 获取文本内容
                const textContent = element.textContent;

                // 替换文本
                const replacedText = textContent.replace(new RegExp(word, 'g'), replacement);

                // 更新文本内容
                element.textContent = replacedText;
            }

            extractUsername(element) {
                try {
                    // 首先尝试从父元素获取消息容器
                    let rootMessageContainer = element;
                    while (rootMessageContainer && !rootMessageContainer.classList.contains('message-container')) {
                        rootMessageContainer = rootMessageContainer.parentElement;
                    }
    
                    if (!rootMessageContainer) {
                        console.log('未找到消息容器');
                        return '';
                    }
    
                    // 方法1：从avatar-span的aria-label属性获取
                    const avatarSpan = rootMessageContainer.querySelector('.avatar-span');
                    if (avatarSpan) {
                        const username = avatarSpan.getAttribute('aria-label');
                        if (username) {
                            //console.log('从avatar-span的aria-label获取到用户名:', username);
                            return username;
                        }
                    }
    
                    // 方法2：从用户名显示区域获取
                    const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                    if (userNameElement) {
                        const username = userNameElement.textContent.trim();
                        if (username) {
                            //console.log('从user-name区域获取到用户名:', username);
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
                                //console.log('从span获取到用户名:', text);
                                return text;
                            }
                        }
                    }
    
                    //console.log('未能获取到用户名');
                    return '';
                } catch (error) {
                    console.error('获取用户名时出错:', error);
                    return '';
                }
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
    
            renderWordsList() {
                console.log('开始渲染屏蔽词列表');
                const blockedWordsList = document.getElementById('blockedWordsList');
                const exactWordsList = document.getElementById('exactBlockedWordsList');
    
                if (blockedWordsList) {
                    console.log('当前屏蔽词:', Array.from(this.blockedWordsManager.blockedWords));
                    const wordsHtml = Array.from(this.blockedWordsManager.blockedWords)
                        .filter(word => word.trim())
                        .map(word => {
                            const encodedWord = word.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                            return `
                                <div class="settings-list-item">
                                    <span>${word}</span>
                                    <button class="delete-button" onclick="window.messageBlocker.deleteWord('${encodedWord}')">删除</button>
                                </div>
                            `;
                        })
                        .join('');
    
                    blockedWordsList.innerHTML = wordsHtml || '<div class="settings-list-item">暂无包含匹配屏蔽词配置</div>';
                }
    
                if (exactWordsList) {
                    console.log('当前完全匹配屏蔽词:', Array.from(this.blockedWordsManager.exactBlockedWords));
                    const exactWordsHtml = Array.from(this.blockedWordsManager.exactBlockedWords)
                        .filter(word => word.trim())
                        .map(word => {
                            const encodedWord = word.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                            return `
                                <div class="settings-list-item">
                                    <span>${word}</span>
                                    <button class="delete-button" onclick="window.messageBlocker.deleteExactWord('${encodedWord}')">删除</button>
                                </div>
                            `;
                        })
                        .join('');
    
                    exactWordsList.innerHTML = exactWordsHtml || '<div class="settings-list-item">暂无完全匹配屏蔽词配置</div>';
                }
            }
    
            renderSpecialUsersList() {
                console.log('开始渲染特殊用户列表');
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
                console.log('开始渲染表情列表');
                const emojisList = document.getElementById('emojisList');
                if (!emojisList) return;
    
                console.log('当前表情屏蔽:', Array.from(this.blockedWordsManager.blockedEmojis));
    
                const emojisHtml = Array.from(this.blockedWordsManager.blockedEmojis)
                    .sort((a, b) => a - b)
                    .map(emojiId => {
                        return `
                            <div class="settings-list-item">
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
                console.log('开始渲染特定用户表情列表');
                const specialEmojisList = document.getElementById('specialEmojisList');
                if (!specialEmojisList) return;
    
                console.log('当前特定用户表情屏蔽:', this.blockedWordsManager.specialBlockedUsersEmojis);
    
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
                console.log('开始渲染图片列表');
                const imagesList = document.getElementById('imagesList');
                if (!imagesList) return;
    
                const imagesHtml = Array.from(this.blockedWordsManager.blockedImages)
                    .filter(pattern => pattern.trim())
                    .map(pattern => {
                        const encodedPattern = pattern.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                        return `
                            <div class="settings-list-item">
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
                if (this.blockedWordsManager.removeExactBlockedWord(word)) {
                    this.renderWordsList();
                    showToast('删除成功');
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
                                    <setting-text data-type="secondary">添加后将只屏蔽完全匹配的消息（例如：屏蔽"测试222"不会屏蔽"测试22222"）</setting-text>
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
        }
        let messageBlocker = null;

        // 初始化函数
        function initializeAll() {
            console.log('MessageBlocker 2.0.2 loaded');
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
