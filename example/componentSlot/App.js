import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    const app = h('div', {}, 'App')

    // const foo = h(Foo)
    // 1. 基础版插槽就是想p标签能在Foo组件内显示出来，即单元素 -> vnode的
    // const foo = h(Foo, {}, h("p", {}, "123"));
    // 2. 基础2版插槽就是数组形式，多个子元素 即多元素 []
    // const foo = h(Foo, {}, [h("p", {}, "123"), h("p", {}, "456")]);
    // 3. 基础3版插槽，可以指定插入位置：
    // 首先获取要渲染的元素
    // 要获取到渲染的位置
    // 为了获取位置方便，将上面的数组改成map结构
    // const foo = h(Foo, {}, {
    //   'header': h("p", {}, "header"), 
    //   'footer': h("p", {}, "footer"),
    // });

    // 4, 实现作用域插槽，能够获取到内部暴露的变量，使用函数
    const foo = h(Foo, {}, {
      'header': ({ age }) => h("p", {}, "header " + age), 
      'footer': () => h("p", {}, "footer"),
    });
    return h('div', {}, [app, foo])
  },
  setup() {
    return {}
  }
}