import * as THREE from 'three';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js';
import { 
  EventBus, 
  eventBus, 
  PullMechanic, 
  RotateMechanic, 
  PuzzleMechanic, 
  PressureMechanic, 
  MagneticMechanic, 
  LightRevealMechanic 
} from './mechanics.js';

// 机关组合器 - 允许多个机关协同工作
class MechanicCombinator {
  constructor(options = {}) {
    this.options = Object.assign({
      mechanics: [],
      triggerCondition: 'all', // 'all', 'any', 'sequence'
      sequence: [],
      onComplete: null
    }, options);
    
    this.triggeredMechanics = new Set();
    this.sequenceIndex = 0;
    this.isCompleted = false;
    
    this.init();
  }
  
  init() {
    // 监听机关触发事件
    eventBus.on('mechanic_trigger', this.handleMechanicTrigger.bind(this));
  }
  
  handleMechanicTrigger(data) {
    const { mechanic, type } = data;
    
    // 检查是否是我们关注的机关
    if (!this.options.mechanics.includes(mechanic)) return;
    
    // 记录已触发的机关
    this.triggeredMechanics.add(mechanic);
    
    // 根据触发条件检查是否完成
    switch (this.options.triggerCondition) {
      case 'all':
        // 所有机关都需要触发
        if (this.triggeredMechanics.size === this.options.mechanics.length) {
          this.complete();
        }
        break;
        
      case 'any':
        // 任意一个机关触发即可
        this.complete();
        break;
        
      case 'sequence':
        // 按特定顺序触发
        const expectedMechanic = this.options.sequence[this.sequenceIndex];
        if (mechanic === expectedMechanic) {
          this.sequenceIndex++;
          
          // 检查是否完成序列
          if (this.sequenceIndex === this.options.sequence.length) {
            this.complete();
          }
        } else {
          // 顺序错误，重置序列
          this.sequenceIndex = 0;
          this.triggeredMechanics.clear();
        }
        break;
    }
  }
  
  complete() {
    if (this.isCompleted) return;
    
    this.isCompleted = true;
    
    // 触发完成回调
    if (this.options.onComplete) {
      this.options.onComplete();
    }
    
    // 发送组合完成事件
    eventBus.emit('combinator_complete', { combinator: this });
  }
  
  reset() {
    this.triggeredMechanics.clear();
    this.sequenceIndex = 0;
    this.isCompleted = false;
  }
}

// 机关工厂 - 简化机关创建过程
class MechanicFactory {
  constructor(scene) {
    this.scene = scene;
    this.mechanics = [];
  }
  
