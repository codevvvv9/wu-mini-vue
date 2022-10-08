import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: 'Foo',
  setup(props, { emit }) {
    const emitAdd = () => {
      console.log('foo emit add');
      emit('add', 1, 2)
      emit('add-foo')
    }
    return {
      emitAdd,
    }
  },
  render() {
    const button = h(
      'button', 
      {
        onClick: this.emitAdd
      },
      'emitAdd',
    )
    const foo = h(
      'p',
      {},
      'foo',
    )
    return h(
      'div',
      {},
      [button, foo]
    )
  },
}