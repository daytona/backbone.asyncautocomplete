(function (root, factory) {
  'use strict';

  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([
      'underscore',
      'backbone',
      './item-view'], factory);
  } else if (typeof exports === 'object') {
    // CommonJS.
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
  var $ = Backbone.$;
  var SELECTED = 'selectedId';
  var IS_SELECTED = {'isSelected': true};
  var IS_CANDIDATE = {'isCandidate': true};
  var IS_EXPANDED = {'aria-expanded': true};
  var NOT_SELECTED = {'isSelected': false};
  var NOT_CANDIDATE = {'isCandidate': false};
  var NOT_EXPANDED = {'aria-expanded': false};
  var FILTER_ATTR = 'label';
  var SEARCH_ATTR = 'search';
  var WAIT = 250;
  var THRESHOLD = 2;
  var EVENT_MAP = {
    'keydown.autocomplete': 'onKeydown',
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

    var AsyncAutocomplete = Backbone.View.extend({
      /**
       * Bootstrap events
       */
      constructor: function (options) {
        var $el = (options.el instanceof $) ? options.el : $(options.el);

        _.bindAll(this, 'search', 'onSync', 'fetchData', 'onSelect');

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
          'error': this.render,
          'change:isSelected': this.onSelect,
          'change:isCandidate': this.whenCandidate
        });

        // Assign accessibility attributes
        $el.attr({
          'role': 'combobox',
          'aria-owns': options.model.cid,
          'aria-autocomplete': 'list'
        });

        return Backbone.View.call(this, options);
      },

      /**
       * Filter out matching items
       */
      filter: function () {
        var value = (this.model.get('value') || '');

        if (value.length < config.threshold) {
          return [];
        } else {
          return this.collection.filter(_.partial(this.search, value));
        }
      },

      /**
       * Make the fetch
       */
      fetchData: function (model, value, options) {
        var data = {};

        if (!_.result(this.collection, 'url')) return;

        if (value.length >= config.threshold) {
          data[config.searchAttr] = value;

          this.collection.fetch({data: data});
        }
      },

      whenCandidate: function (model, value, options) {
        if (value) {
          // Remove candidate state from all other items
          _(this.collection.without(model)).invoke('set', NOT_CANDIDATE);

          // Set aria selected decendant
          this.$el.attr('aria-activedescendant', model.cid);
        }
      },

      /**
       * Reflect model changes in the DOM
       */
      onSelect: function (model, value, options) {
        var notState;

        if (value) {
          // Save ref. to selected for ease of access
          this.model.set(SELECTED, model.id);

          // Ensure that selected model also is candidate (for future ref.)
          model.set(IS_CANDIDATE);

          // Output selection in input
          this.$el.val(model.get(config.filterAttr)).select();

          // Remove candidate and selected states from all other models
          notState = _.extend({}, NOT_CANDIDATE, NOT_SELECTED);
          _(this.collection.without(model)).invoke('set', notState);
        }
      },

      onKeydown: function (event) {
        var candidate;
        var collection = this.collection;
        var key = KEY_MAP[event.keyCode];

        if (key === 'enter') {
          candidate = collection.findWhere(IS_CANDIDATE);

          // Select candidate
          (candidate || this.filter()[0]).set(IS_SELECTED);

          // Hide list and prevent form from posting
          this.render();
          event.preventDefault();
        }
      },

      /**
       * Act on input
       */
      onKeyup: function (event) {
        var candidate, index, matches, next;
        var collection = this.collection;
        var selected = collection.get(this.model.get(SELECTED));
        var key = KEY_MAP[event.keyCode];

        switch (key) {
          case 'escape':
            // Reset last selected value if user aborts
            if (selected) {
              this.$el.val(selected.get(config.filterAttr)).select();
            }

            // Hide everything on escape key
            this.render();
            break;

          case 'up':
          case 'down':
            matches = this.filter();
            candidate = collection.findWhere(IS_CANDIDATE);
            index = _.indexOf(matches, candidate);

            switch (key) {
              case 'down':
                if (candidate) {
                  next = (index === (matches.length - 1)) ? 0 : (index + 1);
                } else {
                  next = 0;
                }
                break;
              case 'up':
                if (candidate) {
                  next = (index === 0) ? (matches.length - 1) : (index - 1);
                } else {
                  next = (matches.length - 1);
                }
                break;
              default:
                next = index;
                break;
            }

            // Set state of the now candidate model
            matches[next].set(IS_CANDIDATE);
            break;

          default:
            // All uncaptured and alpha-numeric keys perform filtering
            if ((key && (key !== 'enter')) || (event.keyCode >= 48)) {
              this.model.set('value', this.$el.val());

              matches = this.filter();


              if (matches.length && !_.contains(matches, selected)) {
                this.collection.invoke('set', NOT_CANDIDATE);

                matches[0].set(IS_CANDIDATE);
              }

              this.render(matches);
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
        var selected = this.collection.get(this.model.get(SELECTED));

        if (selected) {
          this.$el.val(selected.get(config.filterAttr));
        }

        this.render();
      },

      /**
       * Render whatever we've got on focus
       */
      onFocus: function (event) {
        // Select text in input for easy editing
        $(event.target).select();

        // Render propositions
        this.render(this.filter());
      },

      /**
       * Handle new dataset
       */
      onSync: function (collection, resp, options) {
        var matches = this.filter();
        var selected = this.collection.get(this.model.get(SELECTED));

        if (!selected) {
          // Unset selected ref. if it's not among the new models
          this.model.unset(SELECTED);

          // Set first hit as candidate
          if (matches.length) {
            matches[0].set(IS_CANDIDATE);
          }
        }

        this.render(matches);
      },

      /**
       * Renders models handed to it
       */
      render: function (models, cache) {
        var $frag = $([]);
        var attrs = _.clone(this.model.attributes);
        var $list = (cache.$list || (cache.$list = $(this.template(attrs))));

        if (!models || !models.length) {
          // Remove list if there are no models to render
          cache.$list.remove();

          // Unset all aria selected attributes
          this.$el.attr(NOT_EXPANDED).removeAttr('aria-activedescendant');

          return this;
        }

        // Create list item views
        _(models).forEach(function (model, index, list) {
          var view = new config.Item({
            model: model
          }).render();

          // Ensure list element id (for aria's sake)
          view.$el.attr('id', model.cid);

          // Append item view el to DOM fragment
          $frag = $frag.add(view.$el);
        });

        // Show list
        $list
          .html($frag)
          .attr({
            'role': 'listbox',
            'id': this.model.cid
          })
          .insertAfter(this.$el);
        this.$el.attr(IS_EXPANDED);

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
      template: _.template('<ul />'),

      /**
       * Method used for matching models against search string
       */
      search: function (value, model, index, list) {
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

    return AsyncAutocomplete;
  }

  return define();
}));
