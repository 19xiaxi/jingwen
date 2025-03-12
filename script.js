var active_z = 10;
var flippedPages = [];
var totalPages = $('.now_page').length;
var currentPage = 0;

function initBook() {
    $('.book').removeClass('book-position-left book-position-right').addClass('book-position-center');
}

$(document).ready(function() {
    initBook();
});

$('.now_page').click(function(){
    var $this = $(this);
    var $book = $('.book');
    var pageIndex = $('.now_page').index(this);
    var isCoverPage = $this.hasClass('cover-page'); // 使用类名判断是否为封面
    var isBackCoverPage = $this.hasClass('back-cover-page'); // 判断是否为封底
    var totalPageCount = $('.now_page').length;
    
    console.log('当前点击页面索引: ' + pageIndex + ', 总页数: ' + totalPageCount + ', 当前页: ' + currentPage);
    
    if($this.hasClass('flip-animation-start')){
        // 关闭页面逻辑 - 右翻（向前翻）
        $this.removeClass('flip-animation-start').addClass('flip-animation-end').css('z-index', 0);
        flippedPages.pop();
        active_z--;
        currentPage--;
    
        // 位置调整 - 只在闭合书本和打开书本时移动位置
        if (flippedPages.length === 0) {
            // 回到封面状态，书本居中
            $book.removeClass('book-position-left book-position-right').addClass('book-position-center');
            console.log('回到封面，书本居中');
        } else if (flippedPages.length === totalPages - 1) {
            // 回到封底状态，书本居中
            $book.removeClass('book-position-left book-position-right').addClass('book-position-center');
            console.log('回到封底，书本居中');
        }
        // 其他翻页情况保持书本位置不变
    } else {
        // 打开页面逻辑 - 左翻（向后翻）
        $this.removeClass('flip-animation-end').addClass('flip-animation-start').css('z-index', active_z);
        
        if (!$this.hasClass('flipped-page')) {
            flippedPages.push($this);
            currentPage++;
            
            // 根据当前页面在书本中的位置决定书本位置 - 只在特定情况下移动
            if (pageIndex === 0) {
                // 翻开封面，书本偏右
                $book.removeClass('book-position-center book-position-left').addClass('book-position-right');
                console.log('翻开封面，书本偏右');
            } else if (pageIndex === totalPageCount - 1) {
                // 翻到封底，书本偏左
                $book.removeClass('book-position-center book-position-right').addClass('book-position-left');
                console.log('翻到封底，书本偏左');
            }
            // 其他翻页情况保持书本位置不变
            
            // 在动画结束后添加flipped-page类
            setTimeout(function() {
                $this.addClass('flipped-page');
            }, 3000);
        }
        active_z++;
    }
    
    // 更新当前页面状态信息
    console.log('翻页后状态 - 当前页: ' + currentPage + ', 已翻页数: ' + flippedPages.length);
}
);