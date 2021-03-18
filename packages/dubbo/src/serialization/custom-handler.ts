import Hessian from 'hessian.js';

export const BigDecimalHandler = function () {
  Hessian.registerDecodeHandler('java.math.BigDecimal', function (result) {
    return {
      $class: result.$class,
      $: result.$.value,
    };
  });
};
