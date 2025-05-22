import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';

class Book3D {
  constructor(options = {}) {
    this.options = Object.assign({
      container: document.body,
      width: window.innerWidth,
      height: window.innerHeight,
      pageCount: 5,
      pageThickness: 0.5,
      pageSize: { width: 20, height: 28 },
      texturePath: './assets/textures/',
    }, options);

    this.pages = [];
    this.currentPage = 0;
    this.isAnimating = false;
    this.eventListeners = {};

    this.init();
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      45, 
      this.options.width / this.options.height, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 10, 30);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.options.container.appendChild(this.renderer.domElement);

    // 添加控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2;

    // 添加光源
    this.setupLights();

    // 创建书本
    this.createBook();

    // 添加窗口调整监听
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 开始动画循环
    this.animate();
  }

  setupLights() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // 主光源
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(10, 20, 15);
    mainLight.castShadow = true;
    
    // 配置阴影
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 100;
    mainLight.shadow.camera.left = -20;
    mainLight.shadow.camera.right = 20;
    mainLight.shadow.camera.top = 20;
    mainLight.shadow.camera.bottom = -20;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.001;
    
    this.scene.add(mainLight);
    
    // 辅助光源
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);
  }

  createBook() {
    // 创建书本容器
    this.book = new THREE.Group();
    this.scene.add(this.book);
    
    // 创建书脊
    this.createBookSpine();
    
    // 创建书页
    this.createPages();
    
    // 创建书本封面和封底
    this.createCover();
    
    // 初始位置
    this.book.position.set(0, 0, 0);
    this.book.rotation.set(0, 0, 0);
  }

  createBookSpine() {
    const { pageCount, pageThickness, pageSize } = this.options;
    const spineWidth = pageCount * pageThickness;
    const spineHeight = pageSize.height;
    const spineDepth = 1;
    
    // 创建书脊几何体
    const spineGeometry = new THREE.BoxGeometry(spineWidth, spineHeight, spineDepth);
    
    // 创建书脊材质
    const spineMaterial = new THREE.MeshPhongMaterial({
      color: 0x8B4513,
      side: THREE.DoubleSide,
    });
    
    // 创建书脊网格
    this.spine = new THREE.Mesh(spineGeometry, spineMaterial);
    this.spine.position.set(-pageSize.width / 2 - spineWidth / 2, 0, 0);
    this.spine.castShadow = true;
    this.spine.receiveShadow = true;
    
    this.book.add(this.spine);
  }

  createPages() {
    const { pageCount, pageThickness, pageSize } = this.options;
    const textureLoader = new THREE.TextureLoader();
    
    // 页面厚度
    const thickness = pageThickness;
    
    // 创建每一页
    for (let i = 0; i < pageCount; i++) {
      // 使用ExtrudeGeometry创建带厚度的页面
      const pageShape = new THREE.Shape();
      pageShape.moveTo(0, 0);
      pageShape.lineTo(pageSize.width, 0);
      pageShape.lineTo(pageSize.width, pageSize.height);
      pageShape.lineTo(0, pageSize.height);
      pageShape.lineTo(0, 0);
      
      const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: false
      };
      
      const pageGeometry = new THREE.ExtrudeGeometry(pageShape, extrudeSettings);
      
      // 创建双面材质
      const frontTexture = textureLoader.load(`${this.options.texturePath}page_front_${i + 1}.jpg`, 
        (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
        }
      );
      
      const backTexture = textureLoader.load(`${this.options.texturePath}page_back_${i + 1}.jpg`,
        (texture) => {
          texture.minFilter = THREE.LinearFilter;
          texture.needsUpdate = true;
        }
      );
      
      // 创建材质数组，为几何体的不同面应用不同材质
      const pageMaterials = [
        new THREE.MeshPhongMaterial({ color: 0xf5f5f5 }), // 侧面
        new THREE.MeshPhongMaterial({ color: 0xf5f5f5 }), // 侧面
        new THREE.MeshPhongMaterial({ color: 0xf5f5f5 }), // 侧面
        new THREE.MeshPhongMaterial({ color: 0xf5f5f5 }), // 侧面
        new THREE.MeshPhongMaterial({ map: frontTexture, side: THREE.FrontSide }), // 正面
        new THREE.MeshPhongMaterial({ map: backTexture, side: THREE.BackSide })  // 背面
      ];
      
      // 创建页面网格
      const page = new THREE.Mesh(pageGeometry, pageMaterials);
      
      // 设置页面位置
      page.position.set(-pageSize.width, 0, i * thickness);
      page.rotation.set(0, 0, 0);
      
      // 设置阴影
      page.castShadow = true;
      page.receiveShadow = true;
      
      // 添加到书本和页面数组
      this.book.add(page);
      this.pages.push({
        mesh: page,
        index: i,
        isFlipped: false,
        originalPosition: page.position.clone(),
        originalRotation: page.rotation.clone()
      });
      
      // 设置翻页参数
      this.setFlipParams(page, {
        curvature: 0.25,
        stiffness: 0.8,
        damping: 0.2
      });
    }
  }

  createCover() {
    const { pageSize, pageThickness } = this.options;
    const textureLoader = new THREE.TextureLoader();
    
    // 封面厚度
    const coverThickness = pageThickness * 2;
    
    // 创建封面形状
    const coverShape = new THREE.Shape();
    coverShape.moveTo(0, 0);
    coverShape.lineTo(pageSize.width, 0);
    coverShape.lineTo(pageSize.width, pageSize.height);
    coverShape.lineTo(0, pageSize.height);
    coverShape.lineTo(0, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: coverThickness,
      bevelEnabled: false
    };
    
    // 创建封面几何体
    const coverGeometry = new THREE.ExtrudeGeometry(coverShape, extrudeSettings);
    
    // 加载封面纹理
    const frontCoverTexture = textureLoader.load(`${this.options.texturePath}cover_front.jpg`);
    const backCoverTexture = textureLoader.load(`${this.options.texturePath}cover_back.jpg`);
    
    // 创建封面材质
    const coverMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ map: frontCoverTexture, side: THREE.FrontSide }), // 正面
      new THREE.MeshPhongMaterial({ map: backCoverTexture, side: THREE.BackSide })  // 背面
    ];
    
    // 创建封面网格
    this.frontCover = new THREE.Mesh(coverGeometry, coverMaterials);
    this.frontCover.position.set(-pageSize.width, 0, -coverThickness);
    this.frontCover.castShadow = true;
    this.frontCover.receiveShadow = true;
    
    // 创建封底几何体
    const backCoverGeometry = coverGeometry.clone();
    
    // 创建封底材质
    const backCoverMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ color: 0x8B4513 }), // 侧面
      new THREE.MeshPhongMaterial({ map: backCoverTexture, side: THREE.FrontSide }), // 正面
      new THREE.MeshPhongMaterial({ map: frontCoverTexture, side: THREE.BackSide })  // 背面
    ];
    
    // 创建封底网格
    this.backCover = new THREE.Mesh(backCoverGeometry, backCoverMaterials);
    this.backCover.position.set(-pageSize.width, 0, this.options.pageCount * pageThickness);
    this.backCover.castShadow = true;
    this.backCover.receiveShadow = true;
    
    // 添加到书本
    this.book.add(this.frontCover);
    this.book.add(this.backCover);
  }

  setFlipParams(page, params) {
    // 存储翻页参数
    page.userData = {
      flipParams: params
    };
  }

  flipPage(pageIndex, direction = 'forward') {
    if (this.isAnimating) return;
    
    const page = this.pages[pageIndex];
    if (!page) return;
    
    this.isAnimating = true;
    
    // 获取翻页参数
    const { curvature, stiffness, damping } = page.mesh.userData.flipParams;
    
    // 计算目标旋转角度
    const targetRotation = direction === 'forward' ? Math.PI : 0;
    
    // 创建翻页动画
    const startRotation = { y: page.mesh.rotation.y };
    const endRotation = { y: targetRotation };
    
    // 使用TWEEN创建动画
    new TWEEN.Tween(startRotation)
      .to(endRotation, 1000)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => {
        // 更新页面旋转
        page.mesh.rotation.y = startRotation.y;
        
        // 应用曲率效果
        this.applyPageCurvature(page.mesh, startRotation.y, curvature);
        
        // 更新阴影
        this.updateShadowIntensity(page.mesh, startRotation.y);
      })
      .onComplete(() => {
        // 更新页面状态
        page.isFlipped = direction === 'forward';
        
        // 重置曲率
        this.resetPageCurvature(page.mesh);
        
        // 结束动画状态
        this.isAnimating = false;
        
        // 触发翻页完成事件
        this.emit('pageFlipped', {
          pageIndex,
          direction,
          isFlipped: page.isFlipped
        });
      })
      .start();
  }

  applyPageCurvature(pageMesh, rotationY, curvature) {
    // 根据旋转角度应用曲率效果
    // 这里可以通过修改几何体顶点来实现
    // 简化版：仅修改页面的位置和旋转来模拟曲率
    const progress = Math.sin(rotationY);
    pageMesh.position.z += curvature * progress;
  }

  resetPageCurvature(pageMesh) {
    // 重置页面几何体
    pageMesh.position.z = pageMesh.userData.originalPosition.z;
  }

  updateShadowIntensity(pageMesh, rotationY) {
    // 根据翻页角度调整阴影强度
    const shadowIntensity = Math.sin(rotationY) * 0.5 + 0.5;
    pageMesh.material.forEach(mat => {
      if (mat.opacity !== undefined) {
        mat.opacity = shadowIntensity;
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.pages.length - 1) {
      this.flipPage(this.currentPage, 'forward');
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.flipPage(this.currentPage, 'backward');
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // 更新控制器
    this.controls.update();
    
    // 更新动画
    TWEEN.update();
    
    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  // 事件系统
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return this;
  }

  off(event, callback) {
    if (!this.eventListeners[event]) return this;
    this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
    return this;
  }

  emit(event, data) {
    if (!this.eventListeners[event]) return;
    this.eventListeners[event].forEach(callback => callback(data));
  }
}

export default Book3D;