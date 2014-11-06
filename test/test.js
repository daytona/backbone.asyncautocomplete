(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      'backbone.asyncautocomplete',
      'underscore',
      'backbone',
      'jquery'
    ], factory);
  } else if (typeof exports === 'object') {
    // CommonJS.
    module.exports = factory(
      require('../main'),
      require('underscore'),
      require('backbone'),
      require('jquery'));
  }

}(this, function (AsyncAutocomplete, _, Backbone, $) {
  'use strict';

  var DATA = [{
    "name": "Leanne Graham"
  }, {
    "name": "Ervin Howell"
  }, {
    "name": "Clementine Bauch"
  }, {
    "name": "Patricia Lebsack"
  }, {
    "name": "Chelsey Dietrich"
  }, {
    "name": "Mrs. Dennis Schulist"
  }, {
    "name": "Kurtis Weissnat"
  }, {
    "name": "Nicholas Runolfsdottir V"
  }, {
    "name": "Glenna Reichert"
  }, {
    "name": "Clementina DuBuque"
  }].map(function (model, index, list) {
    // The default item template expects a label
    model.label = _.uniqueId('label-');
    return model;
  });

  Backbone.$ = (Backbone.$ || $);

  Backbone.sync = function (method, model, options) {
    options.success([]);

    return (new $.Deferred()).resolve([]);
  };

  (function () {
    /*global QUnit */

    QUnit.module('Common JS test suite', {
      setup: function () {
        var $el = $('<input />', {
          id: 'input',
          type: 'hidden'
        });

        $('body').append($el);
      },
      teardown: function () {
        $('#input').remove();
      }
    });

    QUnit.test('Has class properties', function (assert) {
      assert.ok(_.isFunction(AsyncAutocomplete.Item), '"Item"');
      assert.ok(_.isFunction(AsyncAutocomplete.define), '"define"');
    });

    QUnit.test('Class decalration', function (assert) {
      var Defined = AsyncAutocomplete.define({});

      assert.ok(
        ((new AsyncAutocomplete()) instanceof AsyncAutocomplete),
        'Exports extendable class');
      assert.ok(
        !((new Defined()) instanceof AsyncAutocomplete),
        'Define returns a new class');
    });

    QUnit.test('Has model hooked up to DOM', function (assert) {
      var $el = $('#input');

      var view = new AsyncAutocomplete({el: $el});

      assert.ok(!view.model.has('value'), 'No initial value');

      $el.val('test').trigger('change');

      assert.strictEqual($el.val(), view.model.get('value'), 'Changes with DOM');
    });

    QUnit.test('Custom settings', function (assert) {
      var $el = $('#input');
      var CustomView = AsyncAutocomplete.define({
        filterAttr: 'name',
        threshold: 4
      });

      var view = new CustomView({
        el: $el,
        collection: new Backbone.Collection(DATA)
      });

      $el.val('lea').trigger('change');

      assert.strictEqual(view.filter().length, 0, 'Threshold prevents filtering');

      $el.val('lean').trigger('change');

      assert.ok((view.filter().length > 0), 'Filters by custom attribute');
    });

    QUnit.test('Default search method', function (assert) {
      var $el = $('#input');
      var CustomView = AsyncAutocomplete.define({
        filterAttr: 'name'
      });

      var view = new CustomView({
        el: $el,
        collection: new Backbone.Collection(DATA)
      });

      $el.val('na').trigger('change');

      assert.strictEqual(view.filter().length, 3, '"na" gives three hits');

      $el.val('foo').trigger('change');

      assert.strictEqual(view.filter().length, 0, '"foo" gives no hits');
    });

    QUnit.asyncTest('Fetch options', function (assert) {
      assert.expect(2);

      var timer = new Date();
      var $el = $('#input');
      var AsyncCollection = Backbone.Collection.extend({
        url: 'foo'
      });
      var CustomView = AsyncAutocomplete.define({
        searchAttr: 'name',
        wait: 1000
      });

      var view = new CustomView({
        el: $el,
        collection: new AsyncCollection()
      });

      view.collection.on('sync', function (collecion, xhr, options) {
        var diff = (new Date() - timer);
        var margin = Math.abs(1000 - diff);
        var params = (options.data && _.keys(options.data));

        assert.ok(
          ((diff >= 1000) && (diff < 1050)),
          'wait 1000ms before request (' + margin + 'ms margin of error)');

        assert.ok(params && _.contains(params, 'name'), 'custom search term was used');

        QUnit.start();
      });

      $el.val('na').trigger('change');
    });
  }());
}));
