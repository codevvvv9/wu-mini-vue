import { ShapeFlags } from "../shared/ShapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp";
import { FragmentType, VNode, TextType } from "./vnode"
import { effect } from '../reactivity/effect'
import { EMPTY_OBJECT, hasChanged } from "../shared/index";
import { shouldUpdateComponent } from './componentUpdateUtils'

export function createRenderer(options: any) {
  // 接受自定义的三个函数
  const { 
    createElement: hostCreateElement,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
   } = options

  function render(newVNode: VNode, container) {
    // 第一次的顶级组件，没有父组件
    patch(null, newVNode, container, null, null)
  }

  /**
   * 打补丁
   * @param oldVNode 
   * @param newVNode 
   * @param container 
   */
  function patch(oldVNode, newVNode: VNode, container, parentComponent, anchor) {
    // 判断是不是element
    // 如何判断是element还是component
    const { shapeFlag, type } = newVNode
    switch (type) {
      case FragmentType:
        processFragment(oldVNode, newVNode, container, parentComponent, anchor)
        break;
      case TextType:
        processText(oldVNode, newVNode, container)
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // 是element，到了render内部的真正的h()
          processElement(oldVNode, newVNode, container, parentComponent, anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 是component
          processComponent(oldVNode, newVNode, container, parentComponent, anchor)
        }
        break;
    }
  }

  /**
   * 处理组件
   * @param newVNode 
   * @param container 
   */
  function processComponent(oldVNode, newVNode: any, container: any, parentComponent, anchor) {
    // 区分是直接加载组件还是更新组件
    if (!oldVNode) {
      mountComponent(newVNode, container, parentComponent, anchor)
    } else {
      updateComponent(oldVNode, newVNode)
    }
  }

  function updateComponent(oldVNode: VNode, newVNode: VNode) {
    const instance = (newVNode.component = oldVNode.component)

    if ( shouldUpdateComponent(oldVNode, newVNode) ) {
      instance.next = newVNode
      instance.update()
    } else {
      newVNode.el = oldVNode.el
      instance.vnode = newVNode
    }
  }

  /**
   * 加载组件
   * @param newVNode 
   * @param container 
   */
  function mountComponent(initialVNode: VNode, container: any, parentComponent, anchor) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode, parentComponent
    ))

    setupComponent(instance)
    setupRenderEffect(instance, initialVNode, container, anchor)
  }
  function setupRenderEffect(instance: any, initialVNode: VNode, container: any, anchor) {
    // 值一更新 set 就会执行effect里面的函数, 被依赖收集到
    // 但是要区分初始化和更新
    instance.update = effect(() => {
      if (!instance.isMounted) {
        // 初始化 时先把subTree存起来
        console.log('init patch');
        
        // 是一个vnode树
        // 绑定proxy到render函数上
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
    
        // newVNode -> element -> mountElement
        patch(null, subTree, container, instance, anchor)
    
        // 这个时候element都被加载完了，处理vnode上的el
        initialVNode.el = subTree.el

        instance.isMounted = true
      } else {
        // 只是更新了，不需要再patch
        console.log('update patch');
        
        const { next, vnode } = instance
        if ( next ) {
          next.el = vnode.el
          updateComponentPreRender(instance, next)
        } 

        // 是一个vnode树
        // 绑定proxy到render函数上
        const { proxy } = instance
        // 新树
        const subTree = instance.render.call(proxy)
        // 获取初始化时存的那个老树
        const prevSubTree = instance.subTree
        // 重新赋值，赋值新树成为下一次的老树
        instance.subTree = subTree
        // newVNode -> element -> mountElement
        patch(prevSubTree, subTree, container, instance, anchor)
      }
    })
  }

  function processElement(oldVNode, newVNode: VNode, container: any, parentComponent, anchor) {
    // 区分是初始化还是更新操作
    if (!oldVNode) {
      // 初始化
      mountElement(newVNode, container, parentComponent, anchor)
    } else {
      patchElement(oldVNode, newVNode, container, parentComponent, anchor)
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
    const oldProps = oldVNode.props || EMPTY_OBJECT
    const newProps = newVNode.props || EMPTY_OBJECT
    // el在mountElement赋值的
    // 使用初始的oldVNode.el 传递设置el值，保证下次来的时候有值
    const el = (newVNode.el = oldVNode.el)

    patchProps(oldProps, newProps, el)

    patchChildren(oldVNode, newVNode, el, parentComponent, anchor)
  }

  function patchChildren(oldVNode: VNode, newVNode: VNode, container: Element, parentComponent, anchor) {
    const { shapeFlag: preShapeFlag } = oldVNode
    const preChildren = oldVNode.children
    const { shapeFlag: nextShapeFlag } = newVNode
    const nextChildren = newVNode.children


    if ( preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // 老的children是array
      if (nextShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 1.老的children是array，新的children是text
        // 先清理children，再赋值text
        unmountChildren(preChildren)
        hostSetElementText(container, nextChildren)
      } else {
        // 2. 新的children也是array，情况比较复杂
        patchKeyedChildren(preChildren, nextChildren, container, parentComponent, anchor)
      }
    } else {
      // 老的children是text
      if (nextShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 3. 新的children是array
        // 先清空
        hostSetElementText(container, '')
        // 再赋值
        mountChildren(nextChildren, container, parentComponent, anchor)
      } else {
        // 4. 新的children是text
        hostSetElementText(container, nextChildren)
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
    const nextLength = nextChildren.length
    // 老children数组的末尾指针
    let e1 = preChildren.length - 1 
    // 新children 的左侧第一个指针
    let i = 0 
    // 新children数组的末尾指针
    let e2 = nextLength - 1

    function isSomeVNode(preVNode, nextVNode) {
      return preVNode.type === nextVNode.type 
        && preVNode.key === nextVNode.key
    }
    // 先左侧对比，移动i指针，老的和新的元素不同，i就停下
    while (i <= e1 && i <= e2) {
      const preVNode = preChildren[i]
      const nextVNode = nextChildren[i]

      if (isSomeVNode(preVNode, nextVNode)) {
        // 是同一个元素继续patch递归进去
        patch(preVNode, nextVNode, container, parentComponent, parentAnchor)
      } else {
        // 不是同一个元素就可以跳出循环了
        break
      }

      i++ // i指针右移，停下的位置就是新老两个数组不同部分的起始点，也就是中间不同的起始点
    }

    // 再右侧对比，移动右边的两个末尾指针
    while (i <= e1 && i <= e2) {
      const preVNode = preChildren[e1]
      const nextVNode = nextChildren[e2]

      if(isSomeVNode(preVNode, nextVNode)) {
        patch(preVNode, nextVNode, container, parentComponent, parentAnchor)
      } else {
        break
      }

      e1-- // e1指针左移，停下的位置就是老数组中间不同部分的截止点
      e2-- // e2指针左移，停下的位置就是新数组中间不同部分的截止点
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
        const nextPost = e2 + 1 // 所谓的锚点索引，往前一位
        const anchor = nextPost < nextLength ? nextChildren[nextPost].el : null
        // 说明新的比老的多了，有可能是多个
        while (i <= e2) {
          patch(null, nextChildren[i], container, parentComponent, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // 老的比新的长，需要删除元素
      while (i <= e1) {
        hostRemove(preChildren[i].el)
        i++
      }
    } else {
      // TODO 中间部分
      // 经过前面的左右双端对比和上面的判断新老哪个长之后
      // 最终确定除了最后的中间部分的变化内容
      // 1. 先处理中间部分中老的比新的长的情况，删除老的多的部分
      const startPrev = i // 确定老数组中间部分的开始位置
      const startNext = i // 确实新数组中间部分的开始位置
      // 优化点，确定新的中需要对比的元素总个数
      // 如果老的>=这个个数，直接删除后续的元素即可
      const shouldToBePatched = e2 - startNext + 1
      // 中间部分新的已经处理了几个VNode
      let patched = 0


      const keyToNewIndexMap = new Map()

      //为了处理中间数组的移动，需要把新数组的中间数组的索引用数组存储
      // 找到这个新数组的最大递增子序列
      const newIndexToOldIndexMap = new Array(shouldToBePatched)
      let moved = false // 是否需要移动的标志
      let maxNewIndexSoFar = 0
      // 初始化中间数组的索引数组
      for (let i = 0; i < shouldToBePatched; i++) {
        newIndexToOldIndexMap[i] = 0
      }


      // 为了缩短时间复杂度，使用map形式存放新数组的元素，从O(N)降为O(1)
      // 遍历新数组中间部分，构建新数组中间部分的map
      for (let i = startNext; i <= e2; i++) {
        const nextChild = nextChildren[i]; // 都是VNode
        // 使用props的key做map的key，map的value就是索引值
        // 建立了props.key和index的map映射
        keyToNewIndexMap.set(nextChild.key, i)
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
        let newIndex
        // 有可能新的props上没有key
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else {
          // 遍历新的数组的中间部分，比较VNode是不是同一个
          for (let j = startNext; j < e2; j++) {
            if (isSomeVNode(prevChild, nextChildren[j])) {
              newIndex = j
              break // 找到不一样的了跳出循环
            }
          }
        }

        // 找不到newIndex，就说明新的里面没有了，该删除了
        if (newIndex === undefined) {
          hostRemove(prevChild.el)
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex
          } else {
            // 新数组中的索引比max都小，可以移动
            moved = true
          }

          newIndexToOldIndexMap[newIndex - startNext] = i + 1

          // 如果能找到newIndex，从找到的newIndex继续递归patch
          patch(prevChild, nextChildren[newIndex], container, parentComponent, null)
          // 处理过多少个元素了累加
          patched++
        }
      }

      // 获取最大递增子序列
      const increasingNewIndexSequence: any[] = moved
        ? getSequence(newIndexToOldIndexMap)
        : []
      let j = increasingNewIndexSequence.length - 1

      // 反向遍历
      for (let i = shouldToBePatched - 1; i >= 0; i--) {
        const nextIndex = i + startNext
        const nextChild = nextChildren[nextIndex]
        const anchor = nextIndex + 1 < nextLength ? nextChildren[nextIndex + 1].el : null

        // 如果newIndexToOldIndexMap没有值，继续patch
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            hostInsert(container, nextChild.el, anchor)
          } else {
            j--
          }
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
  function patchProps(oldProps: any, newProps: any, el: any) {
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
            hostPatchProp(el, key, preProp, nextProp)
          }
        } 
      }
    }

    if (oldProps !== EMPTY_OBJECT) {
      for (const key in oldProps) {
        if (Object.prototype.hasOwnProperty.call(oldProps, key)) {
          // 3. key直接被删了
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
          
        }
      }
    }
  }
  function mountElement(newVNode, container: Element, parentComponent, anchor) {
    const element: Element = (newVNode.el = hostCreateElement(newVNode.type))

    const { props } = newVNode
    // 其实就是属性值
    for (const key in props) {
      if (Object.prototype.hasOwnProperty.call(props, key)) {
        const value = props[key];
        hostPatchProp(element, key, null, value)
      }
    }

    const { children, shapeFlag } = newVNode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      element.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(newVNode.children, element, parentComponent, anchor)
    }

    hostInsert(container, element, anchor)
  }

  function mountChildren(children, container: Element, parentComponent, anchor) {
    children.forEach(vnode => {
      patch(null, vnode, container, parentComponent, anchor)
    })
  }

  function unmountChildren(children: Array<VNode>) {
    children.forEach((child: VNode) => {
      hostRemove(child.el)
    })
  }
  function processFragment(oldVNode, newVNode: any, container: any, parentComponent, anchor) {
    mountChildren(newVNode.children, container, parentComponent, anchor)
  }

  function processText(oldVNode, newVNode: VNode, container: Element) {
    const { children } = newVNode
    const textNode = (newVNode.el = document.createTextNode(children))
    container.append(textNode)
  }

  return {
    createApp: createAppAPI(render),
  }
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode
  instance.next = null

  instance.props = nextVNode.props
}
/**
 * 获取数组中的最大递增子序列
 * @param arr 要处理的数组
 * @returns 
 */
function getSequence(arr: any[]) {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}