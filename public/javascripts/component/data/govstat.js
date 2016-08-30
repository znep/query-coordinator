;(function($) {

// (For all GovStat controls)
// Optional:
// * attributes
// * constructorOpts
$.component.Component.extend('GovStat', 'none', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return { javascripts: ['/asset/js/socket.io', '/asset/js/client-bridge'] };
    },

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        if (!cObj._updateDataSource(cObj._properties, cObj._gsRender))
        { cObj._gsRender(); }
    },

    _gsRender: function()
    { /* implement me */ },

    _gsLoad: function(objReq, opts)
    {
        var cObj = this;
        var app = blist.require('app');
        app.set('locale', blist.locale);
        objReq.map(function(result)
        {
            if (result instanceof blist.require('janus').store.Request.state.type.Success)
            {
                cObj.$contents.empty();
                var obj = result.result;
                var view = app.getView(obj,
                    $.extend({ attributes: cObj._stringSubstitute(cObj._properties.attributes),
                        constructorOpts: cObj._stringSubstitute(cObj._properties.constructorOpts) },
                        opts)
                );
                if (!$.isBlank(view))
                { cObj.$contents.append(view.artifact()); }
            }
            else if (result instanceof blist.require('janus').store.Request.state.type.Error)
            { cObj.$contents.empty(); }
        });
        app.getStore(objReq).handle();
    },

    _propWrite: function(properties)
    {
        var cObj = this;
        cObj._super(properties);
        if (!_.isEmpty(properties))
        { cObj._render(); }
    }
});

// Required:
// * goalId
// Optional:
// * viewType ('card' or 'detail'; defaults to 'card')
// * 'detail' needs attributes to tell it what section to render
$.component.GovStat.extend('GovStat Goal', 'none', {
    _gsRender: function()
    {
        var cObj = this;
        var goalRequest = new (blist.require('govstat').models.goal.request.
            Fetch)({ goalId: cObj._stringSubstitute(cObj._properties.goalId) });
        var context = cObj._stringSubstitute(cObj._properties.viewType);
        if (context != 'card' && context != 'detail')
        { context = 'card'; }
        cObj._gsLoad(goalRequest, { context: context });
    }
});

// Required:
// * dashboardId
$.component.GovStat.extend('GovStat Dashboard', 'none', {
    _gsRender: function()
    {
        var cObj = this;
        var dbReq = new (blist.require('govstat').models.dashboard.request.
            Fetch)({ dashboardId: cObj._stringSubstitute(cObj._properties.dashboardId) });
        cObj._gsLoad(dbReq, { context: 'default' });
    },
    _getAssets: function()
    {
        var mainJs = this._super().javascripts;
        return { javascripts: mainJs.concat([{ assets: 'sanitize-html' }, { assets: 'autolink-html' }, { assets: 'markdown-render' }]) };
    }

});

// Required:
// * dashboardId
// * categoryId
$.component.GovStat.extend('GovStat Category', 'none', {
    _gsRender: function()
    {
        var cObj = this;
        var catReq = new (blist.require('govstat').models.category.request.
            Fetch)({ dashboardId: cObj._stringSubstitute(cObj._properties.dashboardId),
            categoryId: cObj._stringSubstitute(cObj._properties.categoryId) });
        cObj._gsLoad(catReq, { context: 'default' });
    }
});

})(jQuery);
