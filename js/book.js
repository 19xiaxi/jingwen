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
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const showSidebarBtn = document.getElementById('show-sidebar-btn');
    const bookContainer = document.querySelector('.book-container');
    
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
        let frontContent = '';
        let backContent = '';
        switch(pageIndex) {
            case 1:
                frontContent = `
                    <h2>初见・心动时刻</h2>
                    <p>那一天，阳光正好，微风不燥。你出现在我的世界里，像一束光照亮了我的心房。</p>
                    <div class="drawer-mechanism">
                        <button onclick="alert('抽屉打开，发现初次约会的电影票！')">拉出抽屉</button>
                        <div class="drawer-content">这里可以贴上我们的第一张电影票或咖啡杯垫。</div>
                    </div>
                    <div class="ferris-wheel">
                        <img src="assets/ferris-wheel.png" alt="摩天轮" style="width:120px;">
                        <button onclick="alert('心跳音效播放！')">旋转摩天轮</button>
                    </div>
                    <blockquote>在 37℃的夏风里，我的目光被你袖口的星芒绊住了脚。</blockquote>
                `;
                backContent = `
                    <p>那一刻的心跳，至今难忘。</p>
                    <p>扫码听见我们的心跳音效：</p>
                    <img src="assets/qrcode-heart.png" alt="心跳音效二维码" style="width:80px;">
                `;
                break;
            case 2:
                frontContent = `
                    <h2>热恋・日常碎片</h2>
                    <p>我们一起走过的日子，都是生活最温柔的注脚。那些小默契、小惊喜，串联成专属于我们的回忆。</p>
                    <div class="flip-grid">
                        <button onclick="alert('翻开，发现默契小趣事！')">翻翻页</button>
                        <div class="grid-content">9宫格日常梗：<br>同时点同款奶茶、异口同声接台词、一起看星星……</div>
                    </div>
                    <div class="slider-track">
                        <span>关键词磁贴：</span>
                        <input type="range" min="1" max="3" value="1" />
                        <span>火锅 / 猫咪 / 凌晨三点看星星</span>
                    </div>
                `;
                backContent = `
                    <p>把我们的专属密语拼出来吧！</p>
                    <p>每一个小细节，都是爱的证明。</p>
                `;
                break;
            case 3:
                frontContent = `
                    <h2>周年・承诺时刻</h2>
                    <p>一年的时光，我们一起经历了成长、磨合与陪伴。感谢你一直在我身边。</p>
                    <div class="popup-tree">
                        <button onclick="alert('立体许愿树弹出！')">打开许愿树</button>
                        <div class="tree-content">愿望卡片可抽拉，写下我们的心愿。</div>
                    </div>
                    <div class="ribbon-light">
                        <button onclick="alert('拉动丝带，小屋亮灯！')">拉动丝带</button>
                    </div>
                    <blockquote>第 365 天，想和你从‘你好’说到‘余生请多指教’。</blockquote>
                `;
                backContent = `
                    <p>扫码听见我们的周年BGM：</p>
                    <img src="assets/qrcode-anniversary.png" alt="周年BGM二维码" style="width:80px;">
                    <p>愿我们的故事，温暖且长久。</p>
                `;
                break;
            case 4:
                frontContent = `
                    <h2>未来・空白待续</h2>
                    <p>未来的路还很长，愿我们携手走过每一个春夏秋冬。</p>
                    <div class="film-notes">
                        <p>这里可以粘贴我们的拍立得照片、手绘涂鸦，记录每一个值得纪念的瞬间。</p>
                    </div>
                    <div class="envelope">
                        <button onclick="alert('打开信封，发现时间胶囊卡片！')">打开信封</button>
                        <p>写下2028年想一起完成的事，封存我们的约定。</p>
                    </div>
                `;
                backContent = `
                    <p>封口处贴上专属火漆印章，见证我们的未来。</p>
                    <p>期待与你共赴每一个明天。</p>
                `;
                break;
            default:
                frontContent = `<h2>我们的故事</h2><p>每一页都是一段温暖的回忆。</p>`;
                backContent = `<p>继续翻页，发现更多惊喜！</p>`;
        }
        frontElement.innerHTML = frontContent;
        backElement.innerHTML = backContent;
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
                
                // 添加触发效果
                this.classList.add('triggered');
                
                // 延迟后移除效果
                setTimeout(() => {
                    this.classList.remove('triggered');
                }, 2000);
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
        
        // 侧边栏隐藏按钮
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.add('hidden');
            showSidebarBtn.classList.add('visible');
            bookContainer.classList.add('full-width');
            setTimeout(updateBookSize, 300);
        });
        
        // 侧边栏显示按钮
        showSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('hidden');
            showSidebarBtn.classList.remove('visible');
            bookContainer.classList.remove('full-width');
            setTimeout(updateBookSize, 300);
        });
        
        // 键盘翻页
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                if (bookConfig.currentPage > 0) {
                    goToPage(bookConfig.currentPage - 1);
                }
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (bookConfig.currentPage < bookConfig.totalPages + 1) {
                    goToPage(bookConfig.currentPage + 1);
                }
            }
        });
        
        // 窗口大小变化时更新布局
        window.addEventListener('resize', function() {
            updateBookSize();
        });
    }
    
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
    },
    
    // 更新书本尺寸
    document.addEventListener('DOMContentLoaded', function() {
        // 侧边栏切换功能
        const sidebar = document.getElementById('sidebar');
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        const showSidebarBtn = document.getElementById('show-sidebar-btn');
        const bookContainer = document.querySelector('.book-container');
        
        // 隐藏侧边栏
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.add('hidden');
            showSidebarBtn.classList.add('visible');
            bookContainer.classList.add('full-width');
            
            // 更新书本尺寸
            setTimeout(updateBookSize, 300);
        });
        
        // 显示侧边栏
        showSidebarBtn.addEventListener('click', function() {
            sidebar.classList.remove('hidden');
            showSidebarBtn.classList.remove('visible');
            bookContainer.classList.remove('full-width');
            
            // 更新书本尺寸
            setTimeout(updateBookSize, 300);
        });
        
        // 更新书本尺寸函数中添加检查侧边栏状态
        function updateBookSize() {
            // 根据窗口大小调整书本尺寸
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // 计算合适的书本尺寸
            let bookWidth = Math.min(windowWidth * 0.8, 1000);
            
            // 如果侧边栏隐藏，可以给书本更多空间
            if (sidebar.classList.contains('hidden')) {
                bookWidth = Math.min(windowWidth * 0.9, 1200);
            }
            
            const bookHeight = Math.min(windowHeight * 0.8, 700);
            
            // 应用尺寸
            book.style.width = `${bookWidth}px`;
            book.style.height = `${bookHeight}px`;
        }
        
        // 初始化书本尺寸
        updateBookSize();
        
        // 初始化
        init();
    }),
)