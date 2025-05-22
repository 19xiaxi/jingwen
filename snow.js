document.addEventListener('DOMContentLoaded', function() {
    const snowContainer = document.createElement('div');
    snowContainer.className = 'snow-container';
    document.body.appendChild(snowContainer);
    
    // 雪花字符
    const snowflakes = ['❄', '❅', '❆', '✻', '✼', '❄', '❅', '❆'];
    
    // 配置参数
    const maxSnowflakes = 50;  // 最大雪花数量
    const spawnInterval = 200; // 生成间隔(毫秒)
    
    let snowflakeCount = 0;
    
    // 定时生成雪花
    const snowflakeGenerator = setInterval(function() {
        if (snowflakeCount >= maxSnowflakes) {
            return;
        }
        
        createSnowflake();
    }, spawnInterval);
    
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // 随机选择雪花字符
        const snowflakeChar = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.innerHTML = snowflakeChar;
        
        // 随机位置、大小和动画延迟
        const startPositionLeft = Math.random() * 100; // 随机水平位置(%)
        const size = Math.random() * 24 + 10; // 随机大小(10-34px)
        const animationDelay = Math.random() * 10; // 随机延迟(0-10s)
        const animationDuration = Math.random() * 5 + 8; // 随机持续时间(8-13s)
        
        // 应用样式
        snowflake.style.left = startPositionLeft + '%';
        snowflake.style.fontSize = size + 'px';
        snowflake.style.animationDelay = animationDelay + 's';
        snowflake.style.animationDuration = animationDuration + 's, ' + (animationDuration / 3) + 's';
        snowflake.style.opacity = Math.random() * 0.5 + 0.5; // 随机透明度(0.5-1)
        
        // 添加到容器
        snowContainer.appendChild(snowflake);
        snowflakeCount++;
        
        // 动画结束后移除雪花
        setTimeout(function() {
            snowflake.remove();
            snowflakeCount--;
        }, animationDuration * 1000);
    }
});