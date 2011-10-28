(function($)
{
    // Change disabled message based on whether or not the add column dialog is
    // available
    $.Control.extend('pane_mapCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);

            cpObj.$dom().delegate('.showConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                if ($.subKeyDefined(blist, 'datasetPage.sidebar'))
                { blist.datasetPage.sidebar.show('visualize.conditionalFormatting'); }
            });

            cpObj.$dom().delegate('.clearConditionalFormatting', 'click', function(e)
            {
                e.preventDefault();
                var metadata = $.extend(true, {}, cpObj._view.metadata);
                delete metadata.conditionalFormatting;
                cpObj._view.update({ metadata: metadata });
            });

            // Hook up clicks on the disabled message
            cpObj.$dom().delegate('.sectionDisabledMessage a', 'click', function(e)
            {
                e.preventDefault();
                if (!$.subKeyDefined(blist, 'datasetPage.sidebar')) { return; }

                var col = {dataTypeName: 'location', convert: {}};
                var doShow = false;
                switch ($.hashHref($(this).attr('href')))
                {
                    case 'convertLatLong':
                        // Makes the 'Use Existing' sections show expanded by
                        // default
                        col.convert.latitudeColumn = true;
                    case 'convertLoc':
                        col.convert.addressColumn = true;
                        break;
                    case 'showLoc':
                        doShow = true;
                        break;
                }

                // Listen for when they add a column, and then re-show this pane
                cpObj._view.once('columns_changed', function()
                {
                    // If they hit Cancel from 'Create column' then this
                    // function might trigger some time later.  Make sure that
                    // it is valid before we re-show it, at least
                    if (sectionOnlyIf.func.call(cpObj))
                    { _.defer(function() { cpObj.show(); }); }
                });

                if (doShow)
                { blist.datasetPage.sidebar.show('manage.showHide'); }
                else
                { blist.datasetPage.sidebar.show('edit.addColumn', col); }
            });

        },

        getTitle: function()
        { return 'Map'; },

        getSubtitle: function()
        { return 'Views with locations can be displayed as points on a map'; },

        _getCurrentData: function()
        { return this._super() || this._view; },

        isAvailable: function()
        {
            return (this._view.valid || isEdit(this)) &&
                (_.include(this._view.metadata.availableDisplayTypes, 'map') ||
                !this._view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ?
                'This view must be valid' :
                'A view may only have one visualization on it';
        },

        _getSections: function()
        {
            return blist.configs.map.config({view: this._view,
                isEdit: isEdit(this), useOtherSidebars: true});
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {map: true}}}},
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});

            if ($.subKeyDefined(cpObj, 'view.displayFormat.heatmap.type')
                && cpObj.view.displayFormat.heatmap.type == 'custom')
            {
                view.displayFormat.heatmap.type = 'custom';
                view.displayFormat.heatmap.cache_url = cpObj._view.displayFormat.heatmap.cache_url;
            }

            if (view.displayFormat.type == cpObj._view.displayFormat.type)
            { view.displayFormat.viewport = cpObj._view.displayFormat.viewport; }
            else if (cpObj._view.displayFormat.type == 'bing')
            {
                blist.datasetControls.showSaveViewDialog(!cpObj._view.isDefault() && isEdit(cpObj) ?
                    'reloadUpdateDialog' : 'reloadSaveDialog', null, null,
                    function()
                    {
                        cpObj._finishProcessing();
                        cpObj.reset();
                        if (_.isFunction(finalCallback)) { finalCallback(); }
                    }, view);
                return;
            }

            cpObj._view.update(view);

            var didCallback = false;
            if (!cpObj._view.isDefault() && isEdit(cpObj))
            {
                // We need to show all columns when editing a view so that
                // any filters/facets work properly
                var colIds = _.pluck(cpObj._view.realColumns, 'id');
                if (colIds.length > 0)
                {
                    cpObj._view.setVisibleColumns(colIds, finalCallback, true);
                    didCallback = true;
                }
            }

            cpObj._finishProcessing();
            cpObj.reset();
            if (!didCallback && _.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'mapCreate'}, 'controlPane');

    var isEdit = function(cpObj)
    { return _.include(cpObj._view.metadata.availableDisplayTypes, 'map'); };

    if ($.isBlank(blist.sidebarHidden.visualize) || !blist.sidebarHidden.visualize.mapCreate)
    { $.gridSidebar.registerConfig('visualize.mapCreate', 'pane_mapCreate', 2, 'map'); }

})(jQuery);
