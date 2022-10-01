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
    };
    return vnode;
}

function isObject(obj) {
    return obj !== null && typeof obj === "object";
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
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
    if (typeof vnode.type === 'string') {
        // 是element，到了render内部的真正的h()
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
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
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // 是一个vnode树
    const subTree = instance.render();
    // vnode -> element -> mountElement
    patch(subTree, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const element = document.createElement(vnode.type);
    const { props } = vnode;
    // 其实就是属性值
    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
            const attr = props[key];
            element.setAttribute(key, attr);
        }
    }
    const { children } = vnode;
    if (typeof children === 'string') {
        element.textContent = children;
    }
    else if (Array.isArray(children)) {
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