  createPullMechanic(options) {
    const mechanic = new PullMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  createRotateMechanic(options) {
    const mechanic = new RotateMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  createPuzzleMechanic(options) {
    const mechanic = new PuzzleMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  createPressureMechanic(options) {
    const mechanic = new PressureMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  createMagneticMechanic(options) {
    const mechanic = new MagneticMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  createLightRevealMechanic(options) {
    const mechanic = new LightRevealMechanic({
      scene: this.scene,
      ...options
    });
    
    this.mechanics.push(mechanic);
    return mechanic;
  }
  
  updateAll() {
    // 更新所有机关
    this.mechanics.forEach(mechanic => {
      if (typeof mechanic.update === 'function') {
        mechanic.update();
      }
    });
  }
  
  resetAll() {
    // 重置所有机关
    this.mechanics.forEach(mechanic => {
      mechanic.reset();
    });
  }
}

// 交互控制器 - 处理用户输入
class InteractionController {
  constructor(camera, renderer, mechanics = []) {
    this.camera = camera;
    this.renderer = renderer;
    this.mechanics = mechanics;
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.selectedObject = null;
    this.dragging = false;
    this.dragOffset = new THREE.Vector3();
    
    this.init();
  }
  
  init() {
    // 添加事件监听器
    const domElement = this.renderer.domElement;
    
    domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    domElement.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    domElement.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  updateMechanics(mechanics) {
    this.mechanics = mechanics;
  }
  
  onMouseDown(event) {
    event.preventDefault();
    
    // 更新鼠标位置
    this.updateMousePosition(event);
    
    // 检测点击的对象
    this.checkIntersection();
    
    if (this.selectedObject) {
      this.dragging = this.selectedObject.userData.draggable || false;
      
      if (this.dragging) {
        // 计算拖动偏移
        const intersects = this.raycaster.intersectObject(this.selectedObject, true);
        if (intersects.length > 0) {
          this.dragOffset.copy(intersects[0].point).sub(this.selectedObject.position);
        }
      } else if (this.selectedObject.userData.clickable) {
        // 处理点击事件
        this.handleClick(this.selectedObject);
      }
    }
  }
  
  onMouseMove(event) {
    event.preventDefault();
    
    // 更新鼠标位置
    this.updateMousePosition(event);
    
    // 处理拖动
    if (this.dragging && this.selectedObject) {
      this.handleDrag();
    }
  }
  
  onMouseUp(event) {
    event.preventDefault();
    
    this.dragging = false;
    this.selectedObject = null;
  }
  
  onTouchStart(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // 更新触摸位置
      this.updateTouchPosition(event.touches[0]);
      
      // 检测点击的对象
      this.checkIntersection();
      
      if (this.selectedObject) {
        this.dragging = this.selectedObject.userData.draggable || false;
        
        if (this.dragging) {
          // 计算拖动偏移
          const intersects = this.raycaster.intersectObject(this.selectedObject, true);
          if (intersects.length > 0) {
            this.dragOffset.copy(intersects[0].point).sub(this.selectedObject.position);
          }
        } else if (this.selectedObject.userData.clickable) {
          // 处理点击事件
          this.handleClick(this.selectedObject);
        }
      }
    }
  }
  
  onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1 && this.dragging && this.selectedObject) {
      // 更新触摸位置
      this.updateTouchPosition(event.touches[0]);
      
      // 处理拖动
      this.handleDrag();
    }
  }
  
  onTouchEnd(event) {
    this.dragging = false;
    this.selectedObject = null;
  }
  
  updateMousePosition(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  updateTouchPosition(touch) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  checkIntersection() {
    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 获取所有可交互对象
    const interactiveObjects = [];
    this.mechanics.forEach(mechanic => {
      if (mechanic.mesh) {
        mechanic.mesh.traverse(child => {
          if (child.userData.clickable || child.userData.draggable) {
            interactiveObjects.push(child);
          }
        });
      }
    });
    
    // 检测交叉
    const intersects = this.raycaster.intersectObjects(interactiveObjects);
    
    if (intersects.length > 0) {
      this.selectedObject = intersects[0].object;
    } else {
      this.selectedObject = null;
    }
  }
  
  handleClick(object) {
    // 获取关联的机关
    const mechanic = object.userData.mechanic;
    
    if (mechanic) {
      // 根据机关类型调用相应方法
      if (mechanic.constructor.name === 'PullMechanic') {
        mechanic.pull();
      } else if (mechanic.constructor.name === 'RotateMechanic') {
        if (object.userData.dialIndex !== undefined) {
          mechanic.rotateDial(object.userData.dialIndex);
        }
      } else if (mechanic.constructor.name === 'PuzzleMechanic') {
        if (object.userData.pieceIndex !== undefined) {
          mechanic.movePiece(object.userData.pieceIndex);
        }
      } else if (mechanic.constructor.name === 'PressureMechanic') {
        mechanic.press();
      } else if (mechanic.constructor.name === 'MagneticMechanic') {
        mechanic.toggleField();
      } else if (mechanic.constructor.name === 'LightRevealMechanic') {
        // 光源可以拖动，不需要特殊点击处理
      }
    }
  }
  
  handleDrag() {
    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 计算新位置
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const planeIntersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, planeIntersect);
    
    // 应用偏移
    planeIntersect.sub(this.dragOffset);
    
    // 获取关联的机关
    const mechanic = this.selectedObject.userData.mechanic;
    
    if (mechanic) {
      // 根据机关类型处理拖动
      if (mechanic.constructor.name === 'LightRevealMechanic') {
        mechanic.moveLight(planeIntersect.x, planeIntersect.y, planeIntersect.z);
      } else if (mechanic.constructor.name === 'PuzzleMechanic') {
        // 拼图拖动逻辑
        if (this.selectedObject.userData.pieceIndex !== undefined) {
          // 更新拼图位置
          this.selectedObject.position.copy(planeIntersect);
        }
      }
    }
  }
}

// 机关动画控制器 - 提供高级动画效果
class MechanicAnimationController {
  constructor() {
    this.animations = {};
  }
  
  createAnimation(name, options) {
    const defaultOptions = {
      duration: 1000,
      easing: TWEEN.Easing.Quadratic.Out,
      repeat: 0,
      yoyo: false,
      onStart: null,
      onUpdate: null,
      onComplete: null
    };
    
    const animOptions = Object.assign({}, defaultOptions, options);
    
    this.animations[name] = animOptions;
    
    return this;
  }
  
  playAnimation(name, target, startValues, endValues) {
    if (!this.animations[name]) {
      console.error(`Animation "${name}" not found`);
      return null;
    }
    
    const options = this.animations[name];
    
    // 创建动画
    const tween = new TWEEN.Tween(Object.assign({}, startValues))
      .to(endValues, options.duration)
      .easing(options.easing)
      .repeat(options.repeat)
      .yoyo(options.yoyo);
    
    // 添加回调
    if (options.onStart) {
      tween.onStart(() => options.onStart(target));
    }
    
    if (options.onUpdate) {
      tween.onUpdate((values) => options.onUpdate(target, values));
    } else {
      // 默认更新目标对象属性
      tween.onUpdate((values) => {
        Object.keys(values).forEach(key => {
          if (typeof target[key] !== 'undefined') {
            target[key] = values[key];
          } else if (target.position && key.startsWith('position')) {
            const axis = key.split('position')[1].toLowerCase();
            if (axis && target.position[axis] !== undefined) {
              target.position[axis] = values[key];
            }
          } else if (target.rotation && key.startsWith('rotation')) {
            const axis = key.split('rotation')[1].toLowerCase();
            if (axis && target.rotation[axis] !== undefined) {
              target.rotation[axis] = values[key];
            }
          } else if (target.scale && key.startsWith('scale')) {
            const axis = key.split('scale')[1].toLowerCase();
            if (axis && target.scale[axis] !== undefined) {
              target.scale[axis] = values[key];
            }
          }
        });
      });
    }
    
    if (options.onComplete) {
      tween.onComplete(() => options.onComplete(target));
    }
    
    // 启动动画
    tween.start();
    
    return tween;
  }
  
  stopAllAnimations() {
    TWEEN.removeAll();
  }
}

// 机关声音控制器 - 管理所有声音效果
class MechanicSoundController {
  constructor() {
    this.sounds = {};
    this.listener = new THREE.AudioListener();
    this.audioLoader = new THREE.AudioLoader();
    this.masterVolume = 1.0;
  }
  
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // 更新所有声音的音量
    Object.values(this.sounds).forEach(sound => {
      sound.setVolume(sound.userData.volume * this.masterVolume);
    });
  }
  
  loadSound(name, url, options = {}) {
    const defaultOptions = {
      volume: 0.5,
      loop: false,
      autoplay: false
    };
    
    const soundOptions = Object.assign({}, defaultOptions, options);
    
    // 创建音频对象
    const sound = new THREE.Audio(this.listener);
    sound.userData = { volume: soundOptions.volume };
    
    // 加载音频
    this.audioLoader.load(url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(soundOptions.loop);
      sound.setVolume(soundOptions.volume * this.masterVolume);
      
      if (soundOptions.autoplay) {
        sound.play();
      }
      
      this.sounds[name] = sound;
    });
    
    return this;
  }
  
  playSound(name, options = {}) {
    const sound = this.sounds[name];
    
    if (!sound) {
      console.warn(`Sound "${name}" not found`);
      return;
    }
    
    // 应用选项
    if (options.volume !== undefined) {
      sound.setVolume(options.volume * this.masterVolume);
    }
    
    if (options.loop !== undefined) {
      sound.setLoop(options.loop);
    }
    
    // 播放声音
    if (sound.isPlaying) {
      sound.stop();
    }
    
    sound.play();
  }
  
  stopSound(name) {
    const sound = this.sounds[name];
    
    if (sound && sound.isPlaying) {
      sound.stop();
    }
  }
  
  stopAllSounds() {
    Object.values(this.sounds).forEach(sound => {
      if (sound.isPlaying) {
        sound.stop();
      }
    });
  }
}

// 机关效果生成器 - 创建特殊视觉效果
class MechanicEffectGenerator {
  constructor(scene) {
    this.scene = scene;
    this.effects = {};
  }
  
