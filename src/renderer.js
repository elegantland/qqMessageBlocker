// 包含匹配屏蔽词列表
const INCLUDES_BLOCKED_WORDS = [
    '测试111',
    '@AL_1S',
    '@幻想',
];
// 完全匹配屏蔽词列表
const EXACT_BLOCKED_WORDS = [
    '测试222',
];


// 包含匹配特殊屏蔽用户配置
const INCLUDES_SPECIAL_BLOCKED_USERS = {
    'AL_1S': ['@', '您', '其他bot'],
    '儒雅': ['测试333'],
    '测试用户2': ['屏蔽词A', '屏蔽词B', '', ''],
    '幻想': ['',],

};
// 完全匹配特殊屏蔽用户配置
const EXACT_SPECIAL_BLOCKED_USERS = {
    '儒雅': ['测试444'],
};


// 包含匹配屏蔽表情ID
const INCLUDES_BLOCKED_EMOJIS = [178, 146];
//以滑稽表情和暴筋表情为例子
//const INCLUDES_BLOCKED_EMOJIS = [178,146];

// 屏蔽人对应的表情ID
const INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS = {
    '儒雅': [99999],
    //以滑稽表情和暴筋表情为例子
    //'儒雅' = [178，146];
};


// 在默认配置中添加需要屏蔽的图片特征
const INCLUDES_BLOCKED_IMAGES = [
    'c5fae3c49a465588def54e36af3003f8.jpg',
    '99205df846cac4d7d680997a0ed56a88.jpg' // 这个是示例中第二张图的文件名
    // 可以添加更多需要屏蔽的图片特征
];

