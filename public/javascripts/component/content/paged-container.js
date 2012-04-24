;(function($) {

$.component.Container.extend('PagedContainer', {
    _init: function()
    {
        this._super.apply(this, arguments);
        this.registerEvent({page_shown: 'newPage', page_added: 'page', page_removed: 'page'});
    },

    visibleId: function(newId)
    {
        var newP;
        if (!$.isBlank(newId))
        { this.eachPage(function(p) { if (p.id == newId) { newP = p; } }); }
        return (this._visiblePage(newP) || {}).id;
    },

    visibleIndex: function(newIndex)
    {
        var p = this.pages();
        return _.indexOf(p, this._visiblePage(p[newIndex]))
    },

    viewNext: function(preventWrap)
    {
        var p = this.pages();
        var newI = _.indexOf(p, this._visiblePage()) + 1;
        if (preventWrap && newI >= p.length) { return; }
        return this._visiblePage(p[newI % p.length]);
    },

    viewPrevious: function(preventWrap)
    {
        var p = this.pages();
        var newI = _.indexOf(p, this._visiblePage()) - 1;
        if (preventWrap && newI < 0) { return; }
        return this._visiblePage(p[(newI + p.length) % p.length]);
    },

    pages: function()
    { return this.children.apply(this, arguments); },

    eachPage: function()
    { return this.each.apply(this, arguments); },

    mapPage: function()
    { return this.map.apply(this, arguments); },

    countPages: function()
    { return this.count.apply(this, arguments); },

    _visiblePage: function(newPage)
    {
        if (!$.isBlank(newPage) && newPage.parent == this && newPage != this._currentPage)
        {
            this._currentPage = newPage;
            this._arrange();
        }
        return this._currentPage;
    },

    _hidePage: function(page)
    {
        page.$dom.addClass('hide');
        page.$contents.trigger('hide');
    },

    _showPage: function(page, finalCallback)
    {
        page.properties({height: this._properties.height});
        if (!page._rendered) { page._render(); }
        page.$dom.removeClass('hide');
        this.trigger('page_shown', [{newPage: page}]);
        page.$contents.trigger('show');
        $.component.sizeRenderRefresh();
        if (_.isFunction(finalCallback)) { finalCallback(); }
    },

    _arrange: function()
    {
        var cObj = this;
        if ($.isBlank(cObj._currentPage) && $.subKeyDefined(cObj, 'first.$dom'))
        {
            cObj._currentPage = cObj.first;
            cObj._currentPage.$dom.addClass('hide');
        }

        var finalHide;
        cObj.eachPage(function(page)
            {
                if (page != cObj._currentPage && !$.isBlank(page.$dom))
                {
                    var callback = cObj._hidePage(page);
                    if ($.isBlank(finalHide)) { finalHide = callback; }
                    else if (_.isFunction(callback)) { callback(); }
                }
            });

        if (cObj._rendered)
        {
            if ($.subKeyDefined(cObj, '_currentPage.$dom') && cObj._currentPage.$dom.hasClass('hide'))
            { cObj._showPage(cObj._currentPage, finalHide); }
            else if (_.isFunction(finalHide)) { finalHide(); }
        }
        cObj._super();
    },

    _childRemoved: function(child)
    {
        this._super.apply(this, arguments);
        this.trigger('page_removed', [{page: child}]);
    },

    _moveChildDom: function(child)
    {
        if (!this._initialized)
        {
            if (child._initialized) { child.$dom.remove(); }
            return;
        }
        // Only init, don't do a full render until visible
        if (!child._initialized) { child._initDom(); }
        if ($.subKeyDefined(child, 'next.$dom') && child.next.$dom.parent().index(this.$ct) >= 0)
        { child.next.$dom.before(child.$dom); }
        else if (!$.isBlank(this.$ct))
        {
            this.$ct.append(child.$dom);
            this.trigger('page_added', [{page: child}]);
        }
        this._arrange();
    }
});

})(jQuery);
