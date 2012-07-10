;(function($) {

$.component.Container.extend('Grid Container', 'content', {
    _renderStatus: {},

    _getContainer: function()
    {
        if (!this._gotContainer)
        {
            if (this.$contents.children('.row').length == 1)
            { this.$contents.find('.row > .socrata-component').unwrap(); }
            this._gotContainer = true;
        }
        return this.$contents;
    },

    _arrange: function()
    {
        var cObj = this;
        cObj._super();
        var cw = valOrDef(cObj._properties.cellWidth, 300);
        var ch = valOrDef(cObj._properties.cellHeight, 300);
        var cspace = valOrDef(cObj._properties.cellSpacing, 10);
        var cvspace = valOrDef(cObj._properties.cellVSpacing, cspace);
        var cborder = valOrDef(cObj._properties.cellBorderWidth, 0);
        var innerCW = cspace * 2 + cborder;
        var rspace = valOrDef(cObj._properties.rowSpacing, 0);
        var rborder = valOrDef(cObj._properties.rowBorderWidth, cborder);

        _.defer(function()
        {
            var mainW = cObj.$contents.width();
            var rowItems;
            for (rowItems = 0; (rowItems * cw + (rowItems-1) * innerCW) <= mainW; rowItems++)
            { }
            rowItems--;
            var visibleChildren = [];
            cObj.each(function(c) { if (!c._isHidden) { visibleChildren.push(c); } });
            var rows = Math.ceil(1.0 * visibleChildren.length / rowItems);

            if (!cObj._renderStatus.layoutStale && rowItems == cObj._renderStatus.rowItems &&
                rows == cObj._renderStatus.rows &&
                visibleChildren.length == cObj._renderStatus.numChildren)
            { return; }

            var $rows = cObj.$contents.children('.row');
            $rows.slice(rows - 1).detach();
            $rows = $rows.slice(0, rows - 1);
            while ($rows.length < rows)
            {
                var $r = $.tag({ tagName: 'div', 'class': ['row', 'clearfix'] });
                cObj.$contents.append($r);
                $rows = $rows.add($r);
            }
            $rows.removeClass('first last').css({
                paddingTop: rspace,
                paddingBottom: rspace,
                borderBottomWidth: rborder,
                width: rowItems * cw + (rowItems-1) * innerCW
            });
            $rows.first().addClass('first').css({
                paddingTop: 0
            });
            $rows.last().addClass('last').css({
                paddingBottom: 0,
                borderBottomWidth: 0
            });
            _.each(visibleChildren, function(c, i)
            {
                if (!$.isBlank(c.$dom))
                {
                    var $r = $rows.eq(Math.floor(i / rowItems));
                    var firstRow = $r.hasClass('first');
                    var lastRow = $r.hasClass('last');
                    $r.append(c.$dom);

                    var firstCol = (i % rowItems) == 0;
                    var lastCol = ((i+1) % rowItems) == 0;
                    c.$dom.css({height: ch, width: cw,
                        paddingLeft: firstCol ? 0 : cspace, paddingTop: firstRow ? 0 : cvspace,
                        paddingRight: lastCol ? 0 : cspace, paddingBottom: lastRow ? 0 : cvspace,
                        borderRightWidth: lastCol ? 0 : cborder
                    });
                    c.$dom.toggleClass('first', firstCol);
                    c.$dom.toggleClass('last', lastCol);
                }
            });

            cObj._renderStatus = {
                layoutStatus: false,
                numChildren: visibleChildren.length,
                rows: rows,
                rowItems: rowItems
            };
        });
    },

    _moveChildDom: function(child)
    {
        this._renderStatus.layoutStale = true;
        this._super.apply(this, arguments);
    },

    _removeChildDom: function(child)
    {
        this._renderStatus.layoutStale = true;
        this._super.apply(this, arguments);
    },

    _propWrite: function()
    {
        this._renderStatus.layoutStale = true;
        this._super.apply(this, arguments);
    }
});

var valOrDef = function(val, def)
{ return $.isBlank(val) ? def : val; };

})(jQuery);
