import * as THREE from 'three';
import { eventBus } from './mechanics.js';
import { 
  MechanicFactory, 
  MechanicCombinator,
  InteractionController,
  MechanicAnimationController,
  MechanicSoundController,
  MechanicEffectGenerator
} from './mechanics-extension.js';

// 场景管理器
class SceneManager {
  constructor(book3D) {
    this.book3D = book3D;
    this.currentPage = 0;
    this.pageScenes = [];
    this.factory = new MechanicFactory(book3D.scene);
    this.interactionController = new InteractionController(book3D.camera, book3D.renderer);
    this.animationController = new MechanicAnimationController();
    this.soundController = new MechanicSoundController();
    this.effectGenerator = new MechanicEffectGenerator(book3D.scene);
    
    // 添加音频监听器到相机
    book3D.camera.add(this.soundController.listener);
    
    // 初始化
    this.init();
  }
  
  init() {
    // 监听翻页事件
    eventBus.on('page_flip', this.handlePageFlip.bind(this));
    
    // 监听机关触发事件
    eventBus.on('mechanic_trigger', this.handleMechanicTrigger.bind(this));
    
    // 监听组合完成事件
    eventBus.on('combinator_complete', this.handleCombinatorComplete.bind(this));
    
    // 加载声音
    this.loadSounds();
  }
  
  loadSounds() {
    // 加载通用声音
    this.soundController
      .loadSound('page_flip', 'assets/sounds/page_flip.mp3')
      .loadSound('success', 'assets/sounds/success.mp3')
      .loadSound('error', 'assets/sounds/error.mp3')
      .loadSound('background', 'assets/sounds/background.mp3', { 
        loop: true, 
        volume: 0.3 
      });
  }
  
  createPageScene(pageIndex, config) {
    // 创建页面场景
    const pageScene = {
      index: pageIndex,
      mechanics: [],
      combinators: [],
      effects: [],
      active: false
    };
    
    // 创建机关
    if (config.mechanics) {
      config.mechanics.forEach(mechanicConfig => {
        const { type, options } = mechanicConfig;
        let mechanic;
        
        switch (type) {
          case 'pull':
            mechanic = this.factory.createPullMechanic(options);
            break;
          case 'rotate':
            mechanic = this.factory.createRotateMechanic(options);
            break;
          case 'puzzle':
            mechanic = this.factory.createPuzzleMechanic(options);
            break;
          case 'pressure':
            mechanic = this.factory.createPressureMechanic(options);
            break;
          case 'magnetic':
            mechanic = this.factory.createMagneticMechanic(options);
            break;
          case 'light':
            mechanic = this.factory.createLightRevealMechanic(options);
            break;
          default:
            console.warn(`未知机关类型: ${type}`);
            return;
        }
        
        // 添加到页面场景
        pageScene.mechanics.push({
          id: mechanicConfig.id || `mechanic_${pageIndex}_${pageScene.mechanics.length}`,
          type,
          instance: mechanic,
          config: mechanicConfig
        });
      });
    }
    
    // 创建机关组合器
    if (config.combinators) {
      config.combinators.forEach(combinatorConfig => {
        const { type, mechanicIds, options } = combinatorConfig;
        
        // 获取相关机关实例
        const mechanics = mechanicIds.map(id => 
          pageScene.mechanics.find(m => m.id === id)?.instance
        ).filter(Boolean);
        
        // 创建组合器
        const combinator = new MechanicCombinator({
          type,
          mechanics,
          ...options
        });
        
        // 添加到页面场景
        pageScene.combinators.push({
          id: combinatorConfig.id || `combinator_${pageIndex}_${pageScene.combinators.length}`,
          instance: combinator,
          config: combinatorConfig
        });
      });
    }
    
    // 创建特效
    if (config.effects) {
      config.effects.forEach(effectConfig => {
        const { type, options, triggerMechanicId } = effectConfig;
        
        // 创建特效
        const effect = this.effectGenerator.createEffect(type, options);
        
        // 添加到页面场景
        pageScene.effects.push({
          id: effectConfig.id || `effect_${pageIndex}_${pageScene.effects.length}`,
          type,
          instance: effect,
          triggerMechanicId,
          config: effectConfig
        });
      });
    }
    
    // 添加到页面场景数组
    this.pageScenes[pageIndex] = pageScene;
    
    return pageScene;
  }
  
  loadPageScene(pageIndex) {
    // 如果页面场景不存在，则创建默认场景
    if (!this.pageScenes[pageIndex]) {
      this.createPageScene(pageIndex, {});
    }
    
    const pageScene = this.pageScenes[pageIndex];
    
    // 激活页面场景
    pageScene.active = true;
    
    // 激活机关交互
    pageScene.mechanics.forEach(mechanic => {
      this.interactionController.registerMechanic(mechanic.instance);
    });
    
    // 播放页面进入音效
    this.soundController.playSound('page_flip');
    
    // 更新当前页面
    this.currentPage = pageIndex;
    
    return pageScene;
  }
  
