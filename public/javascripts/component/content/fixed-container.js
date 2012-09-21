$.component.Container.extend('Fixed Container', 'none', {//'content', {
    _needsOwnContext: true,

    _render: function()
    {
        var cObj = this;
        if (!cObj._super.apply(cObj, arguments)) { return false; }

        var $b = $('body');
        cObj.$dom.waypoint(function(ev, dir)
            {
                if (dir === 'down')
                {
                    cObj.$dom.height(cObj.$contents.height());
                    cObj.$contents.width(cObj.$dom.width());
                    cObj.$contents.css({top: $b.css('padding-top'), left: cObj.$dom.offset().left});
                }
                else
                {
                    cObj.$dom.height('');
                    cObj.$contents.width('').css({top: '', left: ''});
                }
                cObj._floating = dir === 'down';
                cObj.$contents.toggleClass('sticky', dir === 'down');
            }, {offset: parseInt($b.css('padding-top'))});

        var key = '.fixedContainer_' + cObj.id;
        $(window).off(key).on('resize' + key, function()
        {
            if (cObj._floating)
            { cObj.$contents.css('left', cObj.$dom.offset().left); }
        });

        return true;
    }
});
