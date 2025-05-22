// ... existing code ...

// 3. 拼图式机关（碎片重组）
class PuzzleMechanic extends Mechanic {
    constructor(options = {}) {
      super(Object.assign({
        puzzleSize: { width: 3, height: 3 },
        pieceSize: 2,
        image: null,
        shuffleSteps: 20
      }, options));
      
      this.pieces = [];
      this.solution = [];
      this.currentArrangement = [];
      this.init();
    }
  
    init() {
      // 创建拼图容器
      this.mesh = new THREE.Group();
      this.mesh.position.copy(this.options.position);
      this.mesh.rotation.copy(this.options.rotation);
      this.mesh.scale.copy(this.options.scale);
      
      // 加载拼图图像
      const textureLoader = new THREE.TextureLoader();
      const texture = this.options.image ? 
        textureLoader.load(this.options.image) : 
        this.createDefaultTexture();
      
      // 创建拼图碎片
      this.createPuzzlePieces(texture);
      
      // 打乱拼图
      this.shufflePieces();
      
      // 添加到场景
      if (this.options.scene) {
        this.options.scene.add(this.mesh);
      }
      
      // 加载声音
      if (this.options.sound) {
        this.loadSound('move', this.options.sound);
        this.loadSound('complete', 'puzzle_complete.mp3');
      }
      
      // 添加交互
      this.addInteraction();
    }
  
    createDefaultTexture() {
      // 创建默认纹理
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // 绘制网格
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      
      const gridSize = 8;
      const cellSize = size / gridSize;
      
      for (let i = 0; i <= gridSize; i++) {
        const pos = i * cellSize;
        
        // 水平线
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
        
        // 垂直线
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.stroke();
      }
      
      // 绘制图案
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', size / 2, size / 2);
      
      return new THREE.CanvasTexture(canvas);
    }
  
