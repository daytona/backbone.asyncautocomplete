(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('backbone.asyncautocomplete', ['./lib/autocomplete-view'], factory);
  } else if (typeof exports === 'object') {
    // Node.
    module.exports = factory(require('./lib/autocomplete-view'));
  }

}(this, function (Autocomplete) {
  'use strict';

  return Autocomplete;
}));
