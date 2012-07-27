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

    _render: function()
    {
        if (!this._super.apply(this, arguments)) { return false; }

        if (!this._updateDataSource(null, renderUpdate))
        { this.$shareOpts.addClass('hide'); }
    },

    _propWrite: function(properties)
    {
        this._super.apply(this, arguments);

        this._updateDataSource(properties, renderUpdate);
    }
});

var renderUpdate = function()
{
    var cObj = this;

    if (!$.subKeyDefined(cObj, '_dataContext.dataset'))
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

    var ds = cObj._dataContext.dataset;
    cObj.$shareOpts.find('li[data-name=facebook] a').attr('href',
            'http://www.facebook.com/share.php?u=' + escape(ds.fullUrl));

    cObj.$shareOpts.find('li[data-name=twitter] a').attr('href',
            'http://twitter.com/?status=' + escape('Check out the ' + ds.name + ' dataset on ' +
            blist.configuration.strings.company + ': ' + ds.shortUrl));

    cObj.$shareOpts.find('li[data-name=subscribe], li[data-name=email]').find('a')
        .toggleClass('hide', !ds.isPublic() || !ds.isTabular());
};

})(jQuery);
