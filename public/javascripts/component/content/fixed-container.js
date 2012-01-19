$.component.Container.extend('FixedContainer', 'content', {
    _needsOwnContext: true,

    _getAssets: function()
    {
        return { javascripts: [{ assets: 'waypoints' }] };
    },

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
                    cObj.$contents.css('top', $b.css('padding-top'));
                }
                else
                {
                    cObj.$dom.height('');
                    cObj.$contents.width('').css('top', '');
                }
                cObj.$contents.toggleClass('sticky', dir === 'down');
            }, {offset: parseInt($b.css('padding-top'))});

        return true;
    }
});
