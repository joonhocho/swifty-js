if (typeof Promise === 'undefined') {
  require('es6-promise').polyfill();
}
require('chai').use(require('chai-as-promised'));
