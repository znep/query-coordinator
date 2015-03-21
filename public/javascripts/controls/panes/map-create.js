(function($)
{
    // Change disabled message based on whether or not the add column dialog is
    // available
    $.Control.extend('pane_mapCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            if (cpObj._view.type == 'map'
                && !$.subKeyDefined(cpObj._view, 'displayFormat.viewDefinitions'))
            { Dataset.map.convertToVersion2(cpObj._view); }

            if ($.subKeyDefined(cpObj._view, 'displayFormat.bkgdLayers'))
            { cpObj._view.displayFormat.bkgdLayers = _.map(cpObj._view.displayFormat.bkgdLayers,
                function(layer) {
                    if (layer.layerKey) { return layer; }
                    else { layer.layerKey = layer.layerName; delete layer.layerName; return layer; }
                }); }

            var fullReset = function()
            {
                cpObj.childPanes = [];
                cpObj.reset();
            };
            cpObj._view.bind('clear_temporary', fullReset, cpObj);
            cpObj._view.bind('displayformat_change', fullReset, cpObj);

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

            cpObj.childPanes = [];
        },

        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.map.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.map.subtitle'); },

        _getCurrentData: function()
        { return this._super() || this._view; },

        _dataPreProcess: function(view)
        {
            var cleanView = view.cleanCopy();
            // In ESRI datasets, the base layer is not set automatically, which results in a
            // blank selection in the sidebar. We fill it in with the default base layer here.
            if (!cleanView.displayFormat.layers)
            { cleanView.displayFormat.layers = [{type:'tile', url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'}]; }
            return cleanView;
        },

        isAvailable: function()
        {
            return (this._view.valid || isEdit(this)) &&
                (_.include(this._view.metadata.availableDisplayTypes, 'map') ||
                !this._view.isAltView());
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid && !isEdit(this) ?
                $.t('screens.ds.grid_sidebar.base.validation.invalid_view') :
                $.t('screens.ds.grid_sidebar.map.validation.viz_limit');
        },

        _getSections: function()
        {
            return blist.configs.map.config({view: this._view,
                isEdit: isEdit(this), useOtherSidebars: true});
        },

        render: function()
        {
            var cpObj = this;
            cpObj._super();

            cpObj._childrenDirty = true;
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.apply, $.controlPane.buttons.cancel]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var view = $.extend(true, {metadata: {renderTypeConfig: {visible: {map: true}}}},
                cpObj._getFormValues(), {metadata: cpObj._view.metadata});

            _.each(cpObj.childPanes, function(cp)
            {
                var index = cp._index;
                view.displayFormat.viewDefinitions[index] = $.extend(true, {}, cp._finish());

                if ($.subKeyDefined(cp, '_view.displayFormat.heatmap.type')
                    && cp._view.displayFormat.heatmap.type == 'custom')
                {
                    view.displayFormat.viewDefinitions[index].heatmap.type = 'custom';
                    view.displayFormat.viewDefinitions[index].heatmap.cache_url
                        = cp._view.displayFormat.heatmap.cache_url;
                }
            });

            _.each(['viewport', 'compositeMembers', 'overrideWithLayerSet'], function(p)
            {
                if (!_.isUndefined(cpObj._view.displayFormat.viewport))
                { view.displayFormat[p] = cpObj._view.displayFormat[p]; }
            });

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

    $.Control.extend('pane_mapDataLayerCreate', {
        _init: function()
        {
            var cpObj = this;
            cpObj._super.apply(cpObj, arguments);
            cpObj._view.bind('clear_temporary', function() { cpObj.reset(); }, cpObj);
            cpObj._view.bind('displayformat_change', function() { cpObj.reset(); }, cpObj);
            cpObj._index = cpObj.settings.index;
            cpObj._uid = (cpObj.settings.parent._view.id == cpObj._view.id ? 'self' : cpObj._view.id);
            cpObj._origDF = cpObj._getCurrentData().displayFormat.viewDefinitions[cpObj._index];
        },

        _getSections: function()
        {
            var config = [];
            var baseConfig = { fields: blist.configs.map.dataLayer[this._dataType]({
                prefix: 'displayFormat.viewDefinitions.' + this._index + '.',
                view: this._view })
            };
            var title = this._view.name + (this._uid != 'self' ? '<br />(' + this._uid + ')' : '');

            if (this._dataType == 'socrata')
            {
                config.push({
                    title: $.t('screens.ds.grid_sidebar.map.layers.config', { name: title }),
                    fields: blist.configs.map.dataLayer.socrataBase({
                        prefix: 'displayFormat.viewDefinitions.' + this._index + '.',
                        view: this._view })
                });
                config.push({
                    title: $.t('screens.ds.grid_sidebar.map.layers.advanced', { name: title }),
                    name: this._view.id + '_details', type: 'selectable',
                    fields: blist.configs.map.dataLayer.socrata({
                        prefix: 'displayFormat.viewDefinitions.' + this._index + '.',
                        view: this._view })
                });
            }
            else
            {
                config.push({
                    title: $.t('screens.ds.grid_sidebar.map.layers.config', { name: title }),
                    fields: blist.configs.map.dataLayer[this._dataType]({
                        prefix: 'displayFormat.viewDefinitions.' + this._index + '.',
                        view: this._view })
                });
            }

            return config;
        },

        setView: function(view)
        {
            var cpObj = this;
            var oldView = cpObj._view;

            cpObj._super(view);

            if (!cpObj._getCurrentData().displayFormat.viewDefinitions)
            { cpObj._getCurrentData().displayFormat.viewDefinitions = []; }

            if (oldView && oldView.id == view.id)
            { cpObj._getCurrentData().displayFormat.viewDefinitions[cpObj._index] = cpObj._origDF; }
            else
            { cpObj._getCurrentData().displayFormat.viewDefinitions[cpObj._index] = {}; }

            if ($.subKeyDefined(cpObj._view.metadata, 'custom_fields.Basic.Source'))
            { cpObj._dataType = 'esri'; }
            else if ($.subKeyDefined(cpObj._view.metadata, 'geo'))
            { cpObj._dataType = 'mondara'; }
            else
            { cpObj._dataType = 'socrata'; }
            cpObj._uid = (cpObj.settings.parent._view.id == cpObj._view.id ? 'self' : cpObj._view.id);
        },

        setIndex: function(index)
        {
            this._index = index;
        },

        _finish: function()
        {
            var cpObj = this;

            var fv = cpObj._getFormValues();
            if ($.subKeyDefined(fv, 'displayFormat.viewDefinitions.0'))
            {
                fv = fv.displayFormat.viewDefinitions[0];
                if (cpObj._view) {
                    fv.plot.locationId = cpObj._view.columnForTCID(fv.plot.locationId).fieldName;
                }
            }
            else
            { fv = null; }

            return cpObj.settings.data.displayFormat.viewDefinitions[cpObj._index] = cpObj._origDF
                = $.extend(true, { uid: cpObj._uid }, fv);
        }
    }, {name: 'mapDataLayerCreate'}, 'controlPane');

})(jQuery);
