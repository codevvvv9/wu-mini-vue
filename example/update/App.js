import { h, ref } from '../../lib/guide-mini-vue.esm.js'

export default {
  name: "App",
  setup() {
    const count = ref(0)

    const onClick = () => count.value++

    const props = ref({
      'foo': 'foo',
      'bar': 'bar',
    })
    // 三种方式修改props属性值
    const onChangeProps1 = () => {
      props.value.foo = 'new-foo'
    }
    const onChangeProps2 = () => {
      props.value.foo = undefined
    }
    const onChangeProps3 = () => {
      props.value = {
        'foo': 'foo',
      }
    }

    return {
      count,
      onClick,
      onChangeProps1,
      onChangeProps2,
      onChangeProps3,
      props,
    }
  },
  render() {
    return h(
      'div',
      {
        'id': 'root',
        // 这里的get操作 track 收集依赖
        // ...this.props,
        // 等同于下面写法，这里已经被解开了
        'foo': this.props.foo,
        'bar': this.props.bar,
      },
      [
        h('div', {}, 'count is: ' + this.count), // 收集依赖
        h(
          'button', 
          {
            onClick: this.onClick,
          },
          'click'
        ),
        h(
          'button', 
          {
            onClick: this.onChangeProps1,
          },
          'changeProps-值改变了-修改'
        ),
        h(
          'button', 
          {
            onClick: this.onChangeProps2,
          },
          'changeProps-值变成了undefined-删除'
        ),
        h(
          'button', 
          {
            onClick: this.onChangeProps3,
          },
          'changeProps-key值再新的里面没了-删除'
        ),
      ]
    );
  },
};