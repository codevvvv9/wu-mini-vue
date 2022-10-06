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

const publicPropertiesMap = {
    "$el": (instance) => instance.vnode.el
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
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
    };
    return component;
}
/**
 * 给instance绑定render和setupState 也就是setupResult
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // TODO
    // initProps
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
        const setupResult = setup();
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

export { createApp, h };
