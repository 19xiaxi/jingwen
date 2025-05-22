// 花朵特效脚本

// 当文档加载完成后执行
$(document).ready(function() {
    // 初始化花朵特效
    initFlowerEffect();
});

/**
 * 初始化花朵特效
 */
function initFlowerEffect() {
    // 获取花朵容器
    const flowerContainer = $('.flower-container');
    
    // 设置花朵生成的间隔时间（毫秒）
    const flowerInterval = 300;
    
    // 设置最大同时存在的花朵数量
    const maxFlowers = 30;
    
    // 当前花朵计数
    let flowerCount = 0;
    
    // 定时生成花朵
    setInterval(function() {
        // 如果当前花朵数量小于最大数量，则生成新花朵
        if (flowerCount < maxFlowers) {
            createFlower(flowerContainer);
            flowerCount++;
        }
    }, flowerInterval);
    
    // 初始时立即生成几朵花
    for (let i = 0; i < 10; i++) {
        createFlower(flowerContainer);
        flowerCount++;
    }
}

/**
 * 创建一朵花
 * @param {jQuery} container - 花朵容器
 */
function createFlower(container) {
    // 随机选择花朵类型 (1-3)
    const flowerType = Math.floor(Math.random() * 3) + 1;
    
    // 随机选择动画类型 (1-5)
    const animationType = Math.floor(Math.random() * 5) + 1;
    
    // 随机大小 (10px - 30px)
    const size = Math.floor(Math.random() * 20) + 10;
    
    // 随机起始位置 (水平方向)
    const startPositionX = Math.floor(Math.random() * 100);
    
    // 随机透明度 (0.6 - 1)
    const opacity = Math.random() * 0.4 + 0.6;
    
    // 创建花朵元素
    const flower = $('<div></div>')
        .addClass('flower')
        .addClass('flower-' + flowerType)
        .addClass('float-' + animationType)
        .css({
            'left': startPositionX + '%',
            'bottom': '-20px',
            'width': size + 'px',
            'height': size + 'px',
            'opacity': opacity
        });
    
    // 将花朵添加到容器中
    container.append(flower);
    
    // 获取动画持续时间
    let animationDuration;
    switch (animationType) {
        case 1: animationDuration = 15000; break;
        case 2: animationDuration = 20000; break;
        case 3: animationDuration = 25000; break;
        case 4: animationDuration = 18000; break;
        case 5: animationDuration = 22000; break;
        default: animationDuration = 20000;
    }
    
    // 动画结束后移除花朵
    setTimeout(function() {
        flower.remove();
        flowerCount--;
    }, animationDuration);
}