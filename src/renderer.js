// 包含匹配屏蔽词列表
let INCLUDES_BLOCKED_WORDS = [
    '测试111',//会屏蔽 测试111 ，也会屏蔽测试111111
    '@AL_1S',
    '@幻想',
];
// 完全匹配屏蔽词列表
let EXACT_BLOCKED_WORDS = [
    '测试222',//只会屏蔽 测试222 ，而不会屏蔽测试22222222
    '6',
    '？',
    '测试2222',
];
// 包含匹配特殊屏蔽用户配置
let INCLUDES_SPECIAL_BLOCKED_USERS = {
    'AL_1S': ['@', '您', '其他bot'],
    '儒雅': ['测试333'],
    '测试用户2': ['屏蔽词A', '屏蔽词B', '', ''],
    '幻想': ['',],

};
// 完全匹配特殊屏蔽用户配置
let EXACT_SPECIAL_BLOCKED_USERS = {
    '儒雅': ['测试444'],
};


// 包含匹配屏蔽表情ID
let INCLUDES_BLOCKED_EMOJIS = [99999, 88888];  // 默认屏蔽的表情ID
//以滑稽表情和暴筋表情为例子
//const INCLUDES_BLOCKED_EMOJIS = [178,146];

// 屏蔽人对应的表情ID
let INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = {
    '儒雅': [99999,66666],
    '儒雅1': [66666],
    //以滑稽表情和暴筋表情为例子
    //'儒雅' = [178，146];
};


// 在默认配置中添加需要屏蔽的图片特征
let INCLUDES_BLOCKED_IMAGES = [
    '76264f7279cd8e5e2d2c597fa68da8a2.jpg',
    '99205df846cac4d7d680997a0ed56a88.jpg',
    'bae9b15fd28f626c6b08d01188dfb604.gif',

    // 可以添加更多需要屏蔽的图片特征
];

