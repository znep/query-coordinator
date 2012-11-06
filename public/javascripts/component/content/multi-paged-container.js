;(function($) {

var DEFAULT_PAGE_SIZE = 5;

$.component.PagedContainer.extend('Multi-Paged Container', 'none', {//'content', {
    /* Actual children added to the container */
    children: function()
    { return this._contentChildren; },

    each: function(fn, scope)
    {
        var cObj = this;
        var result;
        _.any(cObj._contentChildren, function(c)
        {
            var r = fn.call(scope || cObj, c);
            if (r !== undefined)
            {
                result = r;
                return true;
            }
        });
        return result;
    },

    empty: function()
    {
        this._super.apply(this, arguments);
        this._contentChildren = [];
    },

    /* TODO: This currently ignores position, and is append-only. Do we ever care about any other case? */
    add: function(child)
    {
        if (child._parCont == this)
        { return this._super.apply(this, arguments); }

        this._contentChildren = this._contentChildren || [];
        this._contentChildren.push(child);

        var $existDom;
        if ($.isBlank(child.$dom) &&
                ($existDom = this.$contents.children('#' + child.id + ':visible')).length > 0)
        {
            child._carouselHidden = $existDom;
            $existDom.addClass('hide');
        }

        if (this._pages.length < Math.ceil(this._contentChildren.length /
                    (this._properties.pageSize || DEFAULT_PAGE_SIZE)))
        {
            this._super($.component.create(this._properties.container || {type: 'Container'},
                        this._componentSet));
        }
    },

    // TODO: figure out design mode for real container
//    design: function(designing)
//    {
//        this._super.apply(this, arguments);
//        // set _designSubsidiary on real container
//    },

    _showPage: function(page)
    {
        if (!page._initialized)
        {
            var i = _.indexOf(this._pages, page);
            var numItems = this._properties.pageSize || DEFAULT_PAGE_SIZE;
            var c = this._contentChildren.slice(i * numItems, (i + 1) * numItems);
            _.each(c, function(_c)
            {
                if (!$.isBlank(_c._carouselHidden))
                { _c._carouselHidden.removeClass('hide'); }
            });
            page.add(c);
        }
        this._super.apply(this, arguments);
    },

    // The Container can pass the real children in here; ignore them if they're
    // not our interim page containers
    _moveChildDom: function(child)
    {
        if (child._parCont != this) { return; }
        this._super.apply(this, arguments);
    }
});

})(jQuery);
