'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const extend = Object.assign;
const EMPTY_OBJECT = {};
function isObject(obj) {
    return obj !== null && typeof obj === "object";
}
function hasChanged(oldValue, newValue) {
    return !Object.is(oldValue, newValue);
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

// 是否应该收集依赖
let shouldTrack;
// 全局的对象来收集依赖
let activeEffect;
// 这就是所谓的依赖
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        this.isActive = true;
        this._fn = fn;
        this.scheduler = scheduler;
    }
    run() {
        if (!this.isActive) {
            return this._fn();
        }
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        // 重置状态
        shouldTrack = false;
        return result;
    }
    stop() {
        if (this.isActive) {
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.isActive = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    // 清空effect数组
    effect.deps.length = 0;
}
/**
 * 需要全局容器来存储依赖关系，需要两个map存储
 * 并且deps不能重复，使用Set数据结构
 * target -> key -> deps
 * map       map    set
 */
let targetMap = new Map();
function track(target, key) {
    if (!isTracking())
        return;
    // 第一个map 储存target
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        //不存在则初始化depsMap，并添加
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    //第二个map ，存储key
    let deps = targetMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    trackEffects(deps);
}
function trackEffects(deps) {
    // 看看之前有没有存储，存了就没必要再存
    if (deps.has(activeEffect))
        return;
    // 第三个set存储dep
    deps.add(activeEffect);
    // 反向收集依赖
    activeEffect.deps.push(deps);
}
// 是否追踪依赖
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        throw new Error(`没有找到${JSON.stringify(target)}的依赖`);
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
function effect(fn, options = {}) {
    //需要一个reactiveEffect类 做抽象
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 挂载其它属性到effect实例上，例如onStop
    extend(_effect, options);
    _effect.run();
    //注意run函数的this指向
    const runner = _effect.run.bind(_effect);
    // 给runner挂载effect
    runner.effect = _effect;
    return runner;
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
        if (!isReadonly) {
            // 依赖收集
            track(target, key);
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

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._value = convert(value);
        this._rawValue = value;
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        if (hasChanged(this._rawValue, newValue)) {
            //更新原始值 和 转化后的值
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
// 转换对象，是否使用reactive()包裹
function convert(val) {
    return isObject(val) ? reactive(val) : val;
}
function ref(val) {
    return new RefImpl(val);
}
function isRef(ref) {
    // !!避免undefined的影响
    return !!ref.__v_isRef;
}
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 代理refs就是template里面不需要.value的原因
function proxyRefs(objWithRefs) {
    return new Proxy(objWithRefs, {
        get(target, value) {
            return unRef(Reflect.get(target, value));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                //原来的值是ref对象，设置的值不是ref
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
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
        isMounted: false,
        subTree: {},
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
        instance.setupState = proxyRefs(setupResult);
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
        shapeFlag: getShapeFLag(type),
        key: props && props.key, // 为diff算法用
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

// 自定义渲染器的改造
function createAppAPI(render) {
    return function createApp(rootComponent) {
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
    };
}
function getContainer(el) {
    return document.querySelector(el);
}

function createRenderer(options) {
    // 接受自定义的三个函数
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(newVNode, container) {
        // 第一次的顶级组件，没有父组件
        patch(null, newVNode, container, null, null);
    }
    /**
     * 打补丁
     * @param oldVNode
     * @param newVNode
     * @param container
     */
    function patch(oldVNode, newVNode, container, parentComponent, anchor) {
        // 判断是不是element
        // 如何判断是element还是component
        const { shapeFlag, type } = newVNode;
        switch (type) {
            case FragmentType:
                processFragment(oldVNode, newVNode, container, parentComponent, anchor);
                break;
            case TextType:
                processText(oldVNode, newVNode, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 是element，到了render内部的真正的h()
                    processElement(oldVNode, newVNode, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 是component
                    processComponent(oldVNode, newVNode, container, parentComponent, anchor);
                }
                break;
        }
    }
    /**
     * 处理组件
     * @param newVNode
     * @param container
     */
    function processComponent(oldVNode, newVNode, container, parentComponent, anchor) {
        mountComponent(oldVNode, newVNode, container, parentComponent, anchor);
    }
    /**
     * 加载组件
     * @param newVNode
     * @param container
     */
    function mountComponent(oldVNode, initialVNode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVNode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        // 值一更新 set 就会执行effect里面的函数, 被依赖收集到
        // 但是要区分初始化和更新
        effect(() => {
            if (!instance.isMounted) {
                // 初始化 时先把subTree存起来
                console.log('init patch');
                // 是一个vnode树
                // 绑定proxy到render函数上
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // newVNode -> element -> mountElement
                patch(null, subTree, container, instance, anchor);
                // 这个时候element都被加载完了，处理vnode上的el
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                // 只是更新了，不需要再patch
                console.log('update patch');
                // 是一个vnode树
                // 绑定proxy到render函数上
                const { proxy } = instance;
                // 新树
                const subTree = instance.render.call(proxy);
                // 获取初始化时存的那个老树
                const prevSubTree = instance.subTree;
                // 重新赋值，赋值新树成为下一次的老树
                instance.subTree = subTree;
                // newVNode -> element -> mountElement
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        });
    }
    function processElement(oldVNode, newVNode, container, parentComponent, anchor) {
        // 区分是初始化还是更新操作
        if (!oldVNode) {
            // 初始化
            mountElement(newVNode, container, parentComponent, anchor);
        }
        else {
            patchElement(oldVNode, newVNode, container, parentComponent, anchor);
        }
    }
    /**
     * 更新元素操作
     * @param oldVNode
     * @param newVNode
     * @param container
     */
    function patchElement(oldVNode, newVNode, container, parentComponent, anchor) {
        // console.log('patchElement');
        // console.log('oldVNode', oldVNode);
        // console.log('newVNode', newVNode);
        // 处理props的变化，有三种：
        // 属性值修改，属性值改为null undefined，属性key直接没了
        const oldProps = oldVNode.props || EMPTY_OBJECT;
        const newProps = newVNode.props || EMPTY_OBJECT;
        // el在mountElement赋值的
        // 使用初始的oldVNode.el 传递设置el值，保证下次来的时候有值
        const el = (newVNode.el = oldVNode.el);
        patchProps(oldProps, newProps, el);
        patchChildren(oldVNode, newVNode, el, parentComponent, anchor);
    }
    function patchChildren(oldVNode, newVNode, container, parentComponent, anchor) {
        const { shapeFlag: preShapeFlag } = oldVNode;
        const preChildren = oldVNode.children;
        const { shapeFlag: nextShapeFlag } = newVNode;
        const nextChildren = newVNode.children;
        if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 老的children是array
            if (nextShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 1.老的children是array，新的children是text
                // 先清理children，再赋值text
                unmountChildren(preChildren);
                hostSetElementText(container, nextChildren);
            }
            else {
                // 2. 新的children也是array，情况比较复杂
                patchKeyedChildren(preChildren, nextChildren, container, parentComponent, anchor);
            }
        }
        else {
            // 老的children是text
            if (nextShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 3. 新的children是array
                // 先清空
                hostSetElementText(container, '');
                // 再赋值
                mountChildren(nextChildren, container, parentComponent, anchor);
            }
            else {
                // 4. 新的children是text
                hostSetElementText(container, nextChildren);
            }
        }
    }
    /**
     * 双端对比算法实现diff
     * @param preChildren
     * @param nextChildren
     * @param container
     * @param parentComponent
     */
    function patchKeyedChildren(preChildren, nextChildren, container, parentComponent, parentAnchor) {
        const nextLength = nextChildren.length;
        // 老children数组的末尾指针
        let e1 = preChildren.length - 1;
        // 新children 的左侧第一个指针
        let i = 0;
        // 新children数组的末尾指针
        let e2 = nextLength - 1;
        function isSomeVNode(preVNode, nextVNode) {
            return preVNode.type === nextVNode.type
                && preVNode.key === nextVNode.key;
        }
        // 先左侧对比，移动i指针，老的和新的元素不同，i就停下
        while (i <= e1 && i <= e2) {
            const preVNode = preChildren[i];
            const nextVNode = nextChildren[i];
            if (isSomeVNode(preVNode, nextVNode)) {
                // 是同一个元素继续patch递归进去
                patch(preVNode, nextVNode, container, parentComponent, parentAnchor);
            }
            else {
                // 不是同一个元素就可以跳出循环了
                break;
            }
            i++; // i指针右移，停下的位置就是新老两个数组不同部分的起始点，也就是中间不同的起始点
        }
        // 再右侧对比，移动右边的两个末尾指针
        while (i <= e1 && i <= e2) {
            const preVNode = preChildren[e1];
            const nextVNode = nextChildren[e2];
            if (isSomeVNode(preVNode, nextVNode)) {
                patch(preVNode, nextVNode, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--; // e1指针左移，停下的位置就是老数组中间不同部分的截止点
            e2--; // e2指针左移，停下的位置就是新数组中间不同部分的截止点
        }
        console.log('i is: ', i);
        console.log('e1 is: ', e1);
        console.log('e2 is: ', e2);
        // 经过上面的三个指针左右对比，确定出新老数组中间的不同部分起止点
        // 可以开始处理元素更新
        // 新的比老的长，左侧先找
        if (i > e1) {
            if (i <= e2) {
                // 有可能前面多了，需要加上锚点，知道在哪插入
                const nextPost = e2 + 1; // 所谓的锚点索引，往前一位
                const anchor = nextPost < nextLength ? nextChildren[nextPost].el : null;
                // 说明新的比老的多了，有可能是多个
                while (i <= e2) {
                    patch(null, nextChildren[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的长，需要删除元素
            while (i <= e1) {
                hostRemove(preChildren[i].el);
                i++;
            }
        }
        else {
            // TODO 中间部分
            // 经过前面的左右双端对比和上面的判断新老哪个长之后
            // 最终确定除了最后的中间部分的变化内容
            // 1. 先处理中间部分中老的比新的长的情况，删除老的多的部分
            const startPrev = i; // 确定老数组中间部分的开始位置
            const startNext = i; // 确实新数组中间部分的开始位置
            // 优化点，确定新的中需要对比的元素总个数
            // 如果老的>=这个个数，直接删除后续的元素即可
            const shouldToBePatched = e2 - startNext + 1;
            // 中间部分新的已经处理了几个VNode
            let patched = 0;
            const keyToNewIndexMap = new Map();
            // 为了缩短时间复杂度，使用map形式存放新数组的元素，从O(N)降为O(1)
            // 遍历新数组中间部分，构建新数组中间部分的map
            for (let i = startNext; i <= e2; i++) {
                const nextChild = nextChildren[i]; // 都是VNode
                // 使用props的key做map的key，map的value就是索引值
                // 建立了props.key和index的map映射
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 遍历旧数组中间部分，和新的进行对比，确定该删除哪些元素
            for (let i = startPrev; i <= e1; i++) {
                const prevChild = preChildren[i];
                // 注意📢
                // 注意📢
                // 注意📢
                if (patched >= shouldToBePatched) {
                    // 如果处理过的已经超过了应该处理的元素个数，直接删了就行
                    hostRemove(prevChild.el);
                    continue;
                }
                // 找新数组中的index，看看旧数组的中间部分在不在新的数组的中间部分里
                let newIndex;
                // 有可能新的props上没有key
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 遍历新的数组的中间部分，比较VNode是不是同一个
                    for (let j = startNext; j < e2; j++) {
                        if (isSomeVNode(prevChild, nextChildren[j])) {
                            newIndex = j;
                            break; // 找到不一样的了跳出循环
                        }
                    }
                }
                // 找不到newIndex，就说明新的里面没有了，该删除了
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    // 如果能找到newIndex，从找到的newIndex继续递归patch
                    patch(prevChild, nextChildren[newIndex], container, parentComponent, null);
                    // 处理过多少个元素了累加
                    patched++;
                }
            }
        }
    }
    /**
     * 更新props属性值
     * @param oldProps
     * @param newProps
     * @param el
     */
    function patchProps(oldProps, newProps, el) {
        // console.log('oldProps is', oldProps);
        // console.log('newProps is', newProps);
        // console.log('=', oldProps === newProps);
        // 两者不一样才对比
        if (hasChanged(oldProps, newProps)) {
            for (const key in newProps) {
                if (Object.prototype.hasOwnProperty.call(newProps, key)) {
                    const preProp = oldProps[key];
                    const nextProp = newProps[key];
                    // 1. 值被修改了 
                    // 2. 值被修改成undefined 靠nextProp的值，在hostPatchProp中处理
                    if (preProp !== nextProp) {
                        hostPatchProp(el, key, preProp, nextProp);
                    }
                }
            }
        }
        if (oldProps !== EMPTY_OBJECT) {
            for (const key in oldProps) {
                if (Object.prototype.hasOwnProperty.call(oldProps, key)) {
                    // 3. key直接被删了
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(newVNode, container, parentComponent, anchor) {
        const element = (newVNode.el = hostCreateElement(newVNode.type));
        const { props } = newVNode;
        // 其实就是属性值
        for (const key in props) {
            if (Object.prototype.hasOwnProperty.call(props, key)) {
                const value = props[key];
                hostPatchProp(element, key, null, value);
            }
        }
        const { children, shapeFlag } = newVNode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            element.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            mountChildren(newVNode.children, element, parentComponent, anchor);
        }
        hostInsert(container, element, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(vnode => {
            patch(null, vnode, container, parentComponent, anchor);
        });
    }
    function unmountChildren(children) {
        children.forEach((child) => {
            hostRemove(child.el);
        });
    }
    function processFragment(oldVNode, newVNode, container, parentComponent, anchor) {
        mountChildren(newVNode.children, container, parentComponent, anchor);
    }
    function processText(oldVNode, newVNode, container) {
        const { children } = newVNode;
        const textNode = (newVNode.el = document.createTextNode(children));
        container.append(textNode);
    }
    return {
        createApp: createAppAPI(render),
    };
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

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, preValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const eventName = key.slice(2).toLowerCase();
        el.addEventListener(eventName, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextValue);
        }
    }
}
function insert(container, child, anchor) {
    // container.append(element)
    // anchor是null就和上面一样了
    container.insertBefore(child, anchor || null);
}
function remove(el) {
    const parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
