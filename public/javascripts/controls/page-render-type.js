(function($)
{
    $.fn.pageRenderType = function(options)
    {
        // Check if object was already created
        var pageRenderType = $(this[0]).data("pageRenderType");
        if (!pageRenderType)
        {
            pageRenderType = new pageRenderTypeObj(options, this[0]);
        }
        return pageRenderType;
    };

    var pageRenderTypeObj = function(options, dom)
    {
        this.settings = $.extend({}, pageRenderTypeObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(pageRenderTypeObj,
    {
        defaults:
        {
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var prtObj = this;
                var $domObj = prtObj.$dom();
                $domObj.data("pageRenderType", prtObj);

                $domObj.bind('resize', function(e)
                    { resizeHandle(prtObj); });

                hookUpNavigation(prtObj);
                renderLayout(prtObj);
                prtObj.settings.view.bind('row_count_change', function()
                    { updateNavigation(prtObj); });
                prtObj.settings.view.bind('columns_changed', function()
                    {
                        renderLayout(prtObj);
                        renderCurrentRow(prtObj);
                    });

                prtObj._curRowIndex = 0;

                $(document).bind(blist.events.DISPLAY_ROW, function(e, rowIndex)
                        { prtObj.displayRowByIndex(rowIndex); });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            $content: function()
            {
                if (!this._$content)
                { this._$content = this.$dom().find('.content'); }
                return this._$content;
            },

            $nav: function()
            {
                if (!this._$nav)
                { this._$nav = this.$dom().find('.navigation'); }
                return this._$nav;
            },

            displayRowByIndex: function(index)
            {
                var prtObj = this;

                if (index < 0)
                { index = prtObj.settings.view.totalRows + index + 1; }
                if (index >= prtObj.settings.view.totalRows)
                { index = prtObj.settings.view.totalRows - 1; }

                prtObj._curRowIndex = index;
                renderCurrentRow(prtObj);
                updateNavigation(prtObj);
            },

            displayRowByID: function(rowId)
            {
                var prtObj = this;

                prtObj.settings.view.rowIndex(rowId, function(rowIndex)
                {
                    if ($.isBlank(rowIndex)) { throw 'No row for ' + rowId; }
                    prtObj._curRowIndex = rowIndex;
                    renderCurrentRow(prtObj);
                    updateNavigation(prtObj);
                });
            }
        }
    });

    var resizeHandle = function(prtObj)
    {
        prtObj.$content().height(prtObj.$dom().height() -
            (prtObj.$content().outerHeight(true) - prtObj.$content().height()));
        adjustLayout(prtObj);
    };

    var hookUpNavigation = function(prtObj)
    {
        prtObj.$nav().find('.button').click(function(e)
        {
            e.preventDefault();
            var $a = $(this);
            if ($a.is('.disabled')) { return; }

            switch ($.hashHref($a.attr('href')))
            {
                case 'first':
                    prtObj.displayRowByIndex(0);
                    break;
                case 'last':
                    prtObj.displayRowByIndex(-1);
                    break;
                case 'previous':
                    prtObj.displayRowByIndex(prtObj._curRowIndex - 1);
                    break;
                case 'next':
                    prtObj.displayRowByIndex(prtObj._curRowIndex + 1);
                    break;
            }
        });
    };

    var updateNavigation = function(prtObj)
    {
        var $info = prtObj.$nav().find('.info');
        $info.find('.curRow').text(prtObj._curRowIndex + 1);
        var rowCount = prtObj.settings.view.totalRows;
        $info.find('.totalRows').text(rowCount);

        prtObj.$nav().find('.first, .previous')
            .toggleClass('disabled', prtObj._curRowIndex <= 0);
        prtObj.$nav().find('.last, .next')
            .toggleClass('disabled', prtObj._curRowIndex >= rowCount - 1);
    };

    var renderLayout = function(prtObj)
    {
        prtObj.$content().empty();

        var $cols = [];
        $cols[0] = $('<div class="pageColumn" data-pageColumn="0"></div>');
        prtObj.$content().append($cols[0]);
        $cols[1] = $('<div class="pageColumn" data-pageColumn="1"></div>');
        prtObj.$content().append($cols[1]);

        _.each(prtObj.settings.view.visibleColumns, function(c)
        {
            var $line = $('<div class="pageLine ' + c.renderTypeName +
                '" data-columnId="' + c.id + '">' +
                '<span class="pageLabel">' + $.htmlEscape(c.name) + '</span>' +
                '<div class="pageItem"></div>' +
                '</div>');
            $cols[0].append($line);
        });
        adjustLayout(prtObj, true);
    };

    var adjustLayout = function(prtObj, forceFull)
    {
        var $cols = prtObj.$content().find('.pageColumn');
        var col0Bottom = $cols.eq(0).outerHeight() + $cols.eq(0).offset().top;
        var contentBottom = prtObj.$content().offset().top +
            prtObj.$content().outerHeight();

        // If all the content fits in one column, move everything there
        if (col0Bottom + $cols.eq(1).outerHeight() < contentBottom)
        {
            $cols.eq(0).append($cols.eq(1).find('.pageLine'));
        }
        // Otherwise, balance them
        else if (forceFull || col0Bottom > contentBottom)
        {
            // Move fields over until the second column is bigger or equal
            while ($cols.eq(1).outerHeight() < $cols.eq(0).outerHeight())
            { $cols.eq(1).prepend($cols.eq(0).find('.pageLine:last')); }

            // Then if the second column is bigger, move fields back,
            // so that the first column is just longer than the second
            while ($cols.eq(1).outerHeight() > $cols.eq(0).outerHeight())
            { $cols.eq(0).append($cols.eq(1).find('.pageLine:first')); }
        }
    };


    var renderItem = function(prtObj, row, column)
    {
        if (row.invalid[column.lookup])
        {
            return $('<span class="invalid">' +
                blist.data.types.invalid.renderer(row[column.lookup]) + '</span>');
        }

        var item = (column.renderType.renderer(row[column.lookup], column) ||
            '') + '';
        if (!item.startsWith('<')) { item = '<span>' + item + '</span>'; }
        var $item = $(item);

        // Need to re-adjust layout when an image size is known
        if (column.renderTypeName.startsWith('photo') && !$.isBlank($item))
        {
            $item.find('img').andSelf().filter('img').one('load', function()
                { adjustLayout(prtObj, true); });
        }
        return $item;
    };

    var renderNestedTable = function(prtObj, row, column)
    {
        var $table = $('<table><colgroup></colgroup><thead><tr></tr></thead>' +
            '<tbody></tbody></table>');
        var $colgroup = $table.find('colgroup');
        var $thead = $table.find('thead tr');
        _.each(column.visibleChildColumns, function(cc)
        {
            $colgroup.append($.tag({tagName: 'col', 'class': 'col' + cc.id}));
            $thead.append($.tag({tagName: 'th', 'class': 'col' + cc.id,
                contents: $.htmlEscape(cc.name)}));
            // First set up styles; do these all before using them
            // so they get created in the same style block for efficiency
            if ($.isBlank(blist.styles.getStyle('pageNestedColumn' + cc.id)))
            {
                blist.styles.addStyle('pageNestedColumn' + cc.id,
                    '.pageColumn .nested_table table .col' + cc.id);
            }
        });

        var $tbody = $table.find('tbody');
        _.each(row[column.lookup] || [], function(subRow)
        {
            var $row = $('<tr></tr>');
            _.each(column.visibleChildColumns, function(cc)
            {
                var $cell = $.tag({tagName: 'td', 'class': ['col' + cc.id,
                    cc.renderTypeName,
                    (cc.format.align ? 'align-' + cc.format.align : null)]});
                $cell.append(renderItem(prtObj, subRow, cc));
                $row.append($cell);
            });
            $tbody.append($row);
        });

        if ((row[column.lookup] || []).length < 1)
        {
            $tbody.append($.tag({tagName: 'tr', contents: {tagName: 'td',
                'class': ['invalid', 'noResults'],
                colspan: column.visibleChildColumns.length,
                contents: 'No rows'}}));
        }

        return $table;
    };

    var setUpNestedTableWidths = function(prtObj, $nt, column)
    {
        // Now set up column widths; measure first so we know how much to
        // take off for padding
        var $cell = $nt.find('thead th:first');
        var padding = $cell.outerWidth() - $cell.width();
        _.each(column.visibleChildColumns, function(cc)
        {
            blist.styles.getStyle('pageNestedColumn' + cc.id).width =
                (cc.width - padding) + 'px';
        });
    };


    var renderCurrentRow = function(prtObj)
    {
        if ($.isBlank(prtObj._curRowIndex)) { return; }

        var rowLoaded = function(rows)
        {
            if (rows.length != 1) { return; }
            var row = rows[0];

            _.each(prtObj.settings.view.visibleColumns, function(c)
            {
                var $line = prtObj.$content()
                    .find('.pageLine[data-columnId=' + c.id + ']');

                var $item = $line.find('.pageItem');
                $item.empty();

                if (c.dataTypeName == 'nested_table')
                {
                    $item.append(renderNestedTable(prtObj, row, c));
                    setUpNestedTableWidths(prtObj, $item, c);
                }
                else
                { $item.append(renderItem(prtObj, row, c)); }
            });
            adjustLayout(prtObj, true);
        };
        prtObj.settings.view.getRows(prtObj._curRowIndex, 1, rowLoaded);
    };

})(jQuery);