const MSG_ID_BLOCK_CONFIG = {
    // 是否启用 超级表情 屏蔽功能
    enabled: true
    //enabled: false
};
(function () {
    // 屏蔽词管理类
    class BlockedWordsManager {
        constructor() {
            this.blockedWords = this.loadBlockedWords() || [];
            // 确保在构造函数中加载特殊屏蔽用户
            this.blockedEmojis = this.loadBlockedEmojis() || [];
            this.specialBlockedUsers = this.loadSpecialBlockedUsers() || {};
            this.specialBlockedUsersEmojis = this.loadSpecialBlockedUsersEmojis() || {};
            this.blockedImages = this.loadBlockedImages() || INCLUDES_BLOCKED_IMAGES;
        }
        loadBlockedImages() {
            const savedImages = localStorage.getItem('blockedImages');
            return savedImages ? JSON.parse(savedImages) : INCLUDES_BLOCKED_IMAGES;
        }
        saveBlockedImages() {
            localStorage.setItem('blockedImages', JSON.stringify(this.blockedImages));
        }

        addBlockedImage(imageIdentifier) {
            // 如果输入的是完整路径，只保留文件名部分
            const fileName = imageIdentifier.split('/').pop();
            console.log('Adding blocked image:', fileName);

            if (!this.blockedImages.includes(fileName)) {
                this.blockedImages.push(fileName);
                this.saveBlockedImages();
                this.reprocessMessages();
                return true;
            }
            return false;
        }
        // 检查是否是需要屏蔽的图片
        isBlockedImage(element) {
            if (!element) return false;
            const imageElement = element.querySelector('.pic-element img') ||
                element.querySelector('img[data-role="pic"]');
            if (!imageElement) return false;

            const imagePath = imageElement.getAttribute('src') ||
                imageElement.getAttribute('data-path') ||
                imageElement.getAttribute('data-src') || '';

            console.log('Checking image path:', imagePath);

            // 从完整路径中提取文件名
            const fileName = imagePath.split('/').pop(); // 获取路径最后一部分（文件名）
            console.log('Extracted file name:', fileName);

            // 检查是否包含需要屏蔽的图片特征
            const isBlocked = this.blockedImages.some(blockedImage => {
                const matches = fileName.includes(blockedImage);
                console.log(`Checking if ${fileName} matches ${blockedImage}:`, matches);
                return matches;
            });

            console.log('Final blocking result:', isBlocked);
            return isBlocked;
        }
        loadBlockedWords() {
            const savedWords = localStorage.getItem('blockedWords');
            return savedWords ? JSON.parse(savedWords) : INCLUDES_BLOCKED_WORDS;
        }
        loadSpecialBlockedUsers() {
            try {
                const savedUsers = localStorage.getItem('specialBlockedUsers');

                // 如果没有本地存储数据，直接使用默认配置
                if (!savedUsers) {
                    localStorage.setItem('specialBlockedUsers', JSON.stringify(INCLUDES_SPECIAL_BLOCKED_USERS));
                    return INCLUDES_SPECIAL_BLOCKED_USERS;
                }
                // 解析本地存储的数据
                const parsedUsers = JSON.parse(savedUsers);
                // 合并默认配置和本地存储的配置
                const mergedUsers = { ...INCLUDES_SPECIAL_BLOCKED_USERS, ...parsedUsers };
                // 去重和合并关键词
                Object.keys(mergedUsers).forEach(username => {
                    // 合并关键词，并去重
                    const defaultKeywords = INCLUDES_SPECIAL_BLOCKED_USERS[username] || [];
                    const savedKeywords = parsedUsers[username] || [];

                    mergedUsers[username] = [...new Set([...defaultKeywords, ...savedKeywords])];
                });
                // 将合并后的配置保存回本地存储
                localStorage.setItem('specialBlockedUsers', JSON.stringify(mergedUsers));
                console.log('合并后的特殊屏蔽用户配置:', mergedUsers);
                return mergedUsers;
            } catch (error) {
                console.error('加载特殊屏蔽用户时出错:', error);
                return INCLUDES_SPECIAL_BLOCKED_USERS;
            }
        }
        addSpecialBlockedUserEmoji(username, emojiId) {
            if (!this.specialBlockedUsersEmojis) {
                this.specialBlockedUsersEmojis = {};
            }
            if (!this.specialBlockedUsersEmojis[username]) {
                this.specialBlockedUsersEmojis[username] = [];
            }
            if (!this.specialBlockedUsersEmojis[username].includes(emojiId)) {
                this.specialBlockedUsersEmojis[username].push(emojiId);
                this.saveConfig(); // 保存配置
                return true; // 返回成功
            }
            return false; // 返回失败
        }
        // 移除特定用户的所有表情屏蔽
        removeSpecialBlockedUserEmojis(username) {
            if (this.specialBlockedUsersEmojis && this.specialBlockedUsersEmojis[username]) {
                delete this.specialBlockedUsersEmojis[username]; // 删除用户的屏蔽信息
                this.saveConfig(); // 保存配置
            }
        }
        loadBlockedEmojis() {
            const savedEmojis = localStorage.getItem('blockedEmojis');
            return savedEmojis ? JSON.parse(savedEmojis) : INCLUDES_BLOCKED_EMOJIS;
        }
        loadSpecialBlockedUsersEmojis() {
            const savedUsersEmojis = localStorage.getItem('specialBlockedUsersEmojis');
            return savedUsersEmojis ? JSON.parse(savedUsersEmojis) : INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS;
        }
        // 添加屏蔽表情的相关方法
        saveBlockedEmojis() {
            localStorage.setItem('blockedEmojis', JSON.stringify(this.blockedEmojis));
        }
        addEmoji(emojiId) {
            if (!this.blockedEmojis.includes(emojiId)) {
                this.blockedEmojis.push(emojiId);
                this.saveBlockedEmojis();
                this.reprocessMessages();
                return true;
            }
            return false;
        }
        removeEmoji(emojiId) {
            const index = this.blockedEmojis.indexOf(emojiId);
            if (index > -1) {
                this.blockedEmojis.splice(index, 1);
                this.saveBlockedEmojis();
                return true;
            }
            return false;
        }
        reprocessMessages() {
            try {
                // 选择所有消息容器
                const messageContainers = document.querySelectorAll('div.message-container');
                messageContainers.forEach(element => {
                    const usernameElement = element.querySelector('.avatar-span[aria-label]');
                    const messageContentElement = element.querySelector('.text-element .text-normal');
                    if (usernameElement && messageContentElement) {
                        const username = usernameElement.getAttribute('aria-label');
                        const message = messageContentElement.textContent.trim();
                        // 使用 isMessageBlocked 方法检查是否需要屏蔽
                        if (this.isMessageBlocked(username, message)) {
                            element.style.display = 'none';
                        } else {
                            // 如果之前被屏蔽，现在不需要屏蔽，则恢复显示
                            element.style.display = '';
                        }
                    }
                });
                console.log('消息重新处理完成');
            } catch (error) {
                console.error('重新处理消息时发生错误:', error);
            }
        }
        saveBlockedWords() {
            localStorage.setItem('blockedWords', JSON.stringify(this.blockedWords));
        }
        addWord(word) {
            if (!this.blockedWords.includes(word)) {
                this.blockedWords.push(word);
                this.saveBlockedWords();
                // 立即重新处理现有消息
                this.reprocessMessages();
                return true;
            }
            return false;
        }
        removeWord(word) {
            const index = this.blockedWords.indexOf(word);
            if (index > -1) {
                this.blockedWords.splice(index, 1);
                this.saveBlockedWords();
                return true;
            }
            return false;
        }
        getWords() {
            return this.blockedWords;
        }
        addSpecialBlockedUser(username, keywords) {
            try {
                console.log('尝试添加特殊屏蔽用户:', {
                    username,
                    keywords,
                    keywordsType: typeof keywords,
                    keywordsIsArray: Array.isArray(keywords)
                });
                if (!username || !keywords || keywords.length === 0) {
                    console.error('添加特殊屏蔽用户失败：无效的输入');
                    showToast('请输入有效的用户名和关键词', 'error');
                    return false;
                }
                // 标准化关键词处理
                const processedKeywords = Array.isArray(keywords)
                    ? keywords.filter(k => k && k.trim() !== '')
                    : [keywords].filter(k => k && k.trim() !== '');
                console.log('处理后的关键词:', {
                    processedKeywords,
                    processedKeywordsLength: processedKeywords.length
                });
                // 确保 specialBlockedUsers 存在
                this.specialBlockedUsers = this.specialBlockedUsers || {};
                // 如果用户已存在，合并关键词
                if (this.specialBlockedUsers[username]) {
                    const mergedKeywords = [...new Set([
                        ...this.specialBlockedUsers[username],
                        ...processedKeywords
                    ])];
                    this.specialBlockedUsers[username] = mergedKeywords;
                } else {
                    // 新用户直接添加
                    this.specialBlockedUsers[username] = processedKeywords;
                }

                // 保存到本地存储并记录详细日志
                this.saveSpecialBlockedUsers();

                console.log('最终特殊屏蔽用户状态:', {
                    username,
                    keywords: this.specialBlockedUsers[username],
                    currentUsers: this.specialBlockedUsers
                });

                showToast(`已成功添加特殊屏蔽用户：${username}`, 'success');
                this.reprocessMessages();
                return true;
            } catch (error) {
                console.error('添加特殊屏蔽用户时发生错误:', error);
                showToast('添加特殊屏蔽用户失败', 'error');
                return false;
            }
        }
        saveSpecialBlockedUsers() {
            try {
                // 确保 specialBlockedUsers 存在且不为 null
                const dataToSave = JSON.stringify(this.specialBlockedUsers || {});
                localStorage.setItem('specialBlockedUsers', dataToSave);

                console.log('特殊屏蔽用户保存详情:', {
                    savedData: this.specialBlockedUsers,
                    dataLength: Object.keys(this.specialBlockedUsers).length
                });
            } catch (error) {
                console.error('保存特殊屏蔽用户时出错:', error);
            }
        }
        removeSpecialBlockedUser(username) {
            if (this.specialBlockedUsers && this.specialBlockedUsers[username]) {
                delete this.specialBlockedUsers[username];
                // 保存更改到本地存储
                this.saveSpecialBlockedUsers();
                console.log(`删除特殊屏蔽用户: ${username}`);
                return true;
            }
            return false;
        }
        isMessageBlocked(username, message, emojiIds, element) {
            // 1. 首先检查图片屏蔽（如果有图片元素）
            if (element && this.isBlockedImage(element)) {
                console.log('检测到被屏蔽的图片:', element);
                return true;
            }
            // 2. 检查包含匹配屏蔽词
            const hasIncludesBlockedWord = INCLUDES_BLOCKED_WORDS.some(word => {
                const isBlocked = message.includes(word);
                console.log(`检查包含匹配屏蔽词 "${word}":`, isBlocked);
                return isBlocked;
            });
            // 3. 检查完全匹配屏蔽词
            const hasExactBlockedWord = EXACT_BLOCKED_WORDS.some(word => {
                const isBlocked = message.trim().toLowerCase() === word.toLowerCase();
                console.log(`检查完全匹配屏蔽词 "${word}":`, isBlocked);
                return isBlocked;
            });
            // 4. 检查特殊用户关键词（包含匹配）
            const specialUserKeywords = this.specialBlockedUsers[username] || [];
            const hasIncludesSpecialBlockedUserKeyword = specialUserKeywords.some(keyword => {
                const isBlocked = message.includes(keyword);
                console.log(`检查特殊用户包含匹配关键词 "${keyword}":`, isBlocked);
                return isBlocked;
            });
            // 5. 检查特殊用户关键词（完全匹配）
            const hasExactSpecialBlockedUserKeyword = specialUserKeywords.some(keyword => {
                const isBlocked = message.trim().toLowerCase() === keyword.toLowerCase();
                console.log(`检查特殊用户完全匹配关键词 "${keyword}":`, isBlocked);
                return isBlocked;
            });
            // 6. 检查表情屏蔽（包含和完全匹配）
            const checkEmojiBlocked = (ids) => {
                if (!ids || ids.length === 0) return false; // 如果没有表情 ID，则返回 false
                return ids.some(id => {
                    const numId = Number(id); // 转换为数字

                    // 全局完全匹配屏蔽表情
                    const isExactGlobalBlocked = EXACT_BLOCKED_EMOJIS.includes(numId);

                    // 特定用户完全匹配屏蔽表情
                    const isExactUserSpecificBlocked =
                        (EXACT_SPECIAL_BLOCKED_USERS_EMOJIS[username] || []).includes(numId);

                    const isBlocked = isExactGlobalBlocked || isExactUserSpecificBlocked; // 判断是否被屏蔽
                    console.log(`检查表情 ${numId} 屏蔽状态:`, {
                        isExactGlobalBlocked,
                        isExactUserSpecificBlocked,
                        finalBlockedStatus: isBlocked
                    });
                    return isBlocked; // 返回是否被屏蔽
                });
            };
            const hasBlockedEmoji = checkEmojiBlocked(emojiIds);
            // 7. 检查是否有@被屏蔽的用户
            const atMatch = message.match(/@(\w+)/);
            let hasBlockedAtUser = false;
            if (atMatch) {
                const atUsername = atMatch[1];
                hasBlockedAtUser = !!this.specialBlockedUsers[atUsername];
                console.log(`检查被@用户 "${atUsername}" 屏蔽状态:`, hasBlockedAtUser);
            }
            // 8. 最终屏蔽决策
            const shouldBlock = hasIncludesBlockedWord ||
                hasExactBlockedWord ||
                hasIncludesSpecialBlockedUserKeyword ||
                hasExactSpecialBlockedUserKeyword ||
                hasBlockedEmoji ||
                hasBlockedAtUser;
            // 9. 详细的屏蔽决策日志
            console.log('message finish:', {
                hasIncludesBlockedWord,
                hasExactBlockedWord,
                hasIncludesSpecialBlockedUserKeyword,
                hasExactSpecialBlockedUserKeyword,
                hasBlockedEmoji,
                hasBlockedAtUser,
                finalDecision: shouldBlock
            });
            return shouldBlock;
        }
        addBlockedMention(username) {
            const mention = `@${username}`;
            if (!this.blockedWords.includes(mention)) {
                this.blockedWords.push(mention);
                this.saveBlockedWords();
                return true;
            }
            return false;
        }
    }
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === 'success' ? '#52c41a' : '#ff4d4f'};
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
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
            if (!MSG_ID_BLOCK_CONFIG.enabled) return; // 检查是否启用功能
            // 查找包含 msg-id 的元素
            const lottieContent = element.querySelector('.lottie[msg-id]');
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
            let username = '';
            let message = '';
            let emojiIds = [];

            // 1. 找到最外层的消息容器
            const rootMessageContainer = element.closest('.message-container');
            if (!rootMessageContainer) {
                console.log('Could not find root message container');
                return;
            }
            // 2. 提取消息的完整内容
            let fullMessage = '';
            const atElement = rootMessageContainer.querySelector('.text-element--at');
            if (atElement) {
                fullMessage += atElement.textContent.trim();
            }
            const normalTextElements = rootMessageContainer.querySelectorAll('.text-normal');
            normalTextElements.forEach(el => {
                fullMessage += ' ' + el.textContent.trim();
            });
            const markdownElement = rootMessageContainer.querySelector('.markdown-element');
            if (markdownElement) {
                fullMessage += ' ' + markdownElement.textContent.trim();
            }
            message = fullMessage.trim();
            // 3. 提取用户名
            const userNameElement = rootMessageContainer.querySelector('.user-name .text-ellipsis');
            const avatarElement = rootMessageContainer.querySelector('.avatar-span');
            if (userNameElement) {
                username = userNameElement.textContent.trim();
            } else if (avatarElement && avatarElement.getAttribute('aria-label')) {
                username = avatarElement.getAttribute('aria-label').trim();
            }
            // 4. 提取表情ID
            const extractEmojiId = (emojiElement) => {
                try {
                    const dataFaceIndex = emojiElement.getAttribute('data-face-index');
                    if (dataFaceIndex) {
                        return parseInt(dataFaceIndex);
                    }
                    const src = emojiElement.getAttribute('src');
                    if (src) {
                        const srcMatch = src.match(/\/(\d+)\/png\/\1\.png$/);
                        if (srcMatch) {
                            return parseInt(srcMatch[1]);
                        }
                        const pathMatch = src.match(/\/(\d+)\//);
                        if (pathMatch) {
                            return parseInt(pathMatch[1]);
                        }
                    }
                    return null;
                } catch (error) {
                    console.error('提取表情ID时出错:', error, emojiElement);
                    return null;
                }
            };
            // 5. 提取所有表情ID
            const emojiElements = rootMessageContainer.querySelectorAll(
                '.face-element__icon[data-face-index], .face-element__icon[src*="/Emoji/"]'
            );
            emojiIds = [];
            emojiElements.forEach(emojiElement => {
                const emojiId = extractEmojiId(emojiElement);
                if (emojiId !== null) {
                    emojiIds.push(emojiId);
                    console.log('成功提取表情ID:', emojiId);
                }
            });
            // 6. 屏蔽表情逻辑（优化性能）
            emojiElements.forEach(emojiElement => {
                const emojiId = extractEmojiId(emojiElement);
                const shouldBlockEmoji =
                    (emojiId !== null) && (
                        INCLUDES_BLOCKED_EMOJIS.includes(emojiId) ||
                        (INCLUDES_SPECIAL_BLOCKED_USERS_EMOJIS[username] || []).includes(emojiId)
                    );
                if (shouldBlockEmoji) {
                    const blockedEmoji = document.createElement('span');
                    blockedEmoji.textContent = '';
                    emojiElement.replaceWith(blockedEmoji);
                    console.log(`屏蔽表情 ID: ${emojiId}`);
                }
            });
            const messageContent = rootMessageContainer.querySelector('.message-content');
            if (messageContent && messageContent.textContent.trim() === '') {
                rootMessageContainer.style.display = 'none'; // 隐藏整个消息容器
                console.log('Blocked empty message container after blocking emoji');
            }
            // 7. 详细的调试日志
            console.log('处理消息:', {
                username,
                message,
                emojiIds,
                containerFound: !!rootMessageContainer,
                fullMessageContent: message,
                elementHTML: rootMessageContainer.outerHTML
            });
            // 8. 检查是否需要屏蔽整个消息
            if (username || message || rootMessageContainer.querySelector('.pic-element')) {
                const shouldBlock = this.blockedWordsManager.isMessageBlocked(
                    username,
                    message,
                    emojiIds,
                    rootMessageContainer
                );
                if (shouldBlock) {
                    rootMessageContainer.style.display = 'none'; // 屏蔽整个消息
                    console.log('Blocked message:', {
                        username,
                        message,
                        emojiIds,
                        isImage: !!rootMessageContainer.querySelector('.pic-element')
                    });
                    return true;
                }
            }
            this.blockMessagesWithMsgId(rootMessageContainer);
            return false; // 返回处理结果
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
    <div data-v-282aeb44="" class="name">屏蔽词查看</div>
    `;
                    navItem.addEventListener('click', () => this.showBlockedWordsModal());
                    navBar.appendChild(navItem);
                }
            }, 1000);
        }
        showBlockedWordsModal() {
            const scrollView = document.querySelector('.q-scroll-view.scroll-view--show-scrollbar.liteloader');
            if (!scrollView) return;
            scrollView.innerHTML = '';
            const container = document.createElement('div');
            container.style.cssText = `
    padding: 16px;
    background: var(--bg_bottom_standard);
    color: var(--text_primary);
    `;
            container.innerHTML = `
    <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
        <h2 style="
                        margin-bottom: 16px; 
                        color: var(--text_primary);
                        font-size: 16px;
                        font-weight: 500;
                    ">屏蔽词管理</h2>
        <h2 style="
                        margin-bottom: 16px; 
                        color: var(--text_primary);
                        font-size: 16px;
                        font-weight: 500;
                    ">(此界面无法添加与删除相关条目，一切操作在renderer.js修改)</h2>
        <div style="
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    ">
            <input type="text" id="newBlockWord" placeholder="输入要屏蔽的词" style="
                                flex: 1; 
                                padding: 8px 12px;
                                background: white;
                                color: var(--text_primary);
                                border: 1px solid #e0e0e0;
                                border-radius: 4px;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                            ">
            <button id="addWordBtn" style="
                                padding: 8px 16px;
                                background: var(--brand_standard);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            ">添加</button>
        </div>
        <ul id="blockedWordsList" style="
                        list-style: none; 
                        padding: 0; 
                        margin-bottom: 16px;
                        max-height: 200px;
                        overflow-y: auto;
                    "></ul>
    </div>
    <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                ">
        <h2 style="
                        margin-bottom: 16px; 
                        color: var(--text_primary);
                        font-size: 16px;
                        font-weight: 500;
                    ">屏蔽用户管理</h2>
    
        <div style="
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    ">
            <input type="text" id="specialUser" placeholder="输入屏蔽用户" style="
                                flex: 1; 
                                padding: 8px 12px;
                                background: white;
                                color: var(--text_primary);
                                border: 1px solid #e0e0e0;
                                border-radius: 4px;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                            ">
            <input type="text" id="specialKeywords" placeholder="输入屏蔽词" style="
                                flex: 1; 
                                padding: 8px 12px;
                                background: white;
                                color: var(--text_primary);
                                border: 1px solid #e0e0e0;
                                border-radius: 4px;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                            ">
            <button id="addSpecialUserBtn" style="
                                padding: 8px 16px;
                                background: var(--brand_standard);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            ">添加</button>
        </div>
        <ul id="specialBlockedUsersList" style="
                        list-style: none; 
                        padding: 0; 
                        margin-bottom: 16px;
                        max-height: 200px;
                        overflow-y: auto;
                    "></ul>
    </div>
    `;
            const imageBlockSection = `
    <div style="
                background: white;
                border-radius: 8px;
                padding: 16px;
                margin-top: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            ">
        <h2 style="
                    margin-bottom: 16px;
                    color: var(--text_primary);
                    font-size: 16px;
                    font-weight: 500;
                ">图片屏蔽管理</h2>
    
        <div style="
                    display: flex;
                    gap: 8px;
                    margin-bottom: 16px;
                ">
            <input type="text" id="newBlockedImage" placeholder="输入要屏蔽的图片特征" style="
                            flex: 1;
                            padding: 8px 12px;
                            background: white;
                            color: var(--text_primary);
                            border: 1px solid #e0e0e0;
                            border-radius: 4px;
                            font-size: 14px;
                        ">
            <button id="addBlockedImageBtn" style="
                            padding: 8px 16px;
                            background: var(--brand_standard);
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                        ">添加</button>
        </div>
        <ul id="blockedImagesList" style="
                    list-style: none;
                    padding: 0;
                    margin-bottom: 16px;
                    max-height: 200px;
                    overflow-y: auto;
                "></ul>
    </div>`;

            container.innerHTML += imageBlockSection;

            // 添加图片屏蔽列表渲染逻辑
            const renderBlockedImagesList = () => {
                const imagesList = container.querySelector('#blockedImagesList');
                imagesList.innerHTML = this.blockedWordsManager.blockedImages.map(image => `
    <li style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 8px;
                        border-bottom: 1px solid #eee;
                    ">
        <span>${image}</span>
        <button class="delete-image-btn" data-image="${image}" style="
                                padding: 4px 8px;
                                background: #ff4d4f;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                            ">删除</button>
    </li>
    `).join('');
            };
            scrollView.appendChild(container);
            const renderWordsList = () => {
                const wordsList = container.querySelector('#blockedWordsList');
                wordsList.innerHTML = this.blockedWordsManager.getWords().map(word => {
                    const encodedWord = word.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                    return `
    <li style="
                                margin-bottom: 8px; 
                                display: flex; 
                                justify-content: space-between; 
                                align-items: center; 
                                padding: 8px 12px; 
                                background: white; 
                                border-radius: 4px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                                border: 1px solid #f0f0f0;
                            ">
        <span style="
                                    color: var(--text_primary); 
                                    word-break: break-all;
                                    font-size: 14px;
                                ">${word}</span>
        <button class="delete-word-btn" data-word="${encodedWord}" style="
                                        padding: 4px 8px;
                                        background: #ff4d4f;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 12px;
                                        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                                    ">删除</button>
    </li>
    `;
                }).join('');
                const deleteButtons = wordsList.querySelectorAll('.delete-word-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const word = button.getAttribute('data-word');
                        this.blockedWordsManager.removeWord(word);
                        renderWordsList(); // 重新渲染列表
                    });
                });
            };
            const renderSpecialUsersList = () => {
                const specialUsersList = container.querySelector('#specialBlockedUsersList');
                specialUsersList.innerHTML = Object.entries(this.blockedWordsManager.specialBlockedUsers || {}).map(([username, keywords]) => {
                    return `
    <li style="
                        margin-bottom: 8px; 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        padding: 8px 12px; 
                        background: white; 
                        border-bottom: 1px solid #f0f0f0;
                    ">
        <span style="
                            color: var(--text_primary); 
                            word-break: break-all;
                            font-size: 14px;
                        ">${username}: ${keywords.join(', ')}</span>
        <button class="delete-special-user-btn" data-username="${username}" style="
                                        padding: 4px 8px;
                                        background: #ff4d4f;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-size: 12px;
                                    ">删除</button>
    </li>
    `;
                }).join('');
                const deleteButtons = specialUsersList.querySelectorAll('.delete-special-user-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const username = button.getAttribute('data-username');
                        this.blockedWordsManager.removeSpecialBlockedUser(username);
                        renderSpecialUsersList(); // 重新渲染列表
                    });
                });
            };
            renderWordsList();
            renderSpecialUsersList();
            renderBlockedImagesList();
            const input = container.querySelector('#newBlockWord');
            const addWordBtn = container.querySelector('#addWordBtn');

            const addWord = () => {
                const word = input.value.trim();
                if (word) {
                    this.blockedWordsManager.addWord(word);
                    input.value = '';
                    renderWordsList();
                }
            };
            addWordBtn.addEventListener('click', addWord);


            const addSpecialUserHandler = () => {
                const specialUserInput = container.querySelector('#specialUser');
                const specialKeywordsInput = container.querySelector('#specialKeywords');

                if (!specialUserInput || !specialKeywordsInput) {
                    console.error('未找到输入元素');
                    return;
                }
                // 简单获取输入值并去除首尾空格
                const username = specialUserInput.value.trim();
                const keyword = specialKeywordsInput.value.trim();

                // 验证输入
                if (!username) {
                    showToast('请输入用户名', 'error');
                    return;
                }
                if (!keyword) {
                    showToast('请输入关键词', 'error');
                    return;
                }

                // 添加特殊屏蔽用户，传入单个关键词
                const result = this.blockedWordsManager.addSpecialBlockedUser(username, [keyword]);
                if (result) {
                    // 清空输入框
                    specialUserInput.value = '';
                    specialKeywordsInput.value = '';
                    // 重新渲染特殊屏蔽用户列表
                    renderSpecialUsersList();
                }
            };



            const addSpecialUserBtn = container.querySelector('#addSpecialUserBtn');
            if (addSpecialUserBtn) {
                addSpecialUserBtn.addEventListener('click', addSpecialUserHandler);
            }
            const emojiManageBlock = `
    <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-top: 16px;
                ">
        <h2 style="
                        margin-bottom: 16px; 
                        color: var(--text_primary);
                        font-size: 16px;
                        font-weight: 500;
                    ">表情屏蔽管理</h2>
    
        <div style="
                        display: flex;
                        gap: 8px;
                        margin-bottom: 16px;
                    ">
            <input type="text" id="newBlockEmoji" placeholder="输入要屏蔽的表情ID" style="
                                flex: 1; 
                                padding: 8px 12px;
                                background: white;
                                color: var(--text_primary);
                                border: 1px solid #e0e0e0;
                                border-radius: 4px;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                            ">
            <button id="addEmojiBtn" style="
                                padding: 8px 16px;
                                background: var(--brand_standard);
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                            ">添加</button>
        </div>
        <ul id="blockedEmojisList" style="
                        list-style: none; 
                        padding: 0; 
                        margin-bottom: 16px;
                        max-height: 200px;
                        overflow-y: auto;
                    "></ul>
    </div>
    <div style="
            background: white;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin-top: 16px;
        ">
        <h2 style="
                margin-bottom: 16px; 
                color: var(--text_primary);
                font-size: 16px;
                font-weight: 500;
            ">特定用户表情屏蔽管理</h2>
    
        <div style="
                display: flex;
                gap: 8px;
                margin-bottom: 16px;
            ">
            <input type="text" id="specialUserEmoji" placeholder="输入用户名" style="
                        flex: 1; 
                        padding: 8px 12px;
                        background: white;
                        color: var(--text_primary);
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        font-size: 14px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    ">
            <input type="text" id="specialEmojiId" placeholder="输入表情ID" style="
                        flex: 1; 
                        padding: 8px 12px;
                        background: white;
                        color: var(--text_primary);
                        border: 1px solid #e0e0e0;
                        border-radius: 4px;
                        font-size: 14px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                    ">
            <button id="addSpecialEmojiBtn" style="
                        padding: 8px 16px;
                        background: var(--brand_standard);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    ">添加</button>
        </div>
        <ul id="specialBlockedEmojisList" style="
                list-style: none; 
                padding: 0; 
                margin-bottom: 16px;
                max-height: 200px;
                overflow-y: auto;
            "></ul>
    </div>
    `;
            // 将表情屏蔽管理块添加到容器中
            container.innerHTML += emojiManageBlock;
            // 表情列表渲染函数
            const renderEmojisList = () => {
                const emojisList = container.querySelector('#blockedEmojisList');
                emojisList.innerHTML = this.blockedWordsManager.blockedEmojis.map(emojiId => {
                    return `
    <li style="
                            margin-bottom: 8px; 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: center; 
                            padding: 8px 12px; 
                            background: white; 
                            border-radius: 4px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                            border: 1px solid #f0f0f0;
                        ">
        <span style="
                                color: var(--text_primary); 
                                word-break: break-all;
                                font-size: 14px;
                            ">${emojiId}</span>
        <button class="delete-emoji-btn" data-emoji-id="${emojiId}" style="
                                    padding: 4px 8px;
                                    background: #ff4d4f;
                                    color: white;
                                    border: none;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    font-size: 12px;
                                    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                                ">删除</button>
    </li>
    `;
                }).join('');
                const deleteButtons = emojisList.querySelectorAll('.delete-emoji-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const emojiId = parseInt(button.getAttribute('data-emoji-id'));
                        this.blockedWordsManager.removeEmoji(emojiId);
                        renderEmojisList(); // 重新渲染列表
                    });
                });
            };
            // 添加渲染特定用户表情屏蔽列表的函数
            const renderSpecialBlockedEmojisList = () => {
                const specialEmojisList = container.querySelector('#specialBlockedEmojisList');
                specialEmojisList.innerHTML = Object.entries(this.blockedWordsManager.specialBlockedUsersEmojis || {}).map(([username, emojiIds]) => {
                    return `
    <li style="
                    margin-bottom: 8px; 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 8px 12px; 
                    background: white; 
                    border-radius: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #f0f0f0;
                ">
        <span style="
                        color: var(--text_primary); 
                        word-break: break-all;
                        font-size: 14px;
                    ">${username}: ${emojiIds.join(', ')}</span>
        <button class="delete-special-emoji-btn" data-username="${username}" style="
                            padding: 4px 8px;
                            background: #ff4d4f;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 12px;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                        ">删除</button>
    </li>
    `;
                }).join('');
                const deleteButtons = specialEmojisList.querySelectorAll('.delete-special-emoji-btn');
                deleteButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const username = button.getAttribute('data-username');
                        this.blockedWordsManager.removeSpecialBlockedUserEmojis(username);
                        renderSpecialBlockedEmojisList(); // 重新渲染列表
                    });
                });
            };
            // 添加特定用户表情屏蔽的处理函数
            const addSpecialEmojiHandler = () => {
                const specialUserInput = container.querySelector('#specialUserEmoji');
                const specialEmojiIdInput = container.querySelector('#specialEmojiId');
                if (!specialUserInput || !specialEmojiIdInput) {
                    console.error('未找到输入元素');
                    return;
                }
                const username = specialUserInput.value.trim();
                const emojiId = parseInt(specialEmojiIdInput.value.trim());
                if (!username) {
                    showToast('请输入用户名', 'error');
                    return;
                }
                if (isNaN(emojiId)) {
                    showToast('请输入有效的表情ID', 'error');
                    return;
                }
                // 添加特定用户的表情屏蔽
                const result = this.blockedWordsManager.addSpecialBlockedUserEmoji(username, emojiId);
                if (result) {
                    // 清空输入框
                    specialUserInput.value = '';
                    specialEmojiIdInput.value = '';
                    // 重新渲染特定用户表情屏蔽列表
                    renderSpecialBlockedEmojisList();
                }
            };
            // 初始渲染特定用户表情屏蔽列表
            renderSpecialBlockedEmojisList();
            // 添加表情的处理函数
            const addEmoji = () => {
                const emojiInput = container.querySelector('#newBlockEmoji');
                const emojiId = parseInt(emojiInput.value.trim());

                if (!isNaN(emojiId)) {
                    this.blockedWordsManager.addEmoji(emojiId);
                    emojiInput.value = '';
                    renderEmojisList();
                } else {
                    showToast('请输入有效的表情ID', 'error');
                }
            };
            renderEmojisList();
            // 绑定添加表情按钮事件
            const addSpecialEmojiBtn = container.querySelector('#addSpecialEmojiBtn');
            if (addSpecialEmojiBtn) {
                addSpecialEmojiBtn.addEventListener('click', addSpecialEmojiHandler);
            }
            // 初始渲染表情列表
            renderEmojisList();
        }
    }
    let messageBlocker = null;
    function initialize() {
        console.log('MessageBlocker renderer loaded');
        messageBlocker = new MessageBlocker();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
