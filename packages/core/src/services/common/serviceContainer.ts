/**
 * @file serviceContainer.ts
 * @description 服务容器实现，提供依赖注入和服务管理功能
 * @module @prompt-assistant/core/services/common
 */

import { DependencyError } from './errors';

/**
 * 服务描述
 * @interface ServiceDescriptor
 * @description 定义服务的元数据
 */
interface ServiceDescriptor<T = any> {
  /**
   * 服务实例
   * @type {T}
   */
  instance: T;
  
  /**
   * 服务是否为单例
   * @type {boolean}
   */
  singleton: boolean;
  
  /**
   * 服务工厂函数
   * @type {Function}
   */
  factory?: (container: ServiceContainer) => T;
}

/**
 * 服务容器
 * @class ServiceContainer
 * @description 提供依赖注入和服务管理功能的容器
 */
export class ServiceContainer {
  /**
   * 服务映射
   * @private
   * @type {Map<string, ServiceDescriptor>}
   */
  private services = new Map<string, ServiceDescriptor>();
  
  /**
   * 注册服务实例
   * @param {string} key - 服务键
   * @param {T} instance - 服务实例
   * @returns {ServiceContainer} 服务容器实例，用于链式调用
   */
  register<T>(key: string, instance: T): ServiceContainer {
    this.services.set(key, { instance, singleton: true });
    return this;
  }
  
  /**
   * 注册服务工厂
   * @param {string} key - 服务键
   * @param {Function} factory - 服务工厂函数
   * @param {boolean} [singleton=true] - 是否为单例服务
   * @returns {ServiceContainer} 服务容器实例，用于链式调用
   */
  registerFactory<T>(
    key: string, 
    factory: (container: ServiceContainer) => T, 
    singleton: boolean = true
  ): ServiceContainer {
    this.services.set(key, { 
      instance: singleton ? undefined : null,
      factory,
      singleton
    });
    return this;
  }
  
  /**
   * 获取服务实例
   * @param {string} key - 服务键
   * @returns {T} 服务实例
   * @throws {DependencyError} 当服务未注册时抛出
   */
  get<T>(key: string): T {
    const descriptor = this.services.get(key);
    
    if (!descriptor) {
      throw new DependencyError(`服务未注册: ${key}`, { 
        serviceName: key,
        dependencyType: 'service'
      });
    }
    
    // 如果是单例且已实例化，直接返回
    if (descriptor.singleton && descriptor.instance !== undefined) {
      return descriptor.instance as T;
    }
    
    // 如果有工厂函数，使用工厂创建实例
    if (descriptor.factory) {
      const instance = descriptor.factory(this);
      
      // 如果是单例，保存实例
      if (descriptor.singleton) {
        descriptor.instance = instance;
      }
      
      return instance as T;
    }
    
    return descriptor.instance as T;
  }
  
  /**
   * 检查服务是否已注册
   * @param {string} key - 服务键
   * @returns {boolean} 是否已注册
   */
  has(key: string): boolean {
    return this.services.has(key);
  }
  
  /**
   * 移除服务注册
   * @param {string} key - 服务键
   * @returns {boolean} 是否成功移除
   */
  remove(key: string): boolean {
    return this.services.delete(key);
  }
  
  /**
   * 获取所有已注册的服务键
   * @returns {string[]} 服务键列表
   */
  getKeys(): string[] {
    return Array.from(this.services.keys());
  }
  
  /**
   * 创建子容器
   * @param {boolean} [inheritParent=true] - 是否继承父容器的服务
   * @returns {ServiceContainer} 子容器实例
   */
  createChild(inheritParent: boolean = true): ServiceContainer {
    const child = new ServiceContainer();
    
    if (inheritParent) {
      // 复制父容器的服务到子容器
      this.services.forEach((descriptor, key) => {
        child.services.set(key, { ...descriptor });
      });
    }
    
    return child;
  }
}

/**
 * 默认服务容器实例
 * @type {ServiceContainer}
 */
export const defaultContainer = new ServiceContainer(); 