    createPuzzlePieces(texture) {
      const { width, height } = this.options.puzzleSize;
      const pieceSize = this.options.pieceSize;
      const gap = 0.1; // 碎片之间的间隙
      
      // 计算拼图总宽高
      const totalWidth = width * (pieceSize + gap) - gap;
      const totalHeight = height * (pieceSize + gap) - gap;
      
      // 清空现有碎片
      this.pieces = [];
      this.solution = [];
      
      // 创建拼图碎片
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // 创建碎片几何体
          const geometry = new THREE.BoxGeometry(pieceSize, pieceSize, 0.5);
          
          // 创建UV映射，使纹理正确分布在每个碎片上
          const uvs = geometry.attributes.uv;
          const positions = geometry.attributes.position;
          
          for (let i = 0; i < positions.count; i++) {
            const u = uvs.getX(i);
            const v = uvs.getY(i);
            
            // 调整UV坐标以匹配碎片位置
            uvs.setXY(
              i,
              x / width + (u / width),
              1 - (y / height + (v / height))
            );
          }
          
          // 创建材质
          const material = new THREE.MeshPhongMaterial({
            map: texture,
            side: THREE.DoubleSide
          });
          
          // 创建网格
          const piece = new THREE.Mesh(geometry, material);
          
          // 设置初始位置
          const posX = x * (pieceSize + gap) - totalWidth / 2 + pieceSize / 2;
          const posY = -y * (pieceSize + gap) + totalHeight / 2 - pieceSize / 2;
          piece.position.set(posX, posY, 0);
          
          // 保存碎片信息
          const pieceInfo = {
            mesh: piece,
            index: y * width + x,
            correctPosition: new THREE.Vector3(posX, posY, 0),
            currentPosition: new THREE.Vector3(posX, posY, 0)
          };
          
          this.pieces.push(pieceInfo);
          this.solution.push(pieceInfo.index);
          
          // 添加到容器
          this.mesh.add(piece);
        }
      }
      
      // 初始化当前排列
      this.currentArrangement = [...this.solution];
    }
  
    shufflePieces() {
      const { width, height } = this.options.puzzleSize;
      const totalPieces = width * height;
      
      // 随机交换碎片位置
      for (let i = 0; i < this.options.shuffleSteps; i++) {
        const index1 = Math.floor(Math.random() * totalPieces);
        const index2 = Math.floor(Math.random() * totalPieces);
        
        if (index1 !== index2) {
          this.swapPieces(index1, index2);
        }
      }
    }
  
    swapPieces(index1, index2) {
      // 交换数组中的索引
      [this.currentArrangement[index1], this.currentArrangement[index2]] = 
      [this.currentArrangement[index2], this.currentArrangement[index1]];
      
      // 获取碎片
      const piece1 = this.pieces.find(p => p.index === this.currentArrangement[index1]);
      const piece2 = this.pieces.find(p => p.index === this.currentArrangement[index2]);
      
      // 交换位置
      const tempPosition = piece1.currentPosition.clone();
      piece1.currentPosition.copy(piece2.currentPosition);
      piece2.currentPosition.copy(tempPosition);
      
      // 更新网格位置
      piece1.mesh.position.copy(piece1.currentPosition);
      piece2.mesh.position.copy(piece2.currentPosition);
      
      // 播放移动声音
      if (this.sounds['move']) {
        this.sounds['move'].play();
      }
      
      // 检查是否完成
      this.checkCompletion();
    }
  
    addInteraction() {
      // 为每个碎片添加点击事件
      this.pieces.forEach(piece => {
        piece.mesh.userData.mechanic = this;
        piece.mesh.userData.pieceIndex = piece.index;
        piece.mesh.userData.clickable = true;
      });
    }
  
    movePiece(pieceIndex) {
      // 找到碎片在当前排列中的位置
      const currentIndex = this.currentArrangement.findIndex(idx => idx === pieceIndex);
      if (currentIndex === -1) return;
      
      // 找到相邻的碎片
      const { width } = this.options.puzzleSize;
      const adjacentIndices = [
        currentIndex - width, // 上
        currentIndex + width, // 下
        currentIndex % width !== 0 ? currentIndex - 1 : -1, // 左
        currentIndex % width !== width - 1 ? currentIndex + 1 : -1 // 右
      ].filter(idx => idx >= 0 && idx < this.currentArrangement.length);
      
      // 随机选择一个相邻碎片交换
      if (adjacentIndices.length > 0) {
        const randomAdjacentIndex = adjacentIndices[Math.floor(Math.random() * adjacentIndices.length)];
        this.swapPieces(currentIndex, randomAdjacentIndex);
      }
    }
  
    checkCompletion() {
      // 检查当前排列是否与解决方案匹配
      const isComplete = this.currentArrangement.every((value, index) => value === this.solution[index]);
      
      if (isComplete && !this.isTriggered) {
        // 播放完成声音
        if (this.sounds['complete']) {
          this.sounds['complete'].play();
        }
        
        // 触发机关事件
        this.trigger({ completed: true });
      }
    }
  }
  
  // 4. 按压式机关（弹出结构）
  class PressureMechanic extends Mechanic {
    constructor(options = {}) {
      super(Object.assign({
        pressDepth: 0.5,
        popupHeight: 3,
        popupContent: null,
        pressDirection: new THREE.Vector3(0, -1, 0)
      }, options));
      
      this.originalPosition = null;
      this.pressedPosition = null;
      this.popupMesh = null;
      this.init();
    }
  
    init() {
      // 创建按钮容器
      this.mesh = new THREE.Group();
      this.mesh.position.copy(this.options.position);
      this.mesh.rotation.copy(this.options.rotation);
      this.mesh.scale.copy(this.options.scale);
      
      // 创建按钮
      this.createButton();
      
      // 创建弹出内容
      this.createPopupContent();
      
      // 添加到场景
      if (this.options.scene) {
        this.options.scene.add(this.mesh);
      }
      
      // 加载声音
      if (this.options.sound) {
        this.loadSound('press', this.options.sound);
        this.loadSound('popup', 'popup.mp3');
      }
      
      // 添加交互
      this.addInteraction();
    }
  
    // ... existing code ...

  createButton() {
    // 创建按钮几何体
    const geometry = new THREE.CylinderGeometry(
      this.options.buttonSize,
      this.options.buttonSize,
      this.options.buttonHeight,
      32
    );
    
    // 创建材质
    const material = new THREE.MeshPhongMaterial({
      color: 0xe74c3c,
      specular: 0x555555,
      shininess: 30
    });
    
    // 创建网格
    this.button = new THREE.Mesh(geometry, material);
    this.button.position.set(0, 0, 0);
    this.button.castShadow = true;
    this.button.receiveShadow = true;
    
    // 保存原始位置
    this.originalButtonPosition = this.button.position.clone();
    
    this.mesh.add(this.button);
  }

  createPopupContent() {
    // 创建弹出内容容器
    this.popup = new THREE.Group();
    
    // 创建弹出内容几何体
    const { width, height, depth } = this.options.popupSize;
    const geometry = new THREE.BoxGeometry(width, height, depth);
    
    // 创建材质
    let material;
    
    if (this.options.popupContent) {
      // 加载纹理
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(this.options.popupContent);
      material = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
      });
    } else {
      // 默认材质
      material = new THREE.MeshPhongMaterial({
        color: 0xf5f5f5,
        side: THREE.DoubleSide
      });
    }
    
    // 创建网格
    const popupMesh = new THREE.Mesh(geometry, material);
    popupMesh.castShadow = true;
    popupMesh.receiveShadow = true;
    
    this.popup.add(popupMesh);
    
    // 设置初始位置（隐藏状态）
    this.popup.position.set(0, -height, 0);
    this.popup.scale.set(0.01, 0.01, 0.01);
    this.popup.visible = false;
    
    this.mesh.add(this.popup);
  }

  addInteraction() {
    // 添加点击事件
    this.button.userData.mechanic = this;
    this.button.userData.clickable = true;
  }

  press() {
    if (this.isTriggered) return;
    
    // 创建按下动画
    const startPosition = { y: this.originalButtonPosition.y };
    const endPosition = { y: this.originalButtonPosition.y - this.options.pressDepth };
    
    new TWEEN.Tween(startPosition)
      .to(endPosition, 300)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate(() => {
        this.button.position.y = startPosition.y;
      })
      .onComplete(() => {
        // 播放按压声音
        if (this.sounds['press']) {
          this.sounds['press'].play();
        }
        
        // 弹出内容
        this.showPopup();
        
        // 延迟后返回
        setTimeout(() => this.release(), 500);
      })
      .start();
  }

  release() {
    // 创建释放动画
    const startPosition = { y: this.button.position.y };
    const endPosition = { y: this.originalButtonPosition.y };
    
    new TWEEN.Tween(startPosition)
      .to(endPosition, 500)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate(() => {
        this.button.position.y = startPosition.y;
      })
      .start();
  }

  showPopup() {
    // 显示弹出内容
    this.popup.visible = true;
    
    // 播放弹出声音
    if (this.sounds['popup']) {
      this.sounds['popup'].play();
    }
    
    // 创建弹出动画
    const startScale = { value: 0.01 };
    const endScale = { value: 1.0 };
    
    new TWEEN.Tween(startScale)
      .to(endScale, 800)
      .easing(TWEEN.Easing.Elastic.Out)
      .onUpdate(() => {
        this.popup.scale.set(startScale.value, startScale.value, startScale.value);
        this.popup.position.y = -this.options.popupSize.height + this.options.popupSize.height * startScale.value;
      })
      .onComplete(() => {
        // 触发机关事件
        this.trigger({ popup: true });
      })
      .start();
  }

  hidePopup() {
    if (!this.popup.visible) return;
    
    // 创建隐藏动画
    const startScale = { value: 1.0 };
    const endScale = { value: 0.01 };
    
    new TWEEN.Tween(startScale)
      .to(endScale, 500)
      .easing(TWEEN.Easing.Back.In)
      .onUpdate(() => {
        this.popup.scale.set(startScale.value, startScale.value, startScale.value);
        this.popup.position.y = -this.options.popupSize.height + this.options.popupSize.height * startScale.value;
      })
      .onComplete(() => {
        this.popup.visible = false;
        this.reset();
      })
      .start();
  }
}

