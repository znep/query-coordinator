$.component.Component.extend('Menu', 'none', {
  _needsOwnContext: true,

  _render: function() {
    if (!this._super.apply(this, arguments)) {
      return false;
    }

    var cObj = this;
    var doRender = function() {
      var createMenu = function(menuOpts) {
        cObj.$contents.addClass('menu').menu(menuOpts);
      };

      var opts = {};
      _.each(['Class', 'Contents', 'Title'], function(v) {
        if (!$.isBlank(cObj._properties['button' + v])) {
          opts['menuButton' + v] =
          cObj._stringSubstitute(cObj._properties['button' + v]);
        }
      });

      if (_.isArray(cObj._properties.contents)) {
        opts.contents = cObj._stringSubstitute(cObj._properties.contents);
        createMenu(opts);
      } else if ($.isPlainObject(cObj._properties.contents) && !$.isBlank(cObj._dataContext)) {
        opts.contents = [];
        switch (cObj._dataContext.type) {
          case 'dataset':
            var start = cObj._stringSubstitute(cObj._properties.rowStart || 0);
            var length = cObj._stringSubstitute(cObj._properties.rowLength || 100);
            cObj._dataContext.dataset.getRows(start, length, function(rows) {
              var columnMap = this.columnMap = {};
              _.each(cObj._dataContext.dataset.visibleColumns, function(c) {
                columnMap[c.id] = c.fieldName;
              });
              _.each(rows, function(r) {
                var entity = {};
                _.each(columnMap, function(to, from) {
                  entity[to] = r[from];
                  if (entity[to] == undefined) {
                    entity[to] = null;
                  }
                });
                opts.contents.push(cObj._stringSubstitute(cObj._properties.contents, entity));
              });
              createMenu(opts);
            });
            break;
        }
      }
    };

    if (!cObj._updateDataSource(cObj._properties, doRender)) {
      doRender();
    }

    return true;
  },

  _propWrite: function(properties) {
    this._super(properties);
    if (!_.isEmpty(properties)) {
      this._render();
    }
  }
});
