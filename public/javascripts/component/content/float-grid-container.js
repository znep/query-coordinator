;(function($) {

$.component.Container.extend('Float Grid Container', 'content', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return {
            javascripts: [{ assets: 'masonry' }]
        };
    },

    _arrange: function()
    {
        var cObj = this;
        cObj._super();

        if (!$.isBlank(cObj.$ct) && !$.isBlank(cObj.$ct.masonry))
        {
            var opts = {};
            var props = cObj._stringSubstitute(cObj._properties);
            _.each(['columnWidth', 'animationOptions', 'containerStyle', 'gutterWidth', 'isAnimated'],
                function(p)
                {
                    if (!$.isBlank(props[p]))
                    { opts[p] = props[p]; }
                });
            _.defer(function()
            {
                if (!cObj._masonryInit)
                {
                    cObj.$ct.masonry(opts);
                    cObj._masonryInit = true;
                }
                else
                {
                    cObj.$ct.masonry('option', opts);
                    cObj.$ct.masonry('reload');
                }
            });
        }
    },

    _propWrite: function()
    {
        this._super.apply(this, arguments);
        this._arrange();
    },

    // FIXME
//    _testChildHit: function(child, pos, inSequence)
//    {
//        var $row = child.$dom.closest('.row');
//        var rowOffset = $row.offset();
//        if (!((inSequence && rowOffset.top > pos.y) ||
//            rowOffset.top <= pos.y && (rowOffset.top + $row.outerHeight(true)) >= pos.y))
//        { return false; }
//
//        var childOffset = child.$dom.offset();
//        return (inSequence && childOffset.left > pos.x) ||
//            childOffset.left <= pos.x && (childOffset.left + child.$dom.outerWidth(true)) >= pos.x ||
//            childOffset.left <= pos.x && child.$dom.hasClass('last');
//    },

    _dropCursorDirection: function()
    { return 'vertical'; }
});

})(jQuery);
