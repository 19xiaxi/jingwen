document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有机关
    initHeartMechanic();
    initCombinationLock();
    initPopupElements();
    
    // 心形拉动机关
    function initHeartMechanic() {
        const heartMechanic = document.querySelector('.mechanic-heart');
        if (!heartMechanic) return;
        
        heartMechanic.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const target = document.querySelector(targetId);
            const wirePath = this.querySelector('.wire-path');
            const soundFile = this.getAttribute('data-sound');
            
            // 播放声音
            if (soundFile) {
                const audio = new Audio(soundFile);
                audio.play().catch(e => console.log('无法播放音频:', e));
            }
            
            // 拉动动画
            gsap.to(this, {
                y: 50,
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    // 显示线条
                    wirePath.style.height = '100px';
                    
                    // 延迟后显示照片
                    setTimeout(() => {
                        target.classList.add('revealed');
                        
                        // 加载照片
                        loadMemoryPhotos();
                    }, 500);
                }
            });
        });
    }
    
    // 加载记忆照片
    function loadMemoryPhotos() {
        const photoContainer = document.querySelector('.memory-photos');
        if (!photoContainer) return;
        
        // 模拟照片数据
        const photos = [
            { color: '#ffb8b8' },
            { color: '#ffd8b8' },
            { color: '#ffffb8' },
            { color: '#b8ffb8' },
            { color: '#b8ffff' },
            { color: '#b8b8ff' },
            { color: '#ffb8ff' },
            { color: '#d8d8d8' }
        ];
        
        // 清空容器
        photoContainer.innerHTML = '';
        
        // 添加照片并设置动画延迟
        photos.forEach((photo, index) => {
            const photoElement = document.createElement('div');
            photoElement.className = 'memory-photo';
            photoElement.style.backgroundColor = photo.color;
            photoContainer.appendChild(photoElement);
            
            // 设置延迟动画
            setTimeout(() => {
                photoElement.classList.add('animated');
            }, 100 * index);
        });
    }
    
    // 密码锁机关
    function initCombinationLock() {
        const lockCanvas = document.getElementById('combination-lock');
        if (!lockCanvas) return;
        
        const ctx = lockCanvas.getContext('2d');
        const digits = parseInt(lockCanvas.getAttribute('data-digits')) || 4;
        const solution = lockCanvas.getAttribute('data-solution') || '1314';
        const rewardId = lockCanvas.getAttribute('data-reward');
        
        // 设置画布尺寸
        lockCanvas.width = 200;
        lockCanvas.height = 200;
        
        // 当前密码
        let currentCode = Array(digits).fill(0);
        
        // 绘制密码锁
        function drawLock() {
            ctx.clearRect(0, 0, lockCanvas.width, lockCanvas.height);
            
            // 绘制外圈
            ctx.beginPath();
            ctx.arc(100, 100, 90, 0, Math.PI * 2);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 5;
            ctx.stroke();
            
            // 绘制数字
            ctx.font = '24px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < digits; i++) {
                const angle = (i / digits) * Math.PI * 2 - Math.PI / 2;
                const x = 100 + Math.cos(angle) * 60;
                const y = 100 + Math.sin(angle) * 60;
                
                // 绘制数字背景
                ctx.beginPath();
                ctx.arc(x, y, 20, 0, Math.PI * 2);
                ctx.fillStyle = '#f0f0f0';
                ctx.fill();
                ctx.stroke();
                
                // 绘制数字
                ctx.fillStyle = '#333';
                ctx.fillText(currentCode[i].toString(), x, y);
            }
            
            // 绘制中心
            ctx.beginPath();
            ctx.arc(100, 100, 30, 0, Math.PI * 2);
            ctx.fillStyle = '#e74c3c';
            ctx.fill();
            ctx.stroke();
            
            // 检查密码
            const currentCodeString = currentCode.join('');
            if (currentCodeString === solution) {
                unlockReward();
            }
        }
        
        // 解锁奖励
        function unlockReward() {
            const reward = document.querySelector(rewardId);
            if (reward) {
                // 解锁动画
                ctx.beginPath();
                ctx.arc(100, 100, 90, 0, Math.PI * 2);
                ctx.strokeStyle = '#2ecc71';
                ctx.lineWidth = 8;
                ctx.stroke();
                
                // 显示奖励
                setTimeout(() => {
                    reward.classList.add('revealed');
                }, 500);
            }
        }
        
        // 点击事件
        lockCanvas.addEventListener('click', function(e) {
            const rect = lockCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 检查是否点击了数字
            for (let i = 0; i < digits; i++) {
                const angle = (i / digits) * Math.PI * 2 - Math.PI / 2;
                const digitX = 100 + Math.cos(angle) * 60;
                const digitY = 100 + Math.sin(angle) * 60;
                
                const distance = Math.sqrt(Math.pow(x - digitX, 2) + Math.pow(y - digitY, 2));
                if (distance <= 20) {
                    // 增加数字
                    currentCode[i] = (currentCode[i] + 1) % 10;
                    drawLock();
                    break;
                }
            }
        });
        
        // 初始绘制
        drawLock();
    }
    
    // 弹出元素
    function initPopupElements() {
        const popupElements = document.querySelectorAll('.popup-element');
        
        popupElements.forEach(element => {
            element.addEventListener('click', function() {
                const animation = this.getAttribute('data-animation') || 'unfold';
                
                switch (animation) {
                    case 'unfold':
                        this.classList.toggle('active');
                        break;
                    // 可以添加更多动画类型
                }
            });
        });
    }
});