// 5. 磁吸式机关（元素吸附）
class MagneticMechanic extends Mechanic {
  constructor(options = {}) {
    super(Object.assign({
      magnetSize: 2,
      attractableObjects: [],
      attractionRadius: 5,
      attractionForce: 0.1,
      requiredObjects: []
    }, options));
    
    this.attractedObjects = [];
    this.init();
  }

  init() {
    // 创建磁铁容器
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.options.position);
    this.mesh.rotation.copy(this.options.rotation);
    this.mesh.scale.copy(this.options.scale);
    
    // 创建磁铁几何体
    this.createMagnet();
    
    // 创建吸引力场可视化
    this.createAttractionField();
    
    // 添加到场景
    if (this.options.scene) {
      this.options.scene.add(this.mesh);
    }
    
    // 加载声音
    if (this.options.sound) {
      this.loadSound('attract', 'magnetic_attract.mp3');
      this.loadSound('complete', 'magnetic_complete.mp3');
    }
    
    // 添加交互
    this.addInteraction();
  }

  createMagnet() {
    // 创建磁铁几何体
    const geometry = new THREE.CylinderGeometry(
      this.options.magnetSize,
      this.options.magnetSize,
      this.options.magnetSize * 0.5,
      32
    );
    
    // 创建材质
    const material = new THREE.MeshPhongMaterial({
      color: 0x3498db,
      specular: 0x555555,
      shininess: 30
    });
    
    // 创建网格
    const magnet = new THREE.Mesh(geometry, material);
    magnet.castShadow = true;
    magnet.receiveShadow = true;
    
    this.mesh.add(magnet);
  }

  createAttractionField() {
    // 创建吸引力场几何体
    const geometry = new THREE.SphereGeometry(this.options.attractionRadius, 32, 32);
    
    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      color: 0x3498db,
      transparent: true,
      opacity: 0.1,
      wireframe: true
    });
    
    // 创建网格
    this.attractionField = new THREE.Mesh(geometry, material);
    this.attractionField.visible = false; // 默认隐藏
    
    this.mesh.add(this.attractionField);
  }

  addInteraction() {
    // 添加点击事件
    this.mesh.children[0].userData.mechanic = this;
    this.mesh.children[0].userData.clickable = true;
  }

  toggleField() {
    // 切换吸引力场可见性
    this.attractionField.visible = !this.attractionField.visible;
    
    // 如果开启，则开始吸引物体
    if (this.attractionField.visible) {
      this.startAttraction();
    } else {
      this.stopAttraction();
    }
  }

  startAttraction() {
    // 开始吸引物体
    this.isAttracting = true;
  }

  stopAttraction() {
    // 停止吸引物体
    this.isAttracting = false;
  }

  update() {
    if (!this.isAttracting) return;
    
    // 获取磁铁世界坐标
    const magnetWorldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(magnetWorldPos);
    
    // 更新每个可吸引物体
    this.options.attractableObjects.forEach(obj => {
      // 获取物体世界坐标
      const objWorldPos = new THREE.Vector3();
      obj.getWorldPosition(objWorldPos);
      
      // 计算距离
      const distance = magnetWorldPos.distanceTo(objWorldPos);
      
      // 如果在吸引范围内
      if (distance < this.options.attractionRadius) {
        // 计算吸引方向
        const direction = new THREE.Vector3().subVectors(magnetWorldPos, objWorldPos).normalize();
        
        // 计算吸引力（距离越近力越大）
        const force = this.options.attractionForce * (1 - distance / this.options.attractionRadius);
        
        // 应用吸引力
        obj.position.add(direction.multiplyScalar(force));
        
        // 如果非常接近，则吸附
        if (distance < this.options.magnetSize * 0.6) {
          this.attractObject(obj);
        }
      }
    });
    
    // 检查是否所有必需物体都已吸附
    this.checkCompletion();
  }

  attractObject(obj) {
    // 检查是否已经吸附
    if (this.attractedObjects.includes(obj)) return;
    
    // 添加到吸附列表
    this.attractedObjects.push(obj);
    
    // 播放吸附声音
    if (this.sounds['attract']) {
      this.sounds['attract'].play();
    }
    
    // 创建吸附动画
    const targetPos = new THREE.Vector3();
    this.mesh.getWorldPosition(targetPos);
    
    new TWEEN.Tween(obj.position)
      .to({
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z
      }, 300)
      .easing(TWEEN.Easing.Back.Out)
      .start();
  }

  checkCompletion() {
    // 如果没有必需物体，则直接返回
    if (this.options.requiredObjects.length === 0) return;
    
    // 检查所有必需物体是否都已吸附
    const allRequired = this.options.requiredObjects.every(obj => 
      this.attractedObjects.includes(obj)
    );
    
    if (allRequired && !this.isTriggered) {
      // 播放完成声音
      if (this.sounds['complete']) {
        this.sounds['complete'].play();
      }
      
      // 触发机关事件
      this.trigger({ attracted: this.attractedObjects });
    }
  }
}