  createParticleEffect(name, options = {}) {
    const defaultOptions = {
      count: 100,
      size: 0.1,
      color: 0xffffff,
      speed: 1,
      lifetime: 2000,
      position: new THREE.Vector3(0, 0, 0)
    };
    
    const effectOptions = Object.assign({}, defaultOptions, options);
    
    // 创建粒子系统
    const particles = new THREE.Group();
    particles.name = name;
    
    // 创建粒子
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(effectOptions.count * 3);
    const velocities = [];
    const startTimes = [];
    
    for (let i = 0; i < effectOptions.count; i++) {
      // 随机位置
      const x = (Math.random() - 0.5) * 2;
      const y = (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 2;
      
      positions[i * 3] = effectOptions.position.x;
      positions[i * 3 + 1] = effectOptions.position.y;
      positions[i * 3 + 2] = effectOptions.position.z;
      
      // 随机速度
      velocities.push(
        new THREE.Vector3(
          x * effectOptions.speed,
          y * effectOptions.speed,
          z * effectOptions.speed
        )
      );
      
      // 随机开始时间
      startTimes.push(Date.now() + Math.random() * 1000);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // 创建材质
    const material = new THREE.PointsMaterial({
      color: effectOptions.color,
      size: effectOptions.size,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    // 创建粒子系统
    const particleSystem = new THREE.Points(geometry, material);
    particles.add(particleSystem);
    
    // 添加到场景
    this.scene.add(particles);
    
    // 保存效果
    this.effects[name] = {
      group: particles,
      particleSystem,
      positions,
      velocities,
      startTimes,
      options: effectOptions
    };
    
    return this;
  }
  
  updateParticleEffect(name) {
    const effect = this.effects[name];
    
    if (!effect) return;
    
    const { particleSystem, positions, velocities, startTimes, options } = effect;
    const positionAttribute = particleSystem.geometry.getAttribute('position');
    const now = Date.now();
    
    for (let i = 0; i < options.count; i++) {
      const lifetime = now - startTimes[i];
      
      if (lifetime > options.lifetime) {
        // 重置粒子
        positions[i * 3] = options.position.x;
        positions[i * 3 + 1] = options.position.y;
        positions[i * 3 + 2] = options.position.z;
        
        startTimes[i] = now;
      } else {
        // 更新位置
        const progress = lifetime / options.lifetime;
        const velocity = velocities[i];
        
        positions[i * 3] += velocity.x * 0.01;
        positions[i * 3 + 1] += velocity.y * 0.01;
        positions[i * 3 + 2] += velocity.z * 0.01;
        
        // 淡出效果
        if (progress > 0.7) {
          const opacity = 1 - (progress - 0.7) / 0.3;
          particleSystem.material.opacity = opacity;
        }
      }
    }
    
    positionAttribute.needsUpdate = true;
  }
  
  playEffect(name, position) {
    const effect = this.effects[name];
    
    if (!effect) {
      console.warn(`Effect "${name}" not found`);
      return;
    }
    
    // 更新位置
    if (position) {
      effect.options.position.copy(position);
      
      // 重置所有粒子
      for (let i = 0; i < effect.options.count; i++) {
        effect.positions[i * 3] = position.x;
        effect.positions[i * 3 + 1] = position.y;
        effect.positions[i * 3 + 2] = position.z;
        
        effect.startTimes[i] = Date.now() + Math.random() * 500;
      }
      
      effect.particleSystem.geometry.getAttribute('position').needsUpdate = true;
    }
    
    // 显示效果
    effect.group.visible = true;
  }
  
  stopEffect(name) {
    const effect = this.effects[name];
    
    if (effect) {
      effect.group.visible = false;
    }
  }
  
  updateAllEffects() {
    Object.keys(this.effects).forEach(name => {
      if (this.effects[name].group.visible) {
        this.updateParticleEffect(name);
      }
    });
  }
}

// 导出扩展模块
export {
  MechanicCombinator,
  MechanicFactory,
  InteractionController,
  MechanicAnimationController,
  MechanicSoundController,
  MechanicEffectGenerator
};