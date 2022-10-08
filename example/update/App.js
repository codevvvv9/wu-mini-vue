import { h, ref } from '../../lib/guide-mini-vue.esm.js'

export default {
  name: "App",
  setup() {
    const count = ref(0)

    const onClick = () => count.value++

    return {
      count,
      onClick,
    }
  },
  render() {
    return h(
      'div',
      {
        'id': 'root',
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
      ]
    );
  },
};