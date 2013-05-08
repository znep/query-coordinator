;(function($) {

$.component.Component.extend('Share', 'actions', {
    _needsOwnContext: true,

    _initDom: function()
    {
        this._super.apply(this, arguments);

        if (!$.isBlank(this.$shareOpts))
        { return; }

        this.$shareOpts = this.$contents.children('ul');
        if (this.$shareOpts.length < 1)
        {
            this.$shareOpts = $.tag({ tagName: 'ul', 'class': 'hide', contents: [
                { tagName: 'li', 'class': 'subscribe', 'data-name': 'subscribe', contents: [
                    { tagName: 'a', 'class': 'subscribe', href: '#subscribe',
                        title: 'Subscribe via Email or RSS',
                        contents: [ { tagName: 'span', 'class': 'icon', contents: 'Subscribe to Changes' } ]
                    }
                ] },
                { tagName: 'li', 'class': 'facebook', 'data-name': 'facebook', contents: [
                    { tagName: 'a', 'class': 'facebook', rel: 'external', title: 'Share on Facebook',
                        contents: [ { tagName: 'span', 'class': 'icon', contents: 'Share on Facebook' } ]
                    }
                ] },
                { tagName: 'li', 'class': 'twitter', 'data-name': 'twitter', contents: [
                    { tagName: 'a', 'class': 'twitter', rel: 'external', title: 'Share on Twitter',
                        contents: [ { tagName: 'span', 'class': 'icon', contents: 'Share on Twitter' } ]
                    }
                ] },
                { tagName: 'li', 'class': 'email', 'data-name': 'email', contents: [
                    { tagName: 'a', 'class': 'email', href: '#email', title: 'Share via Email',
                        contents: [ { tagName: 'span', 'class': 'icon', contents: 'Share via Email' } ]
                    }
                ] }
            ] });
            this.$contents.append(this.$shareOpts);
        }

        // Hook up dialogs
        var cObj = this;
        cObj.$shareOpts.find('li[data-name=email] a').click(function(e)
        {
            if (cObj._properties.currentPage) { return; }
            e.preventDefault();
            if (!$.subKeyDefined(cObj, '_dataContext.dataset')) { return; }
            if(_.isFunction(blist.dialog.sharing))
            { blist.dialog.sharing(null, null, cObj._dataContext.dataset); }
        });

        cObj.$shareOpts.find('li[data-name=subscribe] a').click(function(e)
        {
            e.preventDefault();
            if (!$.subKeyDefined(cObj, '_dataContext.dataset')) { return; }
            if(_.isFunction(blist.dialog.subscribe))
            { blist.dialog.subscribe(cObj._dataContext.dataset); }
        });
    },

    _getAssets: function()
    {
        return {
            javascripts: [{assets: 'awesomecomplete'}, {assets: 'share-dialogs'}],
            stylesheets: [{assets: 'share'}],
            modals: ['email_dataset', 'subscribe_dataset']
        };
    },

    configurationSchema: function()
    {
        return { schema: [{ name: 'shareComponent_type', fields: [
         { type: 'radioGroup', defaultValue: 'currentPage', name: 'shareType', text: 'Share',
                options: [ { name: 'currentPage', type: 'static', value: 'This page', isInput: true },
                $.cf.contextPicker() ] }
            ] }], view: this._dataset };
    },

    edit: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }
        // Default to sharing page
        if ($.isBlank(this._properties.contextId) && $.isBlank(this._properties.currentPage))
        { this._executePropertyUpdate({ currentPage: true }); }
        return true;
    },

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(null, renderUpdate))
        { renderUpdate.apply(this); }
    },

    _propWrite: function(properties)
    {
        // Config sidebar sets currentPage to 'This page'; so fix it
        if (!_.isBoolean(properties.currentPage) && !$.isBlank(properties.currentPage))
        { properties.currentPage = true; }

        this._super.apply(this, arguments);

        if (!this._updateDataSource(properties, renderUpdate))
        { renderUpdate.apply(this); }
    }
});

var renderUpdate = function()
{
    var cObj = this;

    if ($.isBlank(cObj.$shareOpts)) { return; }

    if (!cObj._properties.currentPage && !$.subKeyDefined(cObj, '_dataContext.dataset'))
    {
        cObj.$shareOpts.addClass('hide');
        return;
    }

    cObj.$shareOpts.removeClass('hide');

    if ($.subKeyDefined(cObj._properties, 'visibleItems'))
    {
        var visItems = $.makeArray(cObj._properties.visibleItems);
        cObj.$shareOpts.children('li').addClass('hide');
        _.each(visItems, function(name)
        {
            cObj.$shareOpts.append(cObj.$shareOpts.find('li[data-name=' + name + ']').removeClass('hide'));
        });
    }
    else
    {
        var hiddenItems = $.makeArray(cObj._properties.hiddenItems);
        cObj.$shareOpts.children('li').quickEach(function()
        { this.toggleClass('hide', _.include(hiddenItems, this.attr('data-name'))); });
    }

    if (cObj._properties.currentPage)
    {
        var pageUrl = window.location;
        var pageName = $.stringSubstitute(blist.configuration.page.name, $.component.rootPropertyResolver);
        cObj.$shareOpts.find('li[data-name=facebook] a').attr('href',
                'http://www.facebook.com/share.php?u=' + escape(pageUrl));

        cObj.$shareOpts.find('li[data-name=twitter] a').attr('href',
                'http://twitter.com/?status=' + escape('Check out ' + pageName + ' on ' +
            blist.configuration.strings.company + ': ' + pageUrl));

        cObj.$shareOpts.find('li[data-name=subscribe]').addClass('hide');

        cObj.$shareOpts.find('li[data-name=email]').find('a').attr('href', 'mailto:?subject=' +
                escape(pageName + ' on ' + blist.configuration.strings.company) + '&body=' +
                escape(pageUrl));
    }
    else
    {
        var ds = cObj._dataContext.dataset;
        cObj.$shareOpts.find('li[data-name=facebook] a').attr('href',
                'http://www.facebook.com/share.php?u=' + escape(ds.fullUrl));

        cObj.$shareOpts.find('li[data-name=twitter] a').attr('href',
                'http://twitter.com/?status=' + escape('Check out the ' + ds.name + ' dataset on ' +
            blist.configuration.strings.company + ': ' + ds.shortUrl));

        cObj.$shareOpts.find('li[data-name=email]').find('a').attr('href', '#email');
        cObj.$shareOpts.find('li[data-name=subscribe], li[data-name=email]').find('a')
            .toggleClass('hide', !ds.isPublic() || !ds.isTabular());
    }
};

})(jQuery);
