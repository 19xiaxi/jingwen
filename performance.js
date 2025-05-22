document.addEventListener('DOMContentLoaded', function() {
    // 检测设备性能
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = navigator.hardwareConcurrency <= 2;
    
    // 性能配置
    const config = {
        targetFPS: isMobile ? 30 : 60,
        enableParticles: !isLowEndDevice,
        textureQuality: isMobile ? 'low' : 'high',
        maxAnimations: isMobile ? 5 : 15
    };
    
    // 应用性能设置
    applyPerformanceSettings(config);
    
    // 帧率控制
    let lastFrame = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let currentFps = 0;
    
    function gameLoop() {
        const now = performance.now();
        const timeDelta = now - lastFrame;
        
        // 帧率控制
        if (timeDelta >= 1000 / config.targetFPS) {
            // 更新动画
            updateAnimations();
            lastFrame = now;
            frameCount++;
        }
        
        // 计算FPS
        if (now - lastFpsUpdate >= 1000) {
            currentFps = frameCount;
            frameCount = 0;
            lastFpsUpdate = now;
            
            // 动态调整性能
            if (currentFps < config.targetFPS * 0.7) {
                downgradePerformance();
            }
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // 启动游戏循环
    requestAnimationFrame(gameLoop);
    
    // 应用性能设置
    function applyPerformanceSettings(config) {
        // 设置纹理质量
        document.documentElement.style.setProperty('--texture-quality', config.textureQuality);
        
        // 禁用/启用粒子效果
        if (!config.enableParticles) {
            document.querySelectorAll('.particle-effect').forEach(el => {
                el.style.display = 'none';
            });
        }
        
        // 限制同时运行的动画数量
        window.maxConcurrentAnimations = config.maxAnimations;
    }
    
    // 降级性能
    function downgradePerformance() {
        if (config.targetFPS > 30) {
            config.targetFPS -= 5;
        }
        
        if (config.maxAnimations > 3) {
            config.maxAnimations -= 2;
            window.maxConcurrentAnimations = config.maxAnimations;
        }
        
        // 禁用复杂效果
        if (config.enableParticles) {
            config.enableParticles = false;
            document.querySelectorAll('.particle-effect').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
    
    // 更新动画
    function updateAnimations() {
        // 这里可以放置需要每帧更新的动画逻辑
    }
    
    // 按需加载资源
    function lazyLoadResources() {
        // 使用Intersection Observer监测元素可见性
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // 加载图片
                    if (element.dataset.src) {
                        element.src = element.dataset.src;
                        element.removeAttribute('data-src');
                    }
                    
                    // 加载背景
                    if (element.dataset.background) {
                        element.style.backgroundImage = `url(${element.dataset.background})`;
                        element.removeAttribute('data-background');
                    }
                    
                    // 停止观察已加载的元素
                    observer.unobserve(element);
                }
            });
        });
        
        // 观察所有需要懒加载的元素
        document.querySelectorAll('[data-src], [data-background]').forEach(el => {
            observer.observe(el);
        });
    }
    
    // 初始化懒加载
    lazyLoadResources();
});