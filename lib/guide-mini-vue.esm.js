function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
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
    patch(vnode);
}
/**
 * 打补丁
 * @param vnode
 * @param container
 */
function patch(vnode, container) {
    // 判断是不是element
    processComponent(vnode);
}
/**
 * 处理组件
 * @param vnode
 * @param container
 */
function processComponent(vnode, container) {
    mountComponent(vnode);
}
/**
 * 加载组件
 * @param vnode
 * @param container
 */
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    // 是一个vnode树
    const subTree = instance.render();
    // vnode -> element -> mountElement
    patch(subTree);
}

function createApp(rootComponent) {
    return {
        mount(el) {
            // 先vnode
            // 把 component -> vnode
            // 所有逻辑都基于vnode处理
            const vnode = createVNode(rootComponent);
            if (typeof el === "string") {
                getContainer(el);
            }
            render(vnode);
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
