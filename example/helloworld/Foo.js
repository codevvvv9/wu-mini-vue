import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    console.log('foo props is', props);

    // props 对象是浅制度的shallow readonly
    props.count++
    console.log('foo props count ++ is', props);
  },
  render() {
    return h('div', {}, 'foo:' + this.count)
  },
}