// 6. 光影式机关（紫外线显形）
class LightRevealMechanic extends Mechanic {
  constructor(options = {}) {
    super(Object.assign({
      lightSize: 2,
      lightColor: 0xffffff,
      lightIntensity: 2,
      revealTexture: null,
      surfaceSize: { width: 10, height: 10 },
      revealThreshold: 0.6
    }, options));
    
    this.revealProgress = 0;
    this.revealedAreas = new Set();
    this.init();
  }

  init() {
    // 创建机关容器
    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.options.position);
    this.mesh.rotation.copy(this.options.rotation);
    this.mesh.scale.copy(this.options.scale);
    
    // 创建表面
    this.createSurface();
    
    // 创建光源
    this.createLight();
    
    // 添加到场景
    if (this.options.scene) {
      this.options.scene.add(this.mesh);
    }
    
    // 加载声音
    if (this.options.sound) {
      this.loadSound('reveal', 'reveal.mp3');
      this.loadSound('complete', 'reveal_complete.mp3');
    }
    
    // 添加交互
    this.addInteraction();
  }

  createSurface() {
    // 创建表面几何体
    const { width, height } = this.options.surfaceSize;
    const geometry = new THREE.PlaneGeometry(width, height, 20, 20);
    
    // 加载纹理
    const textureLoader = new THREE.TextureLoader();
    
    // 创建表面材质
    const surfaceMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    
    // 如果有隐藏纹理，则加载
    if (this.options.revealTexture) {
      const revealTexture = textureLoader.load(this.options.revealTexture);
      
      // 创建自定义着色器材质
      const customMaterial = new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          revealTexture: { value: revealTexture },
          revealMap: { value: this.createRevealMap() },
          threshold: { value: this.options.revealThreshold }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D revealTexture;
          uniform sampler2D revealMap;
          uniform float threshold;
          
          varying vec2 vUv;
          
          void main() {
            vec4 baseColor = texture2D(baseTexture, vUv);
            vec4 revealColor = texture2D(revealTexture, vUv);
            float reveal = texture2D(revealMap, vUv).r;
            
            // 根据显形图和阈值混合颜色
            gl_FragColor = mix(baseColor, revealColor, step(threshold, reveal));
          }
        `,
        side: THREE.DoubleSide
      });
      
      surfaceMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.revealTexture = customMaterial.uniforms.revealTexture;
        shader.uniforms.revealMap = customMaterial.uniforms.revealMap;
        shader.uniforms.threshold = customMaterial.uniforms.threshold;
        
        shader.fragmentShader = customMaterial.fragmentShader;
      };
    }
    
    // 创建表面网格
    this.surface = new THREE.Mesh(geometry, surfaceMaterial);
    this.surface.receiveShadow = true;
    
    this.mesh.add(this.surface);
    
    // 创建显形贴图
    this.revealMapCanvas = document.createElement('canvas');
    this.revealMapCanvas.width = 512;
    this.revealMapCanvas.height = 512;
    this.revealMapContext = this.revealMapCanvas.getContext('2d');
    this.revealMapContext.fillStyle = 'black';
    this.revealMapContext.fillRect(0, 0, 512, 512);
    
    this.revealMapTexture = new THREE.CanvasTexture(this.revealMapCanvas);
    this.revealMapTexture.needsUpdate = true;
    
    // 更新材质中的显形贴图
    if (surfaceMaterial.userData && surfaceMaterial.userData.shader) {
      surfaceMaterial.userData.shader.uniforms.revealMap.value = this.revealMapTexture;
    }
  }

  createRevealMap() {
    // 创建初始显形贴图
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 512, 512);
    
    return new THREE.CanvasTexture(canvas);
  }

  createLight() {
    // 创建光源几何体
    const geometry = new THREE.SphereGeometry(this.options.lightSize, 32, 32);
    
    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      color: this.options.lightColor,
      transparent: true,
      opacity: 0.7
    });
    
    // 创建网格
    this.light = new THREE.Mesh(geometry, material);
    this.light.position.set(0, 0, this.options.surfaceSize.height / 2);
    
    // 添加点光源
    this.pointLight = new THREE.PointLight(
      this.options.lightColor,
      this.options.lightIntensity,
      this.options.surfaceSize.width * 2
    );
    this.pointLight.position.copy(this.light.position);
    this.light.add(this.pointLight);
    
    this.mesh.add(this.light);
  }

  addInteraction() {
    // 添加点击和拖动事件
    this.light.userData.mechanic = this;
    this.light.userData.draggable = true;
    this.light.userData.clickable = true;
  }

  moveLight(x, y, z) {
    // 限制光源移动范围
    const { width, height } = this.options.surfaceSize;
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    
    x = Math.max(-halfWidth, Math.min(halfWidth, x));
    y = Math.max(-halfHeight, Math.min(halfHeight, y));
    z = Math.max(1, z);
    
    // 更新光源位置
    this.light.position.set(x, y, z);
    
    // 更新显形贴图
    this.updateRevealMap(x, y);
  }

  updateRevealMap(x, y) {
    // 将3D坐标转换为贴图坐标
    const { width, height } = this.options.surfaceSize;
    const texX = Math.floor(((x + width / 2) / width) * 512);
    const texY = Math.floor(((y + height / 2) / height) * 512);
    
    // 绘制显形区域
    const radius = this.options.lightSize * 20;
    const gradient = this.revealMapContext.createRadialGradient(
      texX, texY, 0,
      texX, texY, radius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    
    this.revealMapContext.globalCompositeOperation = 'lighter';
    this.revealMapContext.fillStyle = gradient;
    this.revealMapContext.beginPath();
    this.revealMapContext.arc(texX, texY, radius, 0, Math.PI * 2);
    this.revealMapContext.fill();
    
    // 更新纹理
    this.revealMapTexture.needsUpdate = true;
    
    // 记录已显形区域
    const key = `${Math.floor(texX / 50)},${Math.floor(texY / 50)}`;
    this.revealedAreas.add(key);
    
    // 计算显形进度
    this.calculateRevealProgress();
  }

  calculateRevealProgress() {
    // 简单计算：根据已显形区域数量
    const totalAreas = 100; // 10x10网格
    const revealedCount = this.revealedAreas.size;
    
    this.revealProgress = revealedCount / totalAreas;
    
    // 如果进度超过阈值，触发完成事件
    if (this.revealProgress >= 0.7 && !this.isTriggered) {
      // 播放完成声音
      if (this.sounds['complete']) {
        this.sounds['complete'].play();
      }
      
      // 触发机关事件
      this.trigger({ revealProgress: this.revealProgress });
    }
  }

  revealAll() {
    // 立即显示全部隐藏内容
    this.revealMapContext.fillStyle = 'white';
    this.revealMapContext.fillRect(0, 0, 512, 512);
    this.revealMapTexture.needsUpdate = true;
    
    // 设置进度为100%
    this.revealProgress = 1.0;
    
    // 触发机关事件
    this.trigger({ revealProgress: this.revealProgress });
  }
}

// 导出机关类和事件总线
export {
  EventBus,
  eventBus,
  Mechanic,
  PullMechanic,
  RotateMechanic,
  PuzzleMechanic,
  PressureMechanic,
  MagneticMechanic,
  LightRevealMechanic
};