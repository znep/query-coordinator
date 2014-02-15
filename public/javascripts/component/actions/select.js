;(function($) {

// Configuration keys:
// -------------------
// type: 'Select'
// contextId: 'some_context_id'
// rowFields: { value: 'some_dataset_column_name', label: 'some_other_dataset_column_name' }
// placeholderValue: { value: 'EmptySelection', label: 'Please make a selection' }
// currentValue: 'Value of currently selected item'
// currentIndex: index_of_currently_selected_item
// options: [{value:"ARSON",label:"ARSON"}, {value:"ASSAULT",label:"ASSAULT"}, ...]
// rowStart: 0    # defaults to 0, no effect when options collection specified
// rowLength: 30  # defaults to 10, no effect when options collection specified

$.component.Component.extend('Select', 'actions', {
    _init: function()
    {
        this._super.apply(this, arguments);
        this.registerEvent({change: ['selected', 'dataContext']});
    },

    _initDom: function()
    {
        var cObj = this;
        cObj._super.apply(cObj, arguments);
        if ($.isBlank(cObj.$select))
        {
            cObj.$select = cObj.$contents.children('select');
            if (cObj.$select.length < 1)
            {
                cObj.$select = $.tag({tagName: 'select'});
                cObj.$contents.append(cObj.$select);
            }
            if ($.isPresent($.uniform)) { cObj.$select.uniform(); }

            cObj.$select.off('.compSelect');
            cObj.$select.on('change.compSelect', function(e)
            {
                // TODO Support multiple selection
                var selectedOption = cObj.$select.find('option:selected')
                cObj.trigger('change', [{dataContext: cObj._dataContext,
                    selected: {
                      index: selectedOption.index(),
                      value: selectedOption.val(),
                      label: selectedOption.text()
                    }}]);
            });
        }
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        if (!cObj._updateDataSource(cObj._properties, function() { doRender(cObj); }))
        { doRender(cObj); }
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);
        if (!_.isEmpty(properties)) { this._render(); }
    },

    // Monitor for query_change events in order to re-render
    _bindQueryChangeListener: function() {
        var cObj = this;

        if (cObj._dataContext && cObj._dataContext.type == 'dataset') {
          var dataset = cObj._dataContext.dataset;
          if (cObj._currentDataset != dataset) {
            if ($.isPresent(cObj._currentDataset)) {
              cObj._currentDataset.unbind(null, null, cObj);
            }
            dataset.bind('query_change', function() { doRender(cObj); }, cObj);
            cObj._currentDataset = dataset;
          }
        }
    },

    // NOOP in order to get _init to call _updateDataSource (which calls _addDataContext)
    _dataReady: function() {},

    _addDataContext: function(dc)
    {
        this._super.apply(this, arguments);

        this._bindQueryChangeListener();

        // TODO Reimplement this event dispatch as not-a-hack
        this.$select.trigger('change.compSelect');
    }

});

var doRender = function(cObj)
{
    cObj.$select.empty();

    var postRender = function() {
      if ($.isPresent($.uniform)) { $.uniform.update(cObj.$select); }

      // Disabled state
      cObj.$select.attr('disabled', cObj._properties.disabled);
    };

    var setCurrentSelection = function(optionTag, value, index) {
      // Default selection by value
      var currentValue = cObj._stringSubstitute(cObj._properties.currentValue);

      if (value == currentValue) {
        optionTag.attr('selected', true);
      }

      // Default selection by index
      var currentIndex = cObj._stringSubstitute(cObj._properties.currentIndex);

      if (index == currentIndex) {
        optionTag.attr('selected', true);
      }
    }

    var setPlaceholderValue = function() {
      var placeholderValue = cObj._properties.placeholderValue;

      if (placeholderValue) {
        cObj.$select.prepend($.tag({
          tagName: 'option',
          value: cObj._stringSubstitute(placeholderValue.value),
          contents: cObj._stringSubstitute(placeholderValue.label)
        }));
      }
    }

    var options = $.makeArray(cObj._stringSubstitute(cObj._properties.options || []));

    if (_.isEmpty(options) && $.isPresent(cObj._properties.rowFields) &&
            $.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        var view = cObj._dataContext.dataset;
        var rowValueField = cObj._stringSubstitute(cObj._properties.rowFields.value);
        var rowLabelField = cObj._stringSubstitute(cObj._properties.rowFields.label);
        var start = cObj._stringSubstitute(cObj._properties.rowStart || 0);
        var length = cObj._stringSubstitute(cObj._properties.rowLength || 10);

        view.getRows(start, length, function(rows)
        {
            setPlaceholderValue();

            _.each(rows, function(row, index)
            {
                var soda2Row = view.rowToSODA2(row);
                var optionTag = $.tag({
                  tagName: 'option',
                  value: soda2Row[rowValueField],
                  contents: soda2Row[rowLabelField || rowValueField]
                });

                setCurrentSelection(optionTag, soda2Row[rowValueField], index)

                cObj.$select.append(optionTag);
            });

            postRender();
        });
    }
    else
    {
        setPlaceholderValue();

        _.each(options, function(option, index)
        {
            var optionTag = $.tag({
              tagName: 'option',
              value: option.value,
              contents: option.label
            });

            setCurrentSelection(optionTag, option.value, index)

            cObj.$select.append(optionTag);
        });

        postRender();
    }
};

})(jQuery);