  unloadPageScene(pageIndex) {
    const pageScene = this.pageScenes[pageIndex];
    if (!pageScene) return;
    
    // 取消激活页面场景
    pageScene.active = false;
    
    // 取消激活机关交互
    pageScene.mechanics.forEach(mechanic => {
      this.interactionController.unregisterMechanic(mechanic.instance);
    });
    
    // 重置机关状态
    pageScene.mechanics.forEach(mechanic => {
      mechanic.instance.reset();
    });
    
    // 重置组合器状态
    pageScene.combinators.forEach(combinator => {
      combinator.instance.reset();
    });
    
    // 停止特效
    pageScene.effects.forEach(effect => {
      if (effect.instance.isPlaying) {
        effect.instance.stop();
      }
    });
  }
  
  handlePageFlip(data) {
    const { fromPage, toPage } = data;
    
    // 卸载当前页面场景
    this.unloadPageScene(fromPage);
    
    // 加载新页面场景
    this.loadPageScene(toPage);
    
    // 触发页面切换事件
    eventBus.emit('scene_changed', { fromPage, toPage });
  }
  
  handleMechanicTrigger(data) {
    const { type, mechanic, payload } = data;
    const pageScene = this.pageScenes[this.currentPage];
    
    if (!pageScene) return;
    
    // 查找触发的机关
    const mechanicEntry = pageScene.mechanics.find(m => m.instance === mechanic);
    if (!mechanicEntry) return;
    
    // 播放成功音效
    this.soundController.playSound('success');
    
    // 触发相关特效
    pageScene.effects.forEach(effect => {
      if (effect.triggerMechanicId === mechanicEntry.id) {
        effect.instance.play();
      }
    });
    
    // 更新组合器状态
    pageScene.combinators.forEach(combinator => {
      combinator.instance.updateMechanicState(mechanic, true);
    });
    
    // 触发机关完成事件
    eventBus.emit('mechanic_completed', {
      mechanicId: mechanicEntry.id,
      type,
      payload
    });
  }
  
  handleCombinatorComplete(data) {
    const { combinator, mechanics } = data;
    const pageScene = this.pageScenes[this.currentPage];
    
    if (!pageScene) return;
    
    // 查找完成的组合器
    const combinatorEntry = pageScene.combinators.find(c => c.instance === combinator);
    if (!combinatorEntry) return;
    
    // 播放成功音效
    this.soundController.playSound('success');
    
    // 创建组合完成特效
    const mechanicPositions = mechanics.map(m => {
      const position = new THREE.Vector3();
      m.mesh.getWorldPosition(position);
      return position;
    });
    
    // 生成连接线特效
    this.effectGenerator.createConnectionEffect(mechanicPositions);
    
    // 触发组合完成事件
    eventBus.emit('combination_completed', {
      combinatorId: combinatorEntry.id,
      mechanicIds: mechanics.map(m => {
        const entry = pageScene.mechanics.find(me => me.instance === m);
        return entry ? entry.id : null;
      }).filter(Boolean)
    });
  }
  
  update(deltaTime) {
    // 更新当前页面场景
    const pageScene = this.pageScenes[this.currentPage];
    if (!pageScene) return;
    
    // 更新机关
    pageScene.mechanics.forEach(mechanic => {
      if (typeof mechanic.instance.update === 'function') {
        mechanic.instance.update(deltaTime);
      }
    });
    
    // 更新组合器
    pageScene.combinators.forEach(combinator => {
      combinator.instance.update(deltaTime);
    });
    
    // 更新特效
    pageScene.effects.forEach(effect => {
      if (effect.instance.isPlaying) {
        effect.instance.update(deltaTime);
      }
    });
    
    // 更新交互控制器
    this.interactionController.update();
    
    // 更新动画控制器
    this.animationController.update(deltaTime);
  }
  
  loadSceneConfig(config) {
    // 加载场景配置
    if (!config || !config.pages) return;
    
    // 清空现有场景
    this.pageScenes = [];
    
    // 创建页面场景
    config.pages.forEach((pageConfig, index) => {
      this.createPageScene(index, pageConfig);
    });
    
    // 加载初始页面
    this.loadPageScene(0);
    
    // 播放背景音乐
    if (config.backgroundMusic) {
      this.soundController.playSound('background');
    }
  }
  
  dispose() {
    // 清理所有资源
    this.pageScenes.forEach((pageScene, index) => {
      this.unloadPageScene(index);
    });
    
    // 停止所有声音
    this.soundController.stopAll();
    
    // 移除事件监听
    eventBus.off('page_flip', this.handlePageFlip);
    eventBus.off('mechanic_trigger', this.handleMechanicTrigger);
    eventBus.off('combinator_complete', this.handleCombinatorComplete);
    
    // 清理交互控制器
    this.interactionController.dispose();
  }
}

export default SceneManager;