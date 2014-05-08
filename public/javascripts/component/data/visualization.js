;(function() {

$.component.Component.extend('Visualization', 'data', {
    _init: function()
    {
        this._needsOwnContext = true;
        this._delayUntilVisible = true;
        this._noTransactionForUndo = true;
        this._super.apply(this, arguments);
    },

    isValid: function()
    {
        return this._dataContext;
    },

    configurationSchema: function()
    {
        return {
            schema: [
                { fields: [$.cf.contextPicker()] },
                { fields: [
                    { name: 'exploreLink', text: $.t('dataslate.component.visualization.exploreLink_prompt'), type: 'checkbox' }
                ] }],
            view: this._dataset};
    },

    _getAssets: function()
    {
        return {
            javascripts: [ { assets: 'shared-visualization' } ],
            translations: [ 'dataslate.component.visualization' ]
        };
    },

    _render: function()
    {
        var lcObj = this;
        if (!_.isNumber(lcObj._properties.height))
        { lcObj._properties.height = 300; }
        if (!lcObj._super.apply(lcObj, arguments)) { return false; }

        updateProperties(lcObj, lcObj._properties);
        return true;
    },

    _propWrite: function(properties)
    {
        var lcObj = this;
        lcObj._super.apply(lcObj, arguments);

        if (lcObj._rendered)
        { updateProperties(lcObj, properties); }
    },

    design: function()
    {
        this._super.apply(this, arguments);
        if ($.isBlank(this.$editOverlay))
        {
            this.$editOverlay = $.tag2({ _: 'div', className: 'editOverlay' });
            this.$dom.append(this.$editOverlay);
        }
        this.$editOverlay.toggleClass('hide', !this._designing);
    }
});

var updateProperties = function(lcObj)
{
    var renderViz = function()
    {
        if (lcObj.$contents.data('renderTypeManager'))
        {
            var rtm = lcObj.$contents.data('renderTypeManager');
            rtm.hide(_.keys(rtm.settings.defaultTypes)[0]);
            lcObj.$contents.removeData('renderTypeManager');
            lcObj.$contents.empty();
        }

        var ds = (lcObj._dataContext || {}).dataset;

        if ($.isBlank(ds)) { return; }
        var visibleTypes = _.keys(ds.metadata.renderTypeConfig.visible),
            defaultTypes = {};

        // Attempt to reduce it down to a primary view.
        var type = _.detect(visibleTypes, function(vt) { return vt != 'table'; });
        type = type || 'table'; // Last ditch, even though 'table' doesn't work anyways.
        defaultTypes[type] = true;

        if (!lcObj._$container)
        { lcObj.$contents.prepend(lcObj._$container = $('<div />')); }

        if (lcObj._properties.exploreLink)
        {
            if (!lcObj._$exploreLink)
            { lcObj.$contents.append( lcObj._$exploreLink = $.tag2({
                _: 'div', className: 'exploreLink', contents: [
                    { _: 'a', className: 'ss-navigateright', href: ds.url,
                        contents: _.isString(lcObj._properties.exploreLink)
                            ? lcObj._properties.exploreLink
                            : $.t('dataslate.component.visualization.exploreLink') }
            ]})); }
            else
            { lcObj._$exploreLink.show().find('a').attr('href', ds.url); }

            lcObj._$container.height(lcObj._properties.height - lcObj._$exploreLink.outerHeight());
        }
        else if (lcObj._$exploreLink)
        { lcObj._$exploreLink.hide(); }

        lcObj._rtm = lcObj._$container.renderTypeManager({
            defaultTypes: defaultTypes,
            view: ds,
            width: lcObj._properties.width,
            height: lcObj._properties.height,
            map: { interactToScroll: true }
        });

    };

    if (!lcObj._updateDataSource(null, renderViz)) { renderViz(); };
};

})(jQuery);
