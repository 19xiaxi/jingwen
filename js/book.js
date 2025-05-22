document.addEventListener('DOMContentLoaded', function() {
    // 书本配置
    const bookConfig = {
        totalPages: 10,  // 总页数（不包括封面和封底）
        currentPage: 0,  // 当前页（0表示封面）
        pagesContent: [], // 页面内容将从服务器加载
        bookmarks: []     // 书签
    };
    
    // DOM元素
    const book = document.getElementById('book');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const pageNum = document.getElementById('page-num');
    const totalPages = document.getElementById('total-pages');
    const tocList = document.getElementById('toc');
    const bookmarksList = document.getElementById('bookmarks-list');
    
    // 初始化
    function init() {
        // 加载保存的进度
        loadProgress();
        
        // 设置总页数
        totalPages.textContent = bookConfig.totalPages + 2; // +2 是因为有封面和封底
        
        // 创建页面
        createPages();
        
        // 更新当前页码
        updatePageNumber();
        
        // 创建目录
        createTableOfContents();
        
        // 加载书签
        loadBookmarks();
        
        // 添加事件监听
        addEventListeners();
        
        // 初始化触摸手势
        initTouchGestures();
    }
    
    // 创建页面
    function createPages() {
        // 清空现有页面（保留封面和封底）
        const pages = book.querySelectorAll('.page:not(.cover-front):not(.cover-back)');
        pages.forEach(page => page.remove());
        
        // 创建新页面
        for (let i = 0; i < bookConfig.totalPages; i++) {
            const pageIndex = i + 1; // 页码从1开始（0是封面）
            
            // 创建页面元素
            const page = document.createElement('div');
            page.className = 'page';
            page.dataset.index = pageIndex;
            
            // 如果当前页小于当前打开的页，则添加翻转类
            if (pageIndex < bookConfig.currentPage) {
                page.classList.add('flipped');
            }
            
            // 创建页面内容
            const frontContent = document.createElement('div');
            frontContent.className = 'page-content page-front';
            
            const backContent = document.createElement('div');
            backContent.className = 'page-content page-back';
            
            // 添加页码
            const frontPageNumber = document.createElement('div');
            frontPageNumber.className = 'page-number';
            frontPageNumber.textContent = pageIndex;
            frontContent.appendChild(frontPageNumber);
            
            const backPageNumber = document.createElement('div');
            backPageNumber.className = 'page-number';
            backPageNumber.textContent = pageIndex + 1;
            backContent.appendChild(backPageNumber);
            
            // 懒加载页面内容
            loadPageContent(pageIndex, frontContent, backContent);
            
            // 检查是否有书签
            if (bookConfig.bookmarks.includes(pageIndex)) {
                const bookmark = document.createElement('div');
                bookmark.className = 'bookmark-indicator';
                page.appendChild(bookmark);
            }
            
            // 将内容添加到页面
            page.appendChild(frontContent);
            page.appendChild(backContent);
            
            // 将页面添加到书本
            book.insertBefore(page, book.querySelector('.cover-back'));
        }
        
        // 设置z-index，使页面正确叠放
        updatePageZIndex();
    }
    
    // 懒加载页面内容
    function loadPageContent(pageIndex, frontElement, backElement) {
        // 创建占位内容
        frontElement.innerHTML += `<h2>第${pageIndex}页</h2><p>加载中...</p>`;
        backElement.innerHTML += `<h2>第${pageIndex + 1}页</h2><p>加载中...</p>`;
        
        // 使用Intersection Observer检测页面是否可见
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 页面可见时加载实际内容
                    fetchPageContent(pageIndex).then(content => {
                        if (content.front) {
                            frontElement.innerHTML = content.front;
                            frontElement.appendChild(frontPageNumber);
                        }
                        
                        if (content.back) {
                            backElement.innerHTML = content.back;
                            backElement.appendChild(backPageNumber);
                        }
                        
                        // 初始化页面上的交互元素
                        initInteractiveElements(frontElement);
                        initInteractiveElements(backElement);
                    });
                    
                    // 停止观察
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // 开始观察
        observer.observe(frontElement);
    }
    
    // 模拟从服务器获取页面内容
    function fetchPageContent(pageIndex) {
        return new Promise(resolve => {
            // 模拟网络延迟
            setTimeout(() => {
                // 这里应该是从服务器获取内容，现在使用模拟数据
                const content = {
                    front: `
                        <h2>第${pageIndex}页</h2>
                        <p>这是第${pageIndex}页的内容。您可以在这里放置文本、图片和交互元素。</p>
                        <div class="interactive-element" data-mechanic="pull" data-id="mechanic_${pageIndex}_1">
                            <img src="assets/images/placeholder.jpg" alt="交互元素" data-src="assets/images/mechanic_${pageIndex}.jpg">
                            <p>点击此处触发交互</p>
                        </div>
                    `,
                    back: `
                        <h2>第${pageIndex + 1}页</h2>
                        <p>这是第${pageIndex + 1}页的内容。翻页效果让阅读体验更加真实。</p>
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                             data-src="assets/images/page_${pageIndex + 1}.jpg" alt="页面图片">
                    `
                };
                resolve(content);
            }, 300);
        });
    }
    
    // 初始化页面上的交互元素
    function initInteractiveElements(element) {
        const interactiveElements = element.querySelectorAll('.interactive-element');
        
        interactiveElements.forEach(el => {
            el.addEventListener('click', function() {
                const mechanicType = this.dataset.mechanic;
                const mechanicId = this.dataset.id;
                
                // 触发机关事件
                const event = new CustomEvent('mechanic_trigger', {
                    detail: {
                        type: mechanicType,
                        id: mechanicId,
                        element: this
                    }
                });
                document.dispatchEvent(event);
            });
        });
    }
    
    // 翻到指定页
    function goToPage(pageIndex) {
        // 确保页码在有效范围内
        pageIndex = Math.max(0, Math.min(pageIndex, bookConfig.totalPages + 1));
        
        // 获取所有页面
        const pages = book.querySelectorAll('.page');
        
        // 更新页面状态
        pages.forEach(page => {
            const index = parseInt(page.dataset.index || 0);
            
            // 封面特殊处理
            if (page.classList.contains('cover-front')) {
                if (pageIndex > 0) {
                    page.classList.add('flipped');
                } else {
                    page.classList.remove('flipped');
                }
                return;
            }
            
            // 封底特殊处理
            if (page.classList.contains('cover-back')) {
                return;
            }
            
            // 普通页面
            if (index < pageIndex) {
                page.classList.add('flipped');
            } else {
                page.classList.remove('flipped');
            }
        });
        
        // 更新当前页
        bookConfig.currentPage = pageIndex;
        
        // 更新页码显示
        updatePageNumber();
        
        // 更新页面z-index
        updatePageZIndex();
        
        // 保存进度
        saveProgress();
        
        // 触发页面切换事件
        const event = new CustomEvent('page_flip', {
            detail: {
                fromPage: bookConfig.currentPage,
                toPage: pageIndex
            }
        });
        document.dispatchEvent(event);
    }
    
    // 更新页码显示
    function updatePageNumber() {
        // 显示当前页码（封面是第0页，所以+1）
        pageNum.textContent = bookConfig.currentPage + 1;
        
        // 更新按钮状态
        prevBtn.disabled = bookConfig.currentPage <= 0;
        nextBtn.disabled = bookConfig.currentPage >= bookConfig.totalPages + 1;
        
        // 更新目录激活状态
        updateTocActiveState();
    }
    
    // 更新页面z-index，确保正确的叠放顺序
    function updatePageZIndex() {
        const pages = book.querySelectorAll('.page');
        const currentPage = bookConfig.currentPage;
        
        pages.forEach(page => {
            const index = parseInt(page.dataset.index || 0);
            
            // 封面特殊处理
            if (page.classList.contains('cover-front')) {
                page.style.zIndex = currentPage === 0 ? bookConfig.totalPages + 2 : 1;
                return;
            }
            
            // 封底特殊处理
            if (page.classList.contains('cover-back')) {
                page.style.zIndex = currentPage === bookConfig.totalPages + 1 ? bookConfig.totalPages + 2 : 1;
                return;
            }
            
            // 计算z-index：当前页和下一页拥有最高层级
            if (index === currentPage) {
                page.style.zIndex = bookConfig.totalPages + 1;
            } else if (index === currentPage + 1) {
                page.style.zIndex = bookConfig.totalPages;
            } else {
                // 其他页面按照与当前页的距离设置层级
                page.style.zIndex = bookConfig.totalPages - Math.abs(index - currentPage);
            }
        });
    }
    
    // 创建目录
    function createTableOfContents() {
        tocList.innerHTML = '';
        
        // 添加封面
        const coverItem = document.createElement('li');
        coverItem.textContent = '封面';
        coverItem.dataset.page = 0;
        tocList.appendChild(coverItem);
        
        // 添加内容页
        for (let i = 1; i <= bookConfig.totalPages; i += 2) {
            const item = document.createElement('li');
            item.textContent = `第${i}-${i+1}页`;
            item.dataset.page = i;
            tocList.appendChild(item);
        }
        
        // 添加封底
        const backCoverItem = document.createElement('li');
        backCoverItem.textContent = '封底';
        backCoverItem.dataset.page = bookConfig.totalPages + 1;
        tocList.appendChild(backCoverItem);
        
        // 添加点击事件
        tocList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', function() {
                const pageIndex = parseInt(this.dataset.page);
                goToPage(pageIndex);
            });
        });
        
        // 更新激活状态
        updateTocActiveState();
    }
    
    // 更新目录激活状态
    function updateTocActiveState() {
        const items = tocList.querySelectorAll('li');
        items.forEach(item => {
            const pageIndex = parseInt(item.dataset.page);
            
            if (pageIndex === bookConfig.currentPage || 
                (pageIndex === bookConfig.currentPage - 1 && bookConfig.currentPage % 2 === 0)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    // 添加/移除书签
    function toggleBookmark() {
        const currentPage = bookConfig.currentPage;
        
        // 不能为封面或封底添加书签
        if (currentPage === 0 || currentPage > bookConfig.totalPages) {
            return;
        }
        
        // 检查是否已有书签
        const bookmarkIndex = bookConfig.bookmarks.indexOf(currentPage);
        
        if (bookmarkIndex === -1) {
            // 添加书签
            bookConfig.bookmarks.push(currentPage);
            
            // 添加书签指示器
            const currentPageElement = book.querySelector(`.page[data-index="${currentPage}"]`);
            if (currentPageElement) {
                const bookmark = document.createElement('div');
                bookmark.className = 'bookmark-indicator';
                currentPageElement.appendChild(bookmark);
            }
        } else {
            // 移除书签
            bookConfig.bookmarks.splice(bookmarkIndex, 1);
            
            // 移除书签指示器
            const currentPageElement = book.querySelector(`.page[data-index="${currentPage}"]`);
            if (currentPageElement) {
                const bookmark = currentPageElement.querySelector('.bookmark-indicator');
                if (bookmark) {
                    bookmark.remove();
                }
            }
        }
        
        // 保存书签
        saveBookmarks();
        
        // 更新书签列表
        updateBookmarksList();
    }
    
    // 更新书签列表
    function updateBookmarksList() {
        bookmarksList.innerHTML = '';
        
        if (bookConfig.bookmarks.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = '没有书签';
            bookmarksList.appendChild(emptyItem);
            return;
        }
        
        // 排序书签
        const sortedBookmarks = [...bookConfig.bookmarks].sort((a, b) => a - b);
        
        // 添加书签项
        sortedBookmarks.forEach(pageIndex => {
            const item = document.createElement('li');
            item.textContent = `第${pageIndex}页`;
            item.dataset.page = pageIndex;
            
            // 添加删除按钮
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '×';
            deleteBtn.className = 'delete-bookmark';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // 从书签数组中移除
                const index = bookConfig.bookmarks.indexOf(pageIndex);
                if (index !== -1) {
                    bookConfig.bookmarks.splice(index, 1);
                }
                
                // 移除书签指示器
                const pageElement = book.querySelector(`.page[data-index="${pageIndex}"]`);
                if (pageElement) {
                    const bookmark = pageElement.querySelector('.bookmark-indicator');
                    if (bookmark) {
                        bookmark.remove();
                    }
                }
                
                // 保存并更新列表
                saveBookmarks();
                updateBookmarksList();
            });
            
            item.appendChild(deleteBtn);
            bookmarksList.appendChild(item);
            
            // 添加点击事件
            item.addEventListener('click', function() {
                const pageIndex = parseInt(this.dataset.page);
                goToPage(pageIndex);
            });
        });
    }
    
    // 保存阅读进度
    function saveProgress() {
        localStorage.setItem('book_current_page', bookConfig.currentPage);
    }
    
    // 加载阅读进度
    function loadProgress() {
        const savedPage = localStorage.getItem('book_current_page');
        if (savedPage !== null) {
            bookConfig.currentPage = parseInt(savedPage);
        }
    }
    
    // 保存书签
    function saveBookmarks() {
        localStorage.setItem('book_bookmarks', JSON.stringify(bookConfig.bookmarks));
    }
    
    // 加载书签
    function loadBookmarks() {
        const savedBookmarks = localStorage.getItem('book_bookmarks');
        if (savedBookmarks) {
            bookConfig.bookmarks = JSON.parse(savedBookmarks);
            updateBookmarksList();
        }
    }
    
    // 初始化触摸手势
    function initTouchGestures() {
        const hammertime = new Hammer(book);
        
        // 配置识别器
        hammertime.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
        
        // 滑动翻页
        hammertime.on('swipeleft', function() {
            if (bookConfig.currentPage < bookConfig.totalPages + 1) {
                goToPage(bookConfig.currentPage + 1);
            }
        });
        
        hammertime.on('swiperight', function() {
            if (bookConfig.currentPage > 0) {
                goToPage(bookConfig.currentPage - 1);
            }
        });
        
        // 拖拽翻页
        let isDragging = false;
        let startX = 0;
        let currentPageElement = null;
        
        hammertime.on('panstart', function(e) {
            // 获取当前页面元素
            if (bookConfig.currentPage === 0) {
                currentPageElement = book.querySelector('.cover-front');
            } else if (bookConfig.currentPage === bookConfig.totalPages + 1) {
                return; // 已经到封底，不能再翻页
            } else {
                currentPageElement = book.querySelector(`.page[data-index="${bookConfig.currentPage}"]`);
            }
            
            if (!currentPageElement) return;
            
            isDragging = true;
            startX = e.center.x;
            
            // 添加拖拽中的类
            currentPageElement.classList.add('dragging');
        });
        
        hammertime.on('panmove', function(e) {
            if (!isDragging || !currentPageElement) return;
            
            // 计算拖拽角度（0-180度）
            const deltaX = e.center.x - startX;
            const bookWidth = book.offsetWidth;
            const percentage = Math.min(Math.max(deltaX / bookWidth, 0), 1);
            const angle = percentage * 180;
            
            // 应用旋转
            if (bookConfig.currentPage === 0) {
                // 封面特殊处理
                currentPageElement.style.transform = `rotateY(${angle}deg)`;
            } else {
                // 普通页面
                currentPageElement.style.transform = `rotateY(${angle}deg)`;
            }
        });
        
        hammertime.on('panend', function(e) {
            if (!isDragging || !currentPageElement) return;
            
            isDragging = false;
            
            // 计算最终位置
            const deltaX = e.center.x - startX;
            const bookWidth = book.offsetWidth;
            const percentage = deltaX / bookWidth;
            
            // 移除拖拽中的类
            currentPageElement.classList.remove('dragging');
            
            // 重置变换
            currentPageElement.style.transform = '';
            
            // 根据拖拽距离决定是否翻页
            if (percentage > 0.25) {
                // 向右拖拽超过25%，向前翻页
                if (bookConfig.currentPage > 0) {
                    goToPage(bookConfig.currentPage - 1);
                }
            } else if (percentage < -0.25) {
                // 向左拖拽超过25%，向后翻页
                if (bookConfig.currentPage < bookConfig.totalPages + 1) {
                    goToPage(bookConfig.currentPage + 1);
                }
            }
        });
    }
    
    // 添加事件监听
    function addEventListeners() {
        // 上一页按钮
        prevBtn.addEventListener('click', function() {
            if (bookConfig.currentPage > 0) {
                goToPage(bookConfig.currentPage - 1);
            }
        });
        
        // 下一页按钮
        nextBtn.addEventListener('click', function() {
            if (bookConfig.currentPage < bookConfig.totalPages + 1) {
                goToPage(bookConfig.currentPage + 1);
            }
        });
        
        // 书签按钮
        bookmarkBtn.addEventListener('click', toggleBookmark);
        
        // 键盘翻页
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                // 左箭头或上箭头：上一页
                if (bookConfig.currentPage > 0) {
                    goToPage(bookConfig.currentPage - 1);
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                // 右箭头或下箭头：下一页
                if (bookConfig.currentPage < bookConfig.totalPages + 1) {
                    goToPage(bookConfig.currentPage + 1);
                }
            } else if (e.key === 'Home') {
                // Home键：回到封面
                goToPage(0);
            } else if (e.key === 'End') {
                // End键：跳到封底
                goToPage(bookConfig.totalPages + 1);
            } else if (e.key === 'b') {
                // B键：添加/移除书签
                toggleBookmark();
            }
        });
        
        // 窗口大小变化时更新布局
        window.addEventListener('resize', function() {
            // 更新书本尺寸
            updateBookSize();
        });
        
        // 监听机关触发事件
        document.addEventListener('mechanic_trigger', function(e) {
            const { type, id, element } = e.detail;
            console.log(`机关触发: ${type}, ID: ${id}`);
            
            // 这里可以添加机关触发后的效果
            element.classList.add('triggered');
            
            // 延迟后移除效果
            setTimeout(() => {
                element.classList.remove('triggered');
            }, 2000);
        });
    }
    
    // 更新书本尺寸
    function updateBookSize() {
        // 根据窗口大小调整书本尺寸
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 计算合适的书本尺寸
        const bookWidth = Math.min(windowWidth * 0.8, 1000);
        const bookHeight = Math.min(windowHeight * 0.8, 700);
        
        // 应用尺寸
        book.style.width = `${bookWidth}px`;
        book.style.height = `${bookHeight}px`;
    }
    
    // 初始化书本尺寸
    updateBookSize();
    
    // 初始化
    init();
});