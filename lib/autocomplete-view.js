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

  /**
   * Constants
   */
  var IS_SELECTED = {'isSelected': true};
  var FILTER_ATTR = 'label';
  var SEARCH_ATTR = 'search';
  var WAIT = 250;
  var THRESHOLD = 2;
  var EVENT_MAP = {
    'keyup.autocomplete': 'onKeyup',
    'blur.autocomplete': 'onBlur',
    'focus.autocomplete': 'onFocus',
    'change.autocomplete': 'onChange'
  };
  var KEY_MAP = {
    8: 'backspace',
    46: 'delete',
    13: 'enter',
    38: 'up',
    40: 'down',
    27: 'escape'
  };

  function define(config) {
    config = (config || {});

    /**
     * Set up private constants
     */
    _.defaults(config, {
      Item        : Item,
      wait        : WAIT,
      filterAttr  : FILTER_ATTR,
      searchAttr  : SEARCH_ATTR,
      threshold   : THRESHOLD
    });

    var Autocomplete = Backbone.View.extend({
      /**
       * Bootstrap events
       */
      constructor: function (options) {
        _.bindAll(this, 'searchMethod', 'onSync', 'onRequest', 'onError', 'filter', 'fetchData', 'onSelect');

        options = (options || {});

        // Set up the render and remove methods w/ a cache hash
        var cache = {};
        this.render = _.partial(this.render, _, cache);
        this.remove = _.partial(this.remove, _, cache);

        // Debounce the fetch method to prevent excess calls
        this.fetchData = _.debounce(this.fetchData, config.wait);

        // Merge events
        options.events = (_.result(options, 'events') || {});
        _.defaults(options.events, _.result(this, 'events'), EVENT_MAP);

        // Ensure model
        options.model = (options.model || new Backbone.Model());
        this.listenTo(options.model, {
          'change:value': this.fetchData
        });

        // Set up collection
        options.collection = (options.collection || new Backbone.Collection());
        this.listenTo(options.collection, {
          'sync': this.onSync,
          'error': this.onError,
          'request': this.onRequest,
          'change:isSelected': this.onSelect
        });

        return Backbone.View.call(this, options);
      },

      /**
       * Filter out mathching items
       */
      filter: function (model, value, options) {
        value = (value || (this.model.get('value') || ''));

        if (value.length < config.threshold) {
          return [];
        } else {
          return this.collection.filter(_.partial(this.searchMethod, value));
        }
      },

      /**
       * Make the fetch
       */
      fetchData: function (model, value, options) {
        var data = {};

        if (!_.result(this.collection, 'url')) return;

        value = this.model.get('value');

        if (value.length >= config.threshold) {
          data[config.searchAttr] = value;

          this.collection.fetch({data: data});
        }
      },

      /**
       * Reflect model changes in the DOM
       */
      onSelect: function (model, value, options) {
        if (value) {
          this.$el.val(model.get(config.filterAttr));
          _(this.collection.without(model)).invoke('set', 'isSelected', false);
        }
      },

      /**
       * Act on input
       */
      onKeyup: function (event) {
        var selected, index, filter, matches, next;
        var collection = this.collection;
        var key = KEY_MAP[event.keyCode];

        switch (key) {
          case 'escape':
            // Hide everything on escape key
            this.render();
            break;
          case 'enter':
          case 'up':
          case 'down':
            filter = _.partial(this.searchMethod, this.model.get('value'));
            matches = collection.filter(filter);
            selected = collection.findWhere(IS_SELECTED);

            if (!selected || !_.contains(matches, selected)) {
              // If there's no selected model

              switch (key) {
                case 'enter':
                case 'down':
                  // Enter and down both select the first one
                  next = 0;

                  if (key === 'enter') {
                    // Enter also hides the list
                    this.render();
                  }
                  break;
                case 'up':
                  // Up selects the last one
                  next = (matches.length - 1);
                break;
              }
            } else {
              index = _.indexOf(matches, selected);

              switch (key) {
                case 'down':
                  // Get next one down or first if we're at the bottom
                  next = (index === (matches.length - 1)) ? 0 : (index + 1);
                  break;
                case 'up':
                  // Get the previous one or or the last one if we're at the top
                  next = (index === 0) ? (matches.length - 1) : (index - 1);
                  break;
                case 'enter':
                  // Fetch data right away, don't mind selecting anything new
                  this.fetchData();
                  this.render();
                  next = index;
                  break;
              }
            }

            // Set state of the now selected model
            matches[next].set(IS_SELECTED);

            break;
          default:
              // All uncaptured and alpha-numeric keys perform filtering
              if (key || (event.keyCode >= 48)) {
                this.model.set('value', this.$el.val());
                this.collection.invoke('set', 'isSelected', false);
                this.render(this.filter());
              }
            break;
        }
      },

      /**
       * Save state to model and initiate filtering
       */
      onChange: function () {
        this.model.set('value', this.$el.val());
        this.render(this.filter());
      },

      /**
       * Render w/o models on blur
       */
      onBlur: function (event) {
        this.render();
      },

      /**
       * Render whatever we've got on focus
       */
      onFocus: function (event) {
        this.render(this.filter());
      },

      /**
       * Handle new dataset
       */
      onSync: function (collection, resp, options) {
        this.$el.removeClass('is-loading is-invalid');

        this.render(this.filter());
      },

      /**
       * Empty list on error
       */
      onError: function (collection, xhr, options) {
        this.$el.addClass('is-invalid');

        this.render();
      },

      /**
       * Indicate loading state
       */
      onRequest: function (collection, xhr, options) {
        this.$el.addClass('is-loading').removeClass('is-invalid');
      },

      /**
       * Renders models handed to it
       */
      render: function (models, cache) {
        var $frag = Backbone.$([]);
        var $list = (cache.$list || (cache.$list = Backbone.$(this.template())));

        if (!models || !models.length) {
          cache.$list.remove();
          return this;
        }

        _(models).forEach(function (model, index, list) {
          var view = new config.Item({
            model: model
          });

          $frag = $frag.add(view.render().$el);
        });

        $list.html($frag);
        $list.insertAfter(this.$el);

        return this;
      },

      /**
       * Make sure to clean up after our selves
       */
      remove: function (cache) {
        var $list = cache.$list;

        if ($list) {
          $list.remove();
        }

        return Backbone.View.prototype.remove.call(this);
      },

      /**
       * Default template
       * You'll problably want to write over this
       */
      template: _.template('<ul></ul>'),

      /**
       * Method used for matching models against search string
       */
      searchMethod: function (value, model, index, list) {
        var term = model.get(config.filterAttr).toLowerCase();

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
