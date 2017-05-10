(function($) {

$.component.Component.extend('Button', 'actions', {
  _init: function() {
    this._super.apply(this, arguments);
    this.registerEvent({click: ['state', 'dataContext']});
  },

  _initDom: function() {
    var cObj = this;

    cObj._super.apply(cObj, arguments);

    if ($.isBlank(cObj.$link)) {
      cObj.$link = cObj.$contents.children('a');

      if (cObj.$link.length < 1) {
        cObj.$link = $.tag({tagName: 'a'});
        cObj.$contents.append(cObj.$link);
      }

      cObj.$link.off('.compButton');
      cObj.$link.on('click.compButton', function(e) {
        if (cObj.$link.attr('href').indexOf('#') > -1) {
          e.preventDefault();
        }

        toggleState(cObj);
        cObj.trigger('click', [{dataContext: cObj._dataContext, state: cObj._state}]);
      });

      if (!cObj._updateDataSource(cObj._properties, function() { setUpStates(cObj); })) {
        setUpStates(cObj);
      }
    }
  },

  _render: function() {
    var cObj = this;

    if (!cObj._super.apply(cObj, arguments)) {
      return false;
    }

    if (!cObj._updateDataSource(cObj._properties, function() { doRender(cObj); })) {
      doRender(cObj);
    }
  },

  _propWrite: function(properties) {
    this._super.apply(this, arguments);

    if (!_.isEmpty(properties)) {
      this._render();
    }
  }
});

var setUpStates = function(cObj) {
  cObj._availStates = $.makeArray(cObj._stringSubstitute(cObj._properties.states || 'state0'));

  if (!_.include(cObj._availStates, cObj._state)) {
    if (!$.isBlank(cObj._state) && !$.isBlank(cObj.$link)) {
      cObj.$link.removeClass(cObj._state);
    }

    cObj._state = _.first(cObj._availStates);

    if (!$.isBlank(cObj.$link)) {
      cObj.$link.addClass(cObj._state);
    }
  }
};

var doRender = function(cObj) {
  setUpStates(cObj);

  cObj.$link.text(cObj._stringSubstitute(getItem(cObj, 'text')));
  cObj.$link.attr('title', cObj._stringSubstitute(getItem(cObj, 'title')));
  cObj.$link.attr('href', cObj._stringSubstitute(getItem(cObj, 'href')) || '#');
  cObj.$link.attr('rel', cObj._properties.external ? 'external' : '');
  cObj.$link.toggleClass('button', !cObj._properties.notButton);
};

var getItem = function(cObj, key) {
  var item = cObj._properties[key];

  if ($.isPlainObject(item)) {
    item = item[cObj._state];
  }

  return item;
};

var toggleState = function(cObj) {
  if (!$.isBlank(cObj._state)) {
    cObj.$link.removeClass(cObj._state);
  }

  cObj._state = cObj._availStates[(_.indexOf(cObj._availStates, cObj._state) + 1) % cObj._availStates.length];
  cObj.$link.addClass(cObj._state);

  cObj.$link.html(cObj._stringSubstitute(getItem(cObj, 'text')));
  cObj.$link.attr('title', cObj._stringSubstitute(getItem(cObj, 'title')));
  cObj.$link.attr('href', cObj._stringSubstitute(getItem(cObj, 'href')) || '#');
};

})(jQuery);
