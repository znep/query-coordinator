;(function($) {

var DEFAULT_PAGE_SIZE = 5;

$.component.PagedContainer.extend('MultiPagedContainer', {
    _init: function()
    {
        this._pages = [];
        this._super.apply(this, arguments);
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
            var r = fn.call(scope || this, p);
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

    /* Actual children added to the container */
    children: function()
    { return this.map(function(child) { return child }); },

    count: function()
    {
        var count = 0;
        this.each(function() { count++; });
        return count;
    },

    each: function(fn, scope)
    {
        var cObj = this;
        return cObj.eachPage(function(p)
        {
            var result = p.each(fn, scope || cObj);
            if (result !== undefined) { return result; }
        });
    },

    map: function(fn, scope)
    {
        var result = [];
        this.each(function(child)
        { result.push(fn.call(scope, child)); });
        return result;
    },

    /* TODO: This currently ignores position, and is append-only. Do we ever care about any other case? */
    add: function(child)
    {
        if (child._parMPC == this)
        { return this._super(child); }

        if (_.isEmpty(this._pages) ||
                _.last(this._pages).count() >= (this._properties.pageSize || DEFAULT_PAGE_SIZE))
        {
            var newC = $.component.create(this._properties.container || {type: 'Container'});
            newC._parMPC = this;
            this._pages.push(newC);
            this.add(newC);
        }

        _.last(this._pages).add(child);
    },

    // The Container can pass the real children in here; ignore them if they're
    // not our interim page containers
    _moveChildDom: function(child)
    {
        if (child._parMPC != this) { return; }
        this._super.apply(this, arguments);
    },

    // Override render to render to handle pages, instead of real children
    _render: function()
    {
        if (!this._super()) { return false; }

        this.eachPage(this._moveChildDom, this);

        return true;
    }

});

})(jQuery);
