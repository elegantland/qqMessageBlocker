(function () {
    // 屏蔽词管理类
    class BlockedWordsManager {
        constructor() {
            this.blockedWords = this.loadBlockedWords() || [];
            // 确保在构造函数中加载特殊屏蔽用户
            this.specialBlockedUsers = this.loadSpecialBlockedUsers() || {};
        }

        loadBlockedWords() {
            const savedWords = localStorage.getItem('blockedWords');
            const defaultWords = [
                '测试111',
                
            ];
            return savedWords ? JSON.parse(savedWords) : defaultWords;
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
        loadSpecialBlockedUsers() {
            try {
                const savedUsers = localStorage.getItem('specialBlockedUsers');
                if (!savedUsers) {
                    console.log('未找到保存的特殊屏蔽用户，初始化为空对象');
                    return {};
                }
                const parsedUsers = JSON.parse(savedUsers);
                console.log('加载的特殊屏蔽用户:', parsedUsers);
                return parsedUsers;
            } catch (error) {
                console.error('加载特殊屏蔽用户时出错:', error);
                return {};
            }
        }
        isMessageBlocked(username, message) {
            // 首先检查普通屏蔽词
            const hasBlockedWord = this.blockedWords.some(word =>
                message.toLowerCase().includes(word.toLowerCase())
            );
            // 然后检查特殊屏蔽用户
            const specialUserKeywords = this.specialBlockedUsers[username] || [];
            const hasSpecialBlockedUserKeyword = specialUserKeywords.some(keyword =>
                message.toLowerCase().includes(keyword.toLowerCase().trim())
            );
            // 输出调试信息
            console.log('屏蔽检查详情', JSON.stringify({
                username,
                message,
                specialUsers: this.specialBlockedUsers,
                hasBlockedWord,
                hasSpecialBlockedUserKeyword
            }, null, 2).replace(/\\u([\d\w]{4})/gi, (match, grp) => {
                return String.fromCharCode(parseInt(grp, 16)); 
            }));
            // 返回结果
            return hasBlockedWord || hasSpecialBlockedUserKeyword;
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
            this.targetSelector = 'div.message-container';
            this.blockedWordsManager = new BlockedWordsManager();
            this.init();
            this.setupUI();
        }
        init() {
            this.setupObserver();
            this.processExistingElements();
        }
        processExistingElements() {
            document.querySelectorAll(this.targetSelector).forEach(element => {
                this.replaceContent(element);
            });
        }
        replaceContent(element) {
            const usernameElement = element.querySelector('.avatar-span[aria-label]');
            const messageContentElement = element.querySelector('.text-element .text-normal');

            if (usernameElement && messageContentElement) {
                const username = usernameElement.getAttribute('aria-label');
                const message = messageContentElement.textContent.trim();

                // 实时检查并隐藏消息
                if (this.blockedWordsManager.isMessageBlocked(username, message)) {
                    element.style.display = 'none';
                }
            }
        }
        setupObserver() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (node.matches(this.targetSelector)) {
                                    this.replaceContent(node);
                                }
                                // 递归检查子元素
                                node.querySelectorAll(this.targetSelector).forEach(element => {
                                    this.replaceContent(element);
                                });
                            }
                        });
                    }
                });
            });
            // 持续观察整个文档
            observer.observe(document.body, {
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
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
                            </svg>
                        </i>
                        <div data-v-282aeb44="" class="name">屏蔽词管理</div>
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
                padding: 20px;
                background: var(--bg_bottom_standard);
                color: var(--text_primary);
            `;

            container.innerHTML = `
                <h2 style="margin-bottom: 15px; color: var(--text_primary);">屏蔽词管理</h2>
                <div style="margin-bottom: 15px; display: flex;">
                    <input type="text" id="newBlockWord" 
                        placeholder="输入要屏蔽的词" 
                        style="flex: 1; padding: 8px; margin-right: 10px; 
                        background: var(--bg_bottom_standard); 
                        color: var(--text_primary);
                        border: 1px solid var(--line_standard);
                        border-radius: 4px;">
                    <button id="addWordBtn" 
                        style="padding: 8px 16px;
                        background: var(--brand_standard);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;">添加</button>
                </div>
                <ul id="blockedWordsList" style="list-style: none; padding: 0; margin-bottom: 15px;"></ul>
                
                <h2 style="margin-bottom: 15px; color: var(--text_primary);">屏蔽用户管理（只会屏蔽该用户的说的某句话）</h2>
                <div style="margin-bottom: 15px; display: flex;">
                    <input type="text" id="specialUser" 
                        placeholder="输入屏蔽用户" 
                        style="flex: 1; padding: 8px; margin-right: 10px; 
                        background: var(--bg_bottom_standard); 
                        color: var(--text_primary);
                        border: 1px solid var(--line_standard);
                        border-radius: 4px;">
                    <input type="text" id="specialKeywords" 
                        placeholder="输入只属于该用户的屏蔽词" 
                        style="flex: 1; padding: 8px; margin-right: 10px; 
                        background: var(--bg_bottom_standard); 
                        color: var(--text_primary);
                        border: 1px solid var(--line_standard);
                        border-radius: 4px;">
                    <button id="addSpecialUserBtn" 
                        style="padding: 8px 16px;
                        background: var(--brand_standard);
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;">添加特殊用户</button>
                </div>
                <ul id="specialBlockedUsersList" style="list-style: none; padding: 0; margin-bottom: 15px;"></ul>
            `;

            scrollView.appendChild(container);
            const renderWordsList = () => {
                const wordsList = container.querySelector('#blockedWordsList');
                wordsList.innerHTML = this.blockedWordsManager.getWords().map(word => {
                    const encodedWord = word.replace(/'/g, '\\\'').replace(/"/g, '\\"');
                    return `
                        <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg_standard); border-radius: 4px;">
                            <span style="color: var(--text_primary); word-break: break-all;">${word}</span>
                            <button class="delete-word-btn" data-word="${encodedWord}"
                                style="padding: 4px 8px;
                                background: #ff4d4f;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                margin-left: 8px;">删除</button>
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
                        <li style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--bg_standard); border-radius: 4px;">
                            <span style="color: var(--text_primary); word-break: break-all;">${username}: ${keywords.join(', ')}</span>
                            <button class="delete-special-user-btn" data-username="${username}"
                                style="padding: 4px 8px;
                                background: #ff4d4f;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                margin-left: 8px;">删除</button>
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
