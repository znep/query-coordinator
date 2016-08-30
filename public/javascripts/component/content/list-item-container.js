;(function($) {

$.component.Container.extend('List Item Container', 'none', {//'content', {
    _itemClass: 'liWrapper',

    _getContainer: function()
    {
        if ($.isBlank(this.$ct))
        {
            var tag = getListTag(this);
            this.$ct = this.$contents.children(tag);
            if (this.$ct.length != 1)
            {
                this.$ct = $.tag({ tagName: tag, 'class':
                    this._stringSubstitute(this._properties.listCustomClass) });
                this.$contents.append(this.$ct);
            }
        }
        return this.$ct;
    },

    _moveChildDom: function(child)
    {
        if (!child._initialized)
        {
            child._initDom();
            if (this._designing) { child.design(true); }
        }

        if (!child.$wrapper)
        {
            var itemTag = getItemTag(this, child);
            var $w = child.$dom.parent(itemTag);
            if ($w.length < 1)
            {
                child.$wrapper = $.tag({ tagName: itemTag, 'class': this._itemClass });
                child.$wrapper.append(child.$dom);
            }
            else
            { child.$wrapper = $w; }
        }

        if ($.subKeyDefined(child, 'next.$wrapper') &&
                child.next.$wrapper.parent().index(this.$ct) >= 0)
        { child.next.$wrapper.parent()[0].insertBefore(child.$wrapper[0], child.next.$wrapper[0]); }
        else if (!$.isBlank(this.$ct))
        { this.$ct[0].appendChild(child.$wrapper[0]); }
        if (child.$wrapper.parent().length > 0 && this._rendered && !child._rendered)
        { child._render(); }

        this._arrange();
    },

    _removeChildDom: function(child)
    {
        if (child.$wrapper)
        {
            child.$wrapper.detach();
            delete child.$wrapper;
        }
        this._arrange();
    },

    _arrange: function()
    {
        var cObj = this;
        if (cObj._blockArrange) { return; }

        cObj.each(function(child)
        {
            if ($.isBlank(child.$wrapper)) { return; }

            var itemTag = getItemTag(cObj, child);
            if (itemTag != child.$wrapper.tagName())
            {
                var $oldW = child.$wrapper;
                child.$wrapper = $.tag({ tagName: itemTag });
                child.$wrapper.append(child.$dom);
                cObj.$ct.append(child.$wrapper);
                $oldW.remove();
            }

            child.$wrapper.removeClass();
            child.$wrapper.addClass(cObj._itemClass);
            if ($.subKeyDefined(cObj._properties, 'itemCustomClass'))
            { child.$wrapper.addClass(child._stringSubstitute(this._properties.itemCustomClass)); }
        });

        cObj._super();
    },

    _propWrite: function(properties)
    {
        var $oldCt;
        if (properties.listTag != this._properties.listTag)
        {
            $oldCt = this.$ct;
            this.$ct.detach();
            delete this.$ct;
            this._initialized = false;
        }
        else if (properties.listCustomClass != this._properties.listCustomClass)
        { this.$ct.removeClass(this._stringSubstitute(this._properties.listCustomClass)); }

        this._super.apply(this, arguments);

        if (!$.isBlank($oldCt))
        {
            this._initDom();
            this.$ct.append($oldCt.children());
        }
        else
        { this.$ct.addClass(this._stringSubstitute(this._properties.listCustomClass)); }

        this._arrange();
    }
});

var getItemTag = function(cObj, child)
{
    return child._stringSubstitute(cObj._properties.itemTag) ||
            { ul: 'li', ol: 'li', dl: 'dd' }[getListTag(cObj)] || 'div';
};

var getListTag = function(cObj)
{ return cObj._properties.listTag || 'ul'; };

})(jQuery);