let MSG_ID_BLOCK_CONFIG = {
    // 是否启用 超级表情 屏蔽功能
    enabled: true
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

// 添加toast样式
const style = document.createElement('style');
style.textContent = `
    .toast {
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

    .toast.success {
        background-color: #52c41a;
    }

    .toast.error {
        background-color: #ff4d4f;
    }

    .toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
`;
document.head.appendChild(style);

(function () {
    // 屏蔽词管理类
    class BlockedWordsManager {
        constructor() {
            // 初始化数据结构
            this.blockedWords = new Set();
            this.exactBlockedWords = new Set();
            this.specialBlockedUsers = {};
            this.exactSpecialBlockedUsers = {};
            this.blockedEmojis = new Set();
            this.specialBlockedUsersEmojis = {};
            this.blockedImages = new Set();
            this.blockSuperEmoji = MSG_ID_BLOCK_CONFIG.enabled;  // 从配置中读取超级表情屏蔽设置

            // 加载所有配置（包括默认配置和用户配置）
            this.loadAllData();
            
            console.log('初始化完成:', {
                blockedWords: Array.from(this.blockedWords),
                exactBlockedWords: Array.from(this.exactBlockedWords),
                blockedEmojis: Array.from(this.blockedEmojis),
                specialBlockedUsersEmojis: this.specialBlockedUsersEmojis
            });
        }

        // 加载所有数据
        loadAllData() {
            try {
                // 首先加载默认配置
                INCLUDES_BLOCKED_WORDS.forEach(word => this.blockedWords.add(word));
                EXACT_BLOCKED_WORDS.forEach(word => this.exactBlockedWords.add(word));
                INCLUDES_BLOCKED_EMOJIS.forEach(id => this.blockedEmojis.add(Number(id)));
                
                // 初始化特殊用户表情配置
                Object.entries(INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS).forEach(([userId, emojiIds]) => {
                    if (!this.specialBlockedUsersEmojis[userId]) {
                        this.specialBlockedUsersEmojis[userId] = [];
                    }
                    emojiIds.forEach(id => {
                        const numId = Number(id);
                        if (!this.specialBlockedUsersEmojis[userId].includes(numId)) {
                            this.specialBlockedUsersEmojis[userId].push(numId);
                        }
                    });
                });

                // 然后加载用户配置，合并到默认配置中
                const savedData = localStorage.getItem('messageBlockerConfig');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    
                    // 合并普通屏蔽词
                    if (parsedData.blockedWords) {
                        parsedData.blockedWords.forEach(word => this.blockedWords.add(word));
                    }
                    
                    // 合并完全匹配屏蔽词
                    if (parsedData.exactBlockedWords) {
                        parsedData.exactBlockedWords.forEach(word => this.exactBlockedWords.add(word));
                    }
                    
                    // 合并特殊用户屏蔽词
                    if (parsedData.specialBlockedUsers) {
                        this.specialBlockedUsers = {
                            ...this.specialBlockedUsers,
                            ...parsedData.specialBlockedUsers
                        };
                    }
                    
                    // 合并特殊用户完全匹配屏蔽词
                    if (parsedData.exactSpecialBlockedUsers) {
                        this.exactSpecialBlockedUsers = {
                            ...this.exactSpecialBlockedUsers,
                            ...parsedData.exactSpecialBlockedUsers
                        };
                    }
                    
                    // 合并表情屏蔽
                    if (parsedData.blockedEmojis) {
                        parsedData.blockedEmojis.forEach(id => this.blockedEmojis.add(Number(id)));
                    }
                    
                    // 合并特殊用户表情屏蔽
                    if (parsedData.specialBlockedUsersEmojis) {
                        Object.entries(parsedData.specialBlockedUsersEmojis).forEach(([userId, emojiIds]) => {
                            if (!this.specialBlockedUsersEmojis[userId]) {
                                this.specialBlockedUsersEmojis[userId] = [];
                            }
                            emojiIds.forEach(id => {
                                const numId = Number(id);
                                if (!this.specialBlockedUsersEmojis[userId].includes(numId)) {
                                    this.specialBlockedUsersEmojis[userId].push(numId);
                                }
                            });
                        });
                    }
                }

                console.log('配置加载完成:', {
                    blockedWords: Array.from(this.blockedWords),
                    exactBlockedWords: Array.from(this.exactBlockedWords),
                    blockedEmojis: Array.from(this.blockedEmojis),
                    specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                    blockSuperEmoji: this.blockSuperEmoji
                });
            } catch (error) {
                console.error('加载配置时出错:', error);
                showToast('加载配置失败', 'error');
            }
        }

        // 保存所有数据
        saveAllData() {
            try {
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
                
                localStorage.setItem('messageBlockerConfig', JSON.stringify(dataToSave));
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
        isMessageBlocked(username, message, emojiIds, element) {
            try {
                // 1. 首先检查图片屏蔽（如果有图片元素）
                if (element && this.isBlockedImage(element)) {
                    console.log('检测到被屏蔽的图片:', element);
                    return true;
                }

                // 2. 检查包含匹配屏蔽词
                for (const word of this.blockedWords) {
                    if (message.includes(word)) {
                        console.log('消息被屏蔽，原因：包含屏蔽词', word);
                        return true;
                    }
                }

                // 3. 检查完全匹配屏蔽词
                const hasExactBlockedWord = Array.from(this.exactBlockedWords).some(word => {
                    const isBlocked = message.trim().toLowerCase() === word.toLowerCase();
                    if (isBlocked) {
                        console.log('消息被屏蔽，原因：完全匹配屏蔽词', word);
                    }
                    return isBlocked;
                });

                if (hasExactBlockedWord) {
                    return true;
                }

                // 4. 检查特殊用户关键词（包含匹配）
                const specialUserKeywords = this.specialBlockedUsers[username] || [];
                const hasIncludesSpecialBlockedUserKeyword = specialUserKeywords.some(keyword => {
                    const isBlocked = message.includes(keyword);
                    if (isBlocked) {
                        console.log('消息被屏蔽，原因：特殊用户包含匹配关键词', { user: username, keyword });
                    }
                    return isBlocked;
                });

                if (hasIncludesSpecialBlockedUserKeyword) {
                    return true;
                }

                // 5. 检查表情屏蔽
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
            if (imageFileName && !this.blockedImages.has(imageFileName)) {
                this.blockedImages.add(imageFileName);
                this.saveAllData();
                console.log('添加屏蔽图片:', imageFileName);
                return true;
            }
            return false;
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

            console.log('Current specialBlockedUsersEmojis:', this.specialBlockedUsersEmojis);

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

        // 保存所有数据到localStorage
        saveAllData() {
            try {
                const data = {
                    blockedWords: Array.from(this.blockedWords),
                    exactBlockedWords: Array.from(this.exactBlockedWords),
                    blockedEmojis: Array.from(this.blockedEmojis),
                    specialBlockedUsersEmojis: this.specialBlockedUsersEmojis,
                    blockedImages: Array.from(this.blockedImages),
                    blockSuperEmoji: this.blockSuperEmoji
                };
                
                localStorage.setItem('messageBlockerConfig', JSON.stringify(data));
                console.log('保存配置成功:', data);
                return true;
            } catch (error) {
                console.error('保存配置失败:', error);
                return false;
            }
        }
    }
    class MessageBlocker {
        constructor() {
            this.targetSelector = 'div.msg-content-container, div.message-container';
            this.blockedWordsManager = new BlockedWordsManager();
            this.init();
            this.setupUI();
        }
        // 新增的方法，用于屏蔽所有含有 msg-id 的消息
        blockMessagesWithMsgId(element) {
            if (!this.blockedWordsManager.blockSuperEmoji) return; // 检查是否启用功能
            // 查找包含 msg-id 的元素
            const lottieContent = element.querySelector('[msg-id]');
            if (lottieContent) {
                element.style.display = 'none'; // 隐藏整个消息容器
                console.log('Blocked message with msg-id:', element);
            }
        }
        init() {
            this.setupObserver();
            this.processExistingElements();
        }
        processExistingElements() {
            // 立即处理所有现有消息
            const messageContainers = document.querySelectorAll('.message-container');
            messageContainers.forEach(container => {
                // 确保在下一个事件循环中处理，避免阻塞
                setTimeout(() => this.replaceContent(container), 0);
            });
        }
        replaceContent(element) {
            try {
                // 1. 先检查是否是超级表情
                if (this.blockedWordsManager.blockSuperEmoji) {
                    const lottieContent = element.querySelector('[msg-id]');
                    if (lottieContent) {
                        element.style.display = 'none';
                        return;
                    }
                }

                // 获取用户名
                const username = this.extractUsername(element);
                
                // 获取消息文本内容
                const messageContent = element.textContent || '';

                // 提取表情ID
                const emojiElements = element.querySelectorAll('img[data-face-index], .face-element__icon[data-face-index], [data-face-index]');
                const emojiIds = Array.from(emojiElements).map(el => {
                    const id = el.getAttribute('data-face-index');
                    return Number(id); // 确保转换为数字
                });

                // 检查消息是否应该被屏蔽
                const shouldBlockMessage = this.blockedWordsManager.isMessageBlocked(username, messageContent, emojiIds, element);

                if (shouldBlockMessage) {
                    element.style.display = 'none';
                    return;
                }

                // 处理表情屏蔽
                let hasBlockedEmojis = false;
                if (emojiElements.length > 0) {
                    emojiElements.forEach(emojiElement => {
                        const emojiId = Number(emojiElement.getAttribute('data-face-index')); // 确保转换为数字
                        console.log('检查表情:', { emojiId, username });
                        if (this.blockedWordsManager.checkEmojiBlocked([emojiId], username)) {
                            console.log('表情被屏蔽:', emojiId);
                            // 找到最近的表情容器元素并隐藏
                            const container = emojiElement.closest('.face-element') || emojiElement.parentNode;
                            container.style.display = 'none';
                            hasBlockedEmojis = true;
                        }
                    });

                    // 如果有表情被屏蔽，检查消息是否只包含被屏蔽的表情
                    if (hasBlockedEmojis) {
                        const messageContainer = element.closest('.message-container');
                        if (messageContainer) {
                            // 获取消息内容容器
                            const messageContentContainer = messageContainer.querySelector('.message-content');
                            if (messageContentContainer) {
                                // 检查是否只包含被屏蔽的表情
                                const visibleContent = Array.from(messageContentContainer.children).some(child => {
                                    // 如果不是表情元素，或者是未被屏蔽的表情，就认为有可见内容
                                    return !child.classList.contains('face-element') || child.style.display !== 'none';
                                });

                                // 如果没有可见内容，隐藏整个消息容器
                                if (!visibleContent) {
                                    messageContainer.style.display = 'none';
                                }
                            }
                        }
                    }
                }

            } catch (error) {
                console.error('替换内容时出错:', error);
            }
        }

        extractUsername(element) {
            try {
                const rootMessageContainer = element.closest('.message-container');
                if (!rootMessageContainer) return '';

                const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
                const avatarElement = rootMessageContainer.querySelector('.avatar-span');
                
                let username = '';
                if (userNameElement) {
                    username = userNameElement.textContent.trim();
                } else if (avatarElement && avatarElement.getAttribute('aria-label')) {
                    username = avatarElement.getAttribute('aria-label').trim();
                }

                console.log('提取到用户名:', username);
                return username;
                
            } catch (error) {
                console.error('提取用户名时出错:', error);
                return '';
            }
        }
        setupObserver() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // 使用更广泛的选择器
                                const messageContainers = node.matches('.message-container')
                                    ? [node]
                                    : node.querySelectorAll('.message-container');

                                messageContainers.forEach(container => {
                                    // 异步处理，避免阻塞
                                    setTimeout(() => this.replaceContent(container), 0);
                                });
                            }
                        });
                    }
                });
            });
            // 观察整个消息列表容器
            const targetNode = document.querySelector('.message-list-container') || document.body;
            observer.observe(targetNode, {
                childList: true,
                subtree: true
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

        renderWordsList() {
            const blockedWordsList = document.getElementById('blockedWordsList');
            const exactWordsList = document.getElementById('exactBlockedWordsList');
            
            if (blockedWordsList) {
                console.log('Current blockedWords:', Array.from(this.blockedWordsManager.blockedWords));
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
                console.log('Current exactBlockedWords:', Array.from(this.blockedWordsManager.exactBlockedWords));
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
            const includesUsersList = document.querySelector('#specialBlockedUsersList');
            const exactUsersList = document.querySelector('#exactSpecialBlockedUsersList');

            // 渲染包含匹配的特殊用户配置
            if (includesUsersList) {
                const includesHtml = Object.entries(INCLUDES_SPECIAL_BLOCKED_USERS)
                    .map(([userId, words]) => {
                        const filteredWords = words.filter(word => word.trim()); // 过滤掉空字符串
                        if (filteredWords.length === 0) return ''; // 如果没有有效的屏蔽词，则跳过
                        
                        const encodedUserId = userId.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                        return `
                            <div class="settings-list-item">
                                <div>
                                    <div>用户: ${userId}</div>
                                    <div class="text-secondary">屏蔽词: ${filteredWords.join(', ')}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUser('${encodedUserId}', 'includes')">删除</button>
                            </div>
                        `;
                    })
                    .filter(html => html) // 过滤掉空字符串
                    .join('');
                
                includesUsersList.innerHTML = includesHtml || '<div class="settings-list-item">暂无包含匹配的特殊用户配置</div>';
            }

            // 渲染完全匹配的特殊用户配置
            if (exactUsersList) {
                const exactHtml = Object.entries(EXACT_SPECIAL_BLOCKED_USERS)
                    .map(([userId, words]) => {
                        const filteredWords = words.filter(word => word.trim()); // 过滤掉空字符串
                        if (filteredWords.length === 0) return ''; // 如果没有有效的屏蔽词，则跳过
                        
                        const encodedUserId = userId.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                        return `
                            <div class="settings-list-item">
                                <div>
                                    <div>用户: ${userId}</div>
                                    <div class="text-secondary">屏蔽词: ${filteredWords.join(', ')}</div>
                                </div>
                                <button class="delete-button" onclick="window.messageBlocker.deleteSpecialUser('${encodedUserId}', 'exact')">删除</button>
                            </div>
                        `;
                    })
                    .filter(html => html) // 过滤掉空字符串
                    .join('');
                
                exactUsersList.innerHTML = exactHtml || '<div class="settings-list-item">暂无完全匹配的特殊用户配置</div>';
            }
        }

        renderEmojisList() {
            const emojisList = document.getElementById('emojisList');
            if (!emojisList) return;

            console.log('Current blockedEmojis:', Array.from(this.blockedWordsManager.blockedEmojis));

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
            const specialEmojisList = document.getElementById('specialEmojisList');
            if (!specialEmojisList) return;

            console.log('Current specialBlockedUsersEmojis:', this.blockedWordsManager.specialBlockedUsersEmojis);

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
                delete INCLUDES_SPECIAL_BLOCKED_USERS[userId];
            } else if (type === 'exact') {
                delete EXACT_SPECIAL_BLOCKED_USERS[userId];
            }
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
            }
            
            // 添加特定用户表情屏蔽事件监听器
            const addSpecialEmojiBtn = document.querySelector('#addSpecialEmojiBtn');
            const specialEmojiUserInput = document.querySelector('#specialEmojiUser');
            const specialEmojiIdInput = document.querySelector('#specialEmojiId');
            if (addSpecialEmojiBtn && specialEmojiUserInput && specialEmojiIdInput) {
                addSpecialEmojiBtn.addEventListener('click', () => {
                    const userId = specialEmojiUserInput.value.trim();
                    const emojiId = specialEmojiIdInput.value.trim();
                    
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
                    specialEmojiUserInput.value = '';
                    specialEmojiIdInput.value = '';
                });
            }

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
        }

        handleAdd(type, ...inputs) {
            // 保持空实现
        }
        showBlockedWordsModal() {
            const scrollView = document.querySelector('.q-scroll-view.scroll-view--show-scrollbar.liteloader');
            if (!scrollView) return;
            scrollView.innerHTML = '';

            // 添加通用样式
            const style = document.createElement('style');
            style.textContent = [
                '.settings-container { padding: 16px; }',
                '.settings-section { background: var(--bg_bottom_standard); border-radius: 8px; margin-bottom: 16px; }',
                '.section-header { padding: 16px; border-bottom: 1px solid var(--border_standard); }',
                '.section-title { font-size: 16px; font-weight: 500; color: var(--text_primary); }',
                '.section-desc { font-size: 12px; color: var(--text_secondary); margin-top: 4px; }',
                '.section-content { padding: 16px; }',
                '.settings-list { list-style: none; padding: 0; margin: 0; }',
                '.settings-list-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; margin-bottom: 8px; background: var(--bg_medium_standard); border: 1px solid var(--border_standard); border-radius: 8px; gap: 12px; }',
                '.settings-list-item span { flex: 1; color: var(--text_primary); word-break: break-all; white-space: pre-wrap; line-height: 1.5; font-size: 14px; }',
                '.delete-button { height: 32px; padding: 0 16px; border-radius: 6px; font-size: 14px; cursor: pointer; background: #E54D42; color: white; border: none; }',
                '.add-button { height: 32px; padding: 0 16px; border-radius: 6px; font-size: 14px; cursor: pointer; background: var(--brand_standard); color: white; border: none; }',
                '.settings-input { flex: 1; height: 32px; padding: 0 12px; background: var(--bg_bottom_standard); border: 1px solid var(--border_standard); border-radius: 6px; color: var(--text_primary); font-size: 14px; }',
                'setting-item { padding: 16px; }',
                'setting-item[data-direction="row"] { display: flex; flex-direction: column; }',
                'setting-text { display: block; line-height: 1.5; }',
                'setting-text[data-type="secondary"] { margin-top: 4px; }',
                '.switch { position: relative; display: inline-block; width: 40px; height: 24px; }',
                '.switch input { opacity: 0; width: 0; height: 0; }',
                '.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border_standard); }',
                '.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; }',
                'input:checked + .slider { background-color: var(--brand_standard); }',
                'input:checked + .slider:before { transform: translateX(16px); }',
                '.slider.round { border-radius: 24px; }',
                '.slider.round:before { border-radius: 50%; }',
            ].join('');
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
                                <setting-text>包含匹配特殊用户屏蔽</setting-text>
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

            const superEmojiSection = document.createElement('setting-section');
            superEmojiSection.setAttribute('data-title', '超级表情屏蔽设置');
            superEmojiSection.innerHTML = `
                <setting-panel>
                    <setting-list data-direction="column">
                        <setting-item data-direction="row">
                            <div>
                                <setting-text>屏蔽超级表情</setting-text>
                                <setting-text data-type="secondary">开启后将屏蔽所有超级表情</setting-text>
                            </div>
                            <div class="switch">
                                <input type="checkbox" id="blockSuperEmoji" ${this.blockedWordsManager.blockSuperEmoji ? 'checked' : ''}>
                                <span class="slider round"></span>
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
            container.appendChild(superEmojiSection);

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
            }

            // 添加包含匹配特殊用户屏蔽词
            const addSpecialUserBtn = document.getElementById('addSpecialUserBtn');
            const newSpecialBlockUser = document.getElementById('newSpecialBlockUser');
            const newSpecialBlockWord = document.getElementById('newSpecialBlockWord');
            if (addSpecialUserBtn && newSpecialBlockUser && newSpecialBlockWord) {
                addSpecialUserBtn.addEventListener('click', () => {
                    const userId = newSpecialBlockUser.value.trim();
                    const word = newSpecialBlockWord.value.trim();
                    if (!userId || !word) {
                        showToast('请输入用户名和屏蔽词', 'error');
                        return;
                    }
                    
                    // 确保用户的屏蔽词数组存在
                    if (!INCLUDES_SPECIAL_BLOCKED_USERS[userId]) {
                        INCLUDES_SPECIAL_BLOCKED_USERS[userId] = [];
                    }
                    
                    // 检查是否已存在相同的屏蔽词
                    if (INCLUDES_SPECIAL_BLOCKED_USERS[userId].includes(word)) {
                        showToast('该用户已存在相同的屏蔽词', 'error');
                        return;
                    }
                    
                    INCLUDES_SPECIAL_BLOCKED_USERS[userId].push(word);
                    this.renderSpecialUsersList();
                    newSpecialBlockUser.value = '';
                    newSpecialBlockWord.value = '';
                    showToast('添加成功', 'success');
                });
            }

            // 添加完全匹配特殊用户屏蔽词
            const addExactSpecialUserBtn = document.getElementById('addExactSpecialUserBtn');
            const newExactSpecialBlockUser = document.getElementById('newExactSpecialBlockUser');
            const newExactSpecialBlockWord = document.getElementById('newExactSpecialBlockWord');
            if (addExactSpecialUserBtn && newExactSpecialBlockUser && newExactSpecialBlockWord) {
                addExactSpecialUserBtn.addEventListener('click', () => {
                    const userId = newExactSpecialBlockUser.value.trim();
                    const word = newExactSpecialBlockWord.value.trim();
                    if (!userId || !word) {
                        showToast('请输入用户名和屏蔽词', 'error');
                        return;
                    }
                    
                    // 确保用户的屏蔽词数组存在
                    if (!EXACT_SPECIAL_BLOCKED_USERS[userId]) {
                        EXACT_SPECIAL_BLOCKED_USERS[userId] = [];
                    }
                    
                    // 检查是否已存在相同的屏蔽词
                    if (EXACT_SPECIAL_BLOCKED_USERS[userId].includes(word)) {
                        showToast('该用户已存在相同的屏蔽词', 'error');
                        return;
                    }
                    
                    EXACT_SPECIAL_BLOCKED_USERS[userId].push(word);
                    this.renderSpecialUsersList();
                    newExactSpecialBlockUser.value = '';
                    newExactSpecialBlockWord.value = '';
                    showToast('添加成功', 'success');
                });
            }

            // 添加表情屏蔽
            const addEmojiBtn = document.getElementById('addEmojiBtn');
            const newBlockEmoji = document.getElementById('newBlockEmoji');
            if (addEmojiBtn && newBlockEmoji) {
                addEmojiBtn.addEventListener('click', () => {
                    const emojiId = newBlockEmoji.value.trim();
                    if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                        newBlockEmoji.value = '';
                        this.renderEmojisList();
                        showToast('表情屏蔽添加成功');
                    }
                });

                // 添加回车键监听
                newBlockEmoji.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const emojiId = newBlockEmoji.value.trim();
                        if (this.blockedWordsManager.addBlockedEmoji(emojiId)) {
                            newBlockEmoji.value = '';
                            this.renderEmojisList();
                            showToast('表情屏蔽添加成功');
                        }
                    }
                });
            }

            // 添加特定用户表情屏蔽
            const addSpecialEmojiBtn = document.getElementById('addSpecialEmojiBtn');
            const specialEmojiUser = document.getElementById('specialEmojiUser');
            const specialEmojiId = document.getElementById('specialEmojiId');
            if (addSpecialEmojiBtn && specialEmojiUser && specialEmojiId) {
                addSpecialEmojiBtn.addEventListener('click', () => {
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
                });
            }

            // 添加图片屏蔽
            const addImageBtn = document.getElementById('addImageBtn');
            const newBlockImage = document.getElementById('newBlockImage');
            if (addImageBtn && newBlockImage) {
                addImageBtn.addEventListener('click', () => {
                    const pattern = newBlockImage.value.trim();
                    if (!pattern) {
                        showToast('请输入要屏蔽的图片文件名特征', 'error');
                        return;
                    }
                    
                    if (this.blockedWordsManager.blockedImages.has(pattern)) {
                        showToast('该图片特征已存在', 'error');
                        return;
                    }
                    
                    this.blockedWordsManager.blockedImages.add(pattern);
                    this.renderBlockedImagesList();
                    newBlockImage.value = '';
                    showToast('添加成功', 'success');
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
    function initialize() {
        console.log('MessageBlocker renderer loaded');
        messageBlocker = new MessageBlocker();
        window.messageBlocker = messageBlocker;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
