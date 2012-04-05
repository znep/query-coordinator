;(function($) {

$.component.Container.extend('PagedContainer', {
    _init: function()
    {
        this._super.apply(this, arguments);
        this.registerEvent({child_shown: 'newChild', child_added: 'child', child_removed: 'child'});
    },

    visibleChild: function(newChild)
    {
        if (!$.isBlank(newChild) && newChild.parent == this && newChild != this._currentChild)
        {
            this._currentChild = newChild;
            this._arrange();
        }
        return this._currentChild;
    },

    visibleId: function(newId)
    {
        var newC;
        if (!$.isBlank(newId))
        { this.each(function(c) { if (c.id == newId) { newC = c; } }); }
        return (this.visibleChild(newC) || {}).id;
    },

    visibleIndex: function(newIndex)
    {
        var c = this.children();
        return _.indexOf(c, this.visibleChild(c[newIndex]))
    },

    viewNext: function(preventWrap)
    {
        var c = this.children();
        var newI = _.indexOf(c, this.visibleChild()) + 1;
        if (preventWrap && newI >= c.length) { return; }
        return this.visibleChild(c[newI % c.length]);
    },

    viewPrevious: function(preventWrap)
    {
        var c = this.children();
        var newI = _.indexOf(c, this.visibleChild()) - 1;
        if (preventWrap && newI < 0) { return; }
        return this.visibleChild(c[(newI + c.length) % c.length]);
    },

    _hideChild: function(child)
    {
        child.$dom.addClass('hide');
        child.$contents.trigger('hide');
    },

    _showChild: function(child, finalCallback)
    {
        child.properties({height: this._properties.height});
        if (!child._rendered) { child._render(); }
        child.$dom.removeClass('hide');
        this.trigger('child_shown', [{newChild: child}]);
        child.$contents.trigger('show');
        $.component.sizeRenderRefresh();
        if (_.isFunction(finalCallback)) { finalCallback(); }
    },

    _arrange: function()
    {
        var cObj = this;
        if ($.isBlank(cObj._currentChild) && $.subKeyDefined(cObj, 'first.$dom'))
        {
            cObj._currentChild = cObj.first;
            cObj._currentChild.$dom.addClass('hide');
        }

        var finalHide;
        cObj.each(function(child)
            {
                if (child != cObj._currentChild && !$.isBlank(child.$dom))
                {
                    var callback = cObj._hideChild(child);
                    if ($.isBlank(finalHide)) { finalHide = callback; }
                    else if (_.isFunction(callback)) { callback(); }
                }
            });

        if (cObj._rendered)
        {
            if ($.subKeyDefined(cObj, '_currentChild.$dom') && cObj._currentChild.$dom.hasClass('hide'))
            { cObj._showChild(cObj._currentChild, finalHide); }
            else if (_.isFunction(finalHide)) { finalHide(); }
        }
        cObj._super();
    },

    _childRemoved: function(child)
    {
        this._super.apply(this, arguments);
        this.trigger('child_removed', [{child: child}]);
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
            this.trigger('child_added', [{child: child}]);
        }
        this._arrange();
    }
});

})(jQuery);
