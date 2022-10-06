'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * 把component转换成vnode对象
 * @param type 传入的那个组件对象 App
 * @param props
 * @param children
 * @returns VNode
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFLag(type)
    };
    // 根据shapeFlag判断一下children类型
    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFLag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function isObject(obj) {
    return obj !== null && typeof obj === "object";
}
function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}

/**
 * 需要全局容器来存储依赖关系，需要两个map存储
 * 并且deps不能重复，使用Set数据结构
 * target -> key -> deps
 * map       map    set
 */
let targetMap = new Map();
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        throw new Error(`没有找到${target}的依赖`);
    }
    // 如果被stop了会切断下面的联系
    let deps = depsMap.get(key);
    triggerEffects(deps);
}
function triggerEffects(deps) {
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

//加载文件时初始化一次即可，使用缓存
const get = createGetter();
const getReadonly = createGetter(true);
const getShallowReadonly = createGetter(true, true);
const set = createSetter();
/**
 * 创建proxy需要的的get函数
 * @param isReadonly 是否只读
 * @returns get key得到的值
 */
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // target {foo: 1}
        // key foo
        //判断是不是isReactive和isReadonly类型
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        }
        else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
        }
        const value = Reflect.get(target, key);
        if (isShallow) {
            return value;
        }
        // value如果是对象还要继续递归的响应式
        if (isObject(value)) {
            return isReadonly ? readonly(value) : reactive(value);
        }
        return value;
    };
}
/**
 * 创建proxy需要的的set函数
 * @returns set之后的值
 */
function createSetter() {
    return function set(target, key, value) {
        const result = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return result;
    };
}
const mutableHandlers = {
    get,
    set,
};
const mutableHandlersReadonly = {
    get: getReadonly,
    set(target, key, value) {
        //当update时提示
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    },
};
const mutableHandlersShallowReadonly = {
    get: getShallowReadonly,
    set(target, key, value) {
        //当update时提示
        console.warn(`key :"${String(key)}" set 失败，因为 target 是 readonly 类型`, target);
        return true;
    },
};

var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
// 和reactive类似，但只读，即不需要依赖收集与触发
function readonly(raw) {
    return createReactiveObject(raw, mutableHandlersReadonly);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, mutableHandlersShallowReadonly);
}
/**
 * 统一创建响应式数据
 * @param target 要处理的obj
 * @param baseHandler proxy的处理器
 * @returns 经过proxy代理后的响应式数据
 */
function createReactiveObject(target, baseHandler) {
    if (!isObject(target)) {
        console.error(`target ${target} 必须是一个对象`);
        return target;
    }
    const result = new Proxy(target, baseHandler);
    return result;
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    "$el": (instance) => instance.vnode.el
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
    };
    return component;
}
/**
 * 给instance绑定render和setupState 也就是setupResult
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
    // initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 获取用户的配置
    const Component = instance.type;
    // 给实例设置代理, 使用_ 变量传递instance
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props));
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // setupResult有可能是function 或者 Object
    // TODO function 就认为他是render函数
    if (typeof setupResult === 'object') {
        // 更新实例的setupState属性
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}

function render(vnode, container) {
    patch(vnode, container);
}
/**
 * 打补丁
 * @param vnode
 * @param container
 */
function patch(vnode, container) {
    // TODO 判断是不是element
    // 如何判断是element还是component
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 是element，到了render内部的真正的h()
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 是component
        processComponent(vnode, container);
    }
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
/**
 * 加载组件
 * @param vnode
 * @param container
 */
function mountComponent(initialVNode, container) {
    const instance = createComponentInstance(initialVNode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // 是一个vnode树
    // 绑定proxy到render函数上
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> element -> mountElement
    patch(subTree, container);
    // 这个时候element都被加载完了，处理vnode上的el
    initialVNode.el = subTree.el;
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const element = (vnode.el = document.createElement(vnode.type));
    const { props } = vnode;
    // 其实就是属性值
    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
            const isOn = (key) => /^on[A-Z]/.test(key);
            const value = props[key];
            if (isOn(key)) {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            }
            else {
                element.setAttribute(key, value);
            }
        }
    }
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        element.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(children, element);
    }
    container.append(element);
}
function mountChildren(children, container) {
    children.forEach(vnode => {
        patch(vnode, container);
    });
}

function createApp(rootComponent) {
    return {
        mount(el) {
            // 先vnode
            // 把 component -> vnode
            // 所有逻辑都基于vnode处理
            const vnode = createVNode(rootComponent);
            let rootContainer = el;
            if (typeof el === "string") {
                rootContainer = getContainer(el);
            }
            render(vnode, rootContainer);
        }
    };
}
function getContainer(el) {
    return document.querySelector(el);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
