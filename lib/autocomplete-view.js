(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('autocomplete-view', [
      'underscore',
      'backbone',
      './item-view'], factory);
  } else if (typeof exports === 'object') {
    // Node.
    module.exports = factory(
      require('underscore'),
      require('backbone'),
      require('./item-view'));
  }

}(this, function (_, Backbone, Item) {
  'use strict';

  var FILTER_ATTR = 'label';
  var SEARCH_ATTR = 'search';
  var WAIT = 250;
  var EVENT_MAP = {
    'keyup.autocomplete': 'onKeyup',
    'blur.autocomplete': 'onBlur',
    'focus.autocomplete': 'onFocus',
    'change.autocomplete': 'onChange'
  };
  var KEY_MAP = {
    9: 'tab',
    13: 'enter',
    38: 'up',
    40: 'down',
    27: 'escape'
  };

  function define(config) {
    config = (config || {});

    // Define "private" constants
    var ItemView = (config.ItemView || Item);
    var wait = (config.wait || WAIT);
    var filterAttr = (config.filterAttr || FILTER_ATTR);
    var searchAttr = (config.searchAttr || SEARCH_ATTR);

    var Autocomplete = Backbone.View.extend({
      constructor: function (options) {
        _.bindAll(this, 'searchMethod', 'onSync', 'onRequest', 'onError', 'filter', 'fetchData', 'setValue');

        options = (options || {});

        this.render = _.partial(this.render, _, {});

        // Merge events
        options.events = (_.result(options, 'events') || {});
        _.defaults(options.events, _.result(this, 'events'), EVENT_MAP);

        // Ensure model
        options.model = (options.model || new Backbone.Model());
        this.listenTo(options.model, {
          'change:value': this.fetchData,
          'change:isSelected': this.setValue
        });

        // Set up collection
        options.collection = (options.collection || new Backbone.Collection());
        this.listenTo(options.collection, {
          'sync': this.onSync,
          'error': this.onError,
          'request': this.onRequest
        });

        return Backbone.View.call(this, options);
      },

      filter: function (model, value, options) {
        value = (value || (this.model.get('value') || ''));
        var searchMethod = _.partial(this.searchMethod, value);

        this.render(this.collection.filter(searchMethod));
      },

      fetchData: _.throttle(function (model, value, options) {
        var data = {};

        if (!_.result(this.collection, 'url')) return;

        data[searchAttr] = value;

        this.collection.fetch({data: data});
      }, wait),

      setValue: function (model, value, options) {
        this.$el.val(value);
      },

      onKeyup: function (event) {
        switch (KEY_MAP[event.keyCode]) {
          case 'enter':
            this.fetchData();
            break;
          case 'escape':
            this.render();
            break;
          case 'up': // TODO: navigate
          case 'down': // TODO: navigate
          case 'tab': // TODO: dunno
            break;
          default:
              this.model.set('value', this.$el.val());
              this.filter();
            break;
        }
      },

      onChange: function () {
        this.model.set('value', this.$el.val());
        this.filter();
      },

      onBlur: function (event) {
        this.render();
      },

      onFocus: function (event) {
        this.filter();
      },

      onSync: function (collection, resp, options) {
        this.$el.removeClass('is-loading is-invalid');

        this.filter();
      },

      onError: function (collection, xhr, options) {
        this.$el.addClass('is-invalid');

        this.render();
      },

      onRequest: function (collection, xhr, options) {
        this.$el.addClass('is-loading').removeClass('is-invalid');
      },

      render: function (models, cache) {
        var $frag = Backbone.$([]);
        var $list = (cache.$list || (cache.$list = Backbone.$(this.template())));

        _(models).forEach(function (model, index, list) {
          var view = new ItemView({
            model: model
          });

          $frag = $frag.add(view.render().$el);
        });

        $list.html($frag.length ? $frag : '');
        $list.insertAfter(this.$el);
      },

      template: _.template('<ul></ul>'),

      searchMethod: function (value, model, index, list) {
        var term = model.get(filterAttr).toLowerCase();

        if (term.indexOf(value.toLowerCase().trim()) !== -1) {
          return true;
        } else {
          return false;
        }
      }
    },{
      define: define,
      Item: Item
    });

    return Autocomplete;
  }

  return define();
}));
