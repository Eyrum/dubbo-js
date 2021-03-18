import Hessian from 'hessian.js';

it('test BigDecimal', () => {
  Hessian.registerDecodeHandler('java.math.BigDecimal', function (result) {
    return {
      $class: result.$class,
      $: result.$.value,
    };
  });

  const o = {$class: 'java.math.BigDecimal', $: {value: '100.06'}};
  const buf = Hessian.encode(o, '1.0');
  const output = Hessian.decode(buf, '1.0');
  expect(output).toEqual('100.06');
});
