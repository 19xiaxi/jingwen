// 初始化配置
const bookConfig = {
    currentPage: 0,
    totalPages: 8, // 封面 + 6内容页 + 封底
    animationDuration: 800
};

// 页面元素缓存
const domCache = {
    getPage: (index) => document.getElementById(
        index === 0 ? 'cover' : 
        index === bookConfig.totalPages - 1 ? 'back-cover' : 
        `page${index}`
    ),
    prevBtn: document.getElementById('prev'),
    nextBtn: document.getElementById('next')
};

// 核心翻页逻辑
function updateBookState() {
    for (let i = 0; i < bookConfig.totalPages; i++) {
        const page = domCache.getPage(i);
        page.classList.remove('active', 'flipped-left', 'flipped-right');
        
        // 封面封底特殊处理
        if (bookConfig.currentPage === 0 || bookConfig.currentPage === bookConfig.totalPages - 1) {
            page.style.zIndex = i === bookConfig.currentPage ? bookConfig.totalPages : 0;
            if (i === bookConfig.currentPage) page.classList.add('active');
            continue;
        }

        // 动态层级计算
        page.style.zIndex = bookConfig.totalPages - Math.abs(bookConfig.currentPage - i);
        
        // 双页激活状态
        if (i === bookConfig.currentPage - 1 || i === bookConfig.currentPage) {
            page.classList.add('active');
            page.classList.add(i === bookConfig.currentPage - 1 ? 'flipped-left' : 'flipped-right');
        }
    }
    
    // 按钮状态更新
    domCache.prevBtn.disabled = bookConfig.currentPage === 0;
    domCache.nextBtn.disabled = bookConfig.currentPage === bookConfig.totalPages - 1;
}

// 翻页控制
function navigate(direction) {
    let newPage = bookConfig.currentPage;
    
    if (direction === 'prev') {
        newPage = Math.max(0, 
            bookConfig.currentPage === bookConfig.totalPages - 1 ? 
            bookConfig.currentPage - 1 : 
            bookConfig.currentPage - 2
        );
    } else {
        newPage = Math.min(bookConfig.totalPages - 1,
            bookConfig.currentPage === 0 ? 
            2 : 
            bookConfig.currentPage + 2
        );
    }
    
    if (newPage !== bookConfig.currentPage) {
        bookConfig.currentPage = newPage;
        updateBookState();
    }
}

// 事件监听
domCache.prevBtn.addEventListener('click', () => navigate('prev'));
domCache.nextBtn.addEventListener('click', () => navigate('next'));

// 触摸滑动支持（移动端）
let touchStartX = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
}, false);

document.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchStartX - touchEndX;
    
    if (Math.abs(deltaX) > 50) {
        deltaX > 0 ? navigate('next') : navigate('prev');
    }
}, false);

// 键盘导航支持
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') navigate('prev');
    if (e.key === 'ArrowRight') navigate('next');
});

// 初始化
updateBookState();