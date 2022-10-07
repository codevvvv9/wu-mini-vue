'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const FragmentType = Symbol("Fragment");
const TextType = Symbol("Text");
/**
 * 把component转换成vnode对象
 * @param type 传入的那个组件对象 App
 * @param props
 * @param children 字符串或者数组，数组的话，每个元素都是vnode类型
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
    // component + children是object才需要处理slots
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFLag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
function createTextVNode(text) {
    return createVNode(TextType, {}, text);
}

function isObject(obj) {
    return obj !== null && typeof obj === "object";
}
function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
}
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function camelize(str) {
    // add-foo -> onAddFoo
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
}
function toHandlerKey(str) {
    return str ? ('on' + camelize(str)) : '';
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

function emit(instance, event, ...args) {
    const { props } = instance;
    // event: add -> onAdd
    // event: add-foo -> onAddFoo
    const handleName = toHandlerKey(capitalize(event));
    // 先首字母最大，再判断是否需要驼峰化，最后组装on+name
    const handler = props[handleName];
    // props["onAdd"]
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    "$el": (instance) => instance.vnode.el,
    "$slots": (instance) => instance.slots
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

function initSlots(instance, children) {
    // 为了支持单vnode和数组形式，统一使用数组包裹
    // instance.slots = Array.isArray(children) ? children : [children]
    // 又为了支持具名插槽，改用map结构
    // normalizeSlots(children, instance.slots);
    //判断一下是否要格式化
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeSlots(children, instance.slots);
    }
}
/**
 * 初始化instance的slots对象
 * @param children
 * @param slots 未赋值的slots {}
 */
function normalizeSlots(children, slots) {
    for (const key in children) {
        if (Object.prototype.hasOwnProperty.call(children, key)) {
            const value = children[key];
            // 统一处理成函数
            slots[key] = (props) => normalizeSlotValue(value(props));
        }
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        emit: () => { },
        parent: parent,
        provides: parent ? parent.provides : {},
    };
    // 初始化emit
    component.emit = emit.bind(null, component);
    return component;
}
/**
 * 给instance绑定render和setupState 也就是setupResult
 * @param instance 组件实例
 */
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 获取用户的配置
    const Component = instance.type;
    // 给实例设置代理, 使用_ 变量传递instance
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
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
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function getCurrentInstance() {
    return currentInstance;
}

function render(vnode, container) {
    // 第一次的顶级组件，没有父组件
    patch(vnode, container, null);
}
/**
 * 打补丁
 * @param vnode
 * @param container
 */
function patch(vnode, container, parentComponent) {
    // 判断是不是element
    // 如何判断是element还是component
    const { shapeFlag, type } = vnode;
    switch (type) {
        case FragmentType:
            processFragment(vnode, container, parentComponent);
            break;
        case TextType:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                // 是element，到了render内部的真正的h()
                processElement(vnode, container, parentComponent);
            }
            else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                // 是component
                processComponent(vnode, container, parentComponent);
            }
            break;
    }
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
/**
 * 加载组件
 * @param vnode
 * @param container
 */
function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    // 是一个vnode树
    // 绑定proxy到render函数上
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> element -> mountElement
    patch(subTree, container, instance);
    // 这个时候element都被加载完了，处理vnode上的el
    initialVNode.el = subTree.el;
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
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
        mountChildren(vnode, element, parentComponent);
    }
    container.append(element);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(vnode => {
        patch(vnode, container, parentComponent);
    });
}
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
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

/**
 * 渲染插槽内容
 * @param slots 插槽内容
 * @param name 插槽名字，确定渲染slots中的哪个slot
 * @param props 作用域内容，确定渲染slots中的哪个slot
 * @returns
 */
function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        //function
        if (typeof slot === 'function') {
            return createVNode(FragmentType, {}, slot(props));
        }
    }
    else {
        throw new Error(`name${name} 不是合法名字`);
    }
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        let parentProvides = currentInstance.parent.provides;
        // 绑定父级原型链，只需要初始化一次即可
        if (provides === parentProvides) {
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父级上面一层一层的取值
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            else {
                return defaultValue;
            }
        }
    }
}

exports.createApp = createApp;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.renderSlots = renderSlots;
