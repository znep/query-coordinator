;(function($) {

$.component.Container.extend('PagedContainer', {
    _init: function()
    {
        this._pages = [];
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
    { return this._pages; },

    countPages: function()
    { return this._pages.length; },

    eachPage: function(fn, scope)
    {
        var cObj = this;
        var result;
        _.any(cObj._pages, function(p)
        {
            var r = fn.call(scope || cObj, p);
            if (r !== undefined)
            {
                result = r;
                return true;
            }
        });
        return result;
    },

    mapPage: function(fn, scope)
    {
        var result = [];
        this.eachPage(function(page)
        { result.push(fn.call(scope, page)); });
        return result;
    },

    add: function(child, position, forceAdd)
    {
        var cObj = this;
        var r;
        if (forceAdd)
        { r = this._super(child); }

        if (_.isArray(child))
        {
            _.each(child, function(c) { cObj.add(c); });
            return r;
        }

        if (child._parCont == this) { return r; }

        if (!(child instanceof $.component.Component))
        {
            if ($.isBlank(child.contextId) && $.isBlank(child.context))
            { child.contextId = this._properties.childContextId || this._properties.contextId; }
            child = $.component.create(child);
        }

        // We want to initialize any functional components, but they go into their own store
        // and not into the DOM
        if (child instanceof $.component.FunctionalComponent)
        { return null; }

        child._parCont = this;
        this._pages.push(child);
        return r;
    },

    _visiblePage: function(newPage)
    {
        if (!$.isBlank(newPage) && newPage != this._currentPage)
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
        if (!page._initialized)
        { this.add(page, null, true); }
        page.properties({height: this._properties.height, hidden: false});
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
        if ($.isBlank(cObj._currentPage) && !_.isEmpty(cObj._pages))
        {
            if ($.subKeyDefined(cObj, '_properties.defaultPage'))
            {
                var defPage = cObj._stringSubstitute(cObj._properties.defaultPage);
                cObj._currentPage = _.detect(cObj._pages, function(p) { return p.id == defPage; });
                // Maybe it is a page number?
                if ($.isBlank(cObj._currentPage))
                {
                    var pageNum = parseInt(defPage);
                    if (_.isNumber(pageNum) && pageNum < cObj._pages.length && pageNum >= 0)
                    { cObj._currentPage = cObj._pages[pageNum]; }
                }
            }
            if ($.isBlank(cObj._currentPage))
            { cObj._currentPage = _.first(cObj._pages); }
            if ($.subKeyDefined(cObj, '_currentPage.$dom'))
            { cObj._currentPage.$dom.addClass('hide'); }
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
            if (!$.isBlank(cObj._currentPage) &&
                    ($.isBlank(cObj._currentPage.$dom) || cObj._currentPage.$dom.hasClass('hide')))
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
    }
});

})(jQuery);
