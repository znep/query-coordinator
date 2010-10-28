(function($)
{
    $.fn.richRenderer = function(options)
    {
        // Check if object was already created
        var richRenderer = $(this[0]).data("richRenderer");
        if (!richRenderer)
        {
            richRenderer = new richRendererObj(options, this[0]);
        }
        return richRenderer;
    };

    var richRendererObj = function(options, dom)
    {
        this.settings = $.extend({}, richRendererObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(richRendererObj,
    {
        defaults:
        {
            balanceFully: false,
            columnCount: 1,
            config: null,
            view: null
        },

        prototype:
        {
            init: function ()
            {
                var rrObj = this;
                var $domObj = rrObj.$dom();
                $domObj.data("richRenderer", rrObj);

                $domObj.addClass('richRendererContainer');
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            },

            // This is a little bit odd, since it doesn't act on the $dom
            // it attached to; but in some cases, we have a template row
            // that does the actual layout, then we clone it (outside this
            // class) and make this class render it
            renderRow: function($content, row)
            {
                var rrObj = this;
                _.each(rrObj.settings.view.visibleColumns, function(c)
                {
                    $content.find('[data-columnId=' + c.id + ']').each(function()
                        { renderItem($(this), row, c); });
                });
            },

            adjustLayout: function()
            {
                var rrObj = this;
                // If we have a config, it's not going to dynamically move around
                if (!$.isBlank(rrObj.settings.config)) { return; }

                var $cols = rrObj.$dom().find('.richColumn');
                var numCols = $cols.length;

                var itemHeight = 0;
                var $allLines = rrObj.$dom().find('.richLine').each(function()
                {
                    itemHeight += $(this).outerHeight(true);
                });

                // If all the content fits in one column, move everything there
                if (!rrObj.settings.balanceFully &&
                    itemHeight < rrObj.$dom().height())
                { $cols.eq(0).append($allLines); }

                // Otherwise, balance them
                else
                {
                    var colHeight = itemHeight / numCols;
                    var i = 0;
                    $cols.each(function()
                    {
                        var $col = $(this);
                        var curHeight = 0;
                        while (curHeight < colHeight && i < $allLines.length)
                        {
                            var $curItem = $allLines.eq(i);
                            $col.append($curItem);
                            curHeight += $curItem.outerHeight(true);
                            i++;
                        }
                    });
                }
            },

            renderLayout: function()
            {
                var rrObj = this;
                rrObj.$dom().empty();

                if ($.isBlank(rrObj.settings.config))
                {
                    renderDefaultLayout(rrObj);
                    return;
                }

                var recurseColumn;
                recurseColumn = function(col, $parent)
                {
                    var $col = addColumn(rrObj, col, $parent);
                    _.each(col.rows || [], function(r)
                    {
                        var $row = addRow(rrObj, r, $col);
                        if (!$.isBlank(r.columns))
                        {
                            _.each(r.columns, function(cc)
                            {
                                recurseColumn(cc, $row);
                            });
                        }
                        else if (!$.isBlank(r.fields))
                        {
                            _.each(r.fields, function(f)
                            {
                                addField(rrObj, f, $row);
                            });
                        }
                    });
                };

                var conf = rrObj.settings.config;
                _.each(conf.columns || [], function(c)
                {
                    recurseColumn(c, rrObj.$dom());
                });
            }

        }
    });


    var getStyles = function(conf)
    {
        return $.isBlank(conf.styles) ? {} : {style: conf.styles};
    };

    var addColumn = function(rrObj, col, $parent)
    {
        var s = getStyles(col);
        var $newCol = $.tag($.extend(s, {tagName: 'div', 'class': 'richColumn'}));
        $parent.append($newCol);
        return $newCol;
    };

    var addRow = function(rrObj, row, $parent)
    {
        var s = getStyles(row);
        var $newRow = $.tag($.extend(s, {tagName: 'div', 'class': 'richLine'}));
        $parent.append($newRow);
        return $newRow;
    };

    var addField = function(rrObj, field, $parent)
    {
        if ($.isBlank(field.column) && !$.isBlank(field.tableColumnId))
        { field.column = rrObj.settings.view.columnForTCID(field.tableColumnId); }
        var col = field.column;

        var commonAttrs = getStyles(field);

        var $field;
        switch (field.type)
        {
            case 'columnLabel':
                $field = $.tag($.extend(commonAttrs,
                    {tagName: 'span', 'class': 'richLabel',
                        contents: $.htmlEscape(col.name)}));
                break;

            case 'columnData':
                if (col.renderType.inlineType)
                {
                    commonAttrs.style =
                        $.extend({display: 'inline'}, commonAttrs.style);
                }
                $field = $.tag($.extend(commonAttrs, {tagName: 'div',
                    'class': ['richItem', col.renderTypeName],
                    'data-columnId': col.id}));
                break;

            case 'label':
                $field = $.tag($.extend(commonAttrs,
                    {tagName: 'span', 'class': 'richLabel',
                        contents: $.htmlEscape(field.text)}));
                break;

            default:
                $.debug('field type ' + field.type + ' not supported', field);
                break;
        }

        $parent.append($field);
        return $field;
    };

    var renderDefaultLayout = function(rrObj)
    {
        var $cols = [];
        var colWidth = Math.floor(100/rrObj.settings.columnCount);
        for (var i = 0; i < rrObj.settings.columnCount; i++)
        {
            $cols.push(addColumn(rrObj, {styles: {width: colWidth + '%'}},
                rrObj.$dom()));
        }

        _.each(rrObj.settings.view.visibleColumns, function(c)
        {
            var $line = addRow(rrObj, {}, $cols[0]);
            addField(rrObj, {type: 'columnLabel', column: c,
                styles: { width: '10em' }}, $line);
            addField(rrObj, {type: 'columnData', column: c}, $line);
            $line.bind('image_resize',
                function() { rrObj.adjustLayout(); });
        });
        rrObj.adjustLayout();
    };

    var renderItem = function($container, row, column)
    {
        $container.empty();

        if (_.isNull(row[column.lookup])) { return; }

        if (column.dataTypeName == 'nested_table')
        {
            $container.append(renderNestedTable(row, column));
            setUpNestedTableWidths($container, column);
            return;
        }

        if (row.invalid[column.lookup])
        {
            return $('<span class="invalid">' +
                blist.data.types.invalid.renderer(row[column.lookup]) +
                '</span>');
        }

        var item = (column.renderType.renderer(row[column.lookup],
            column) || '') + '';
        if (!item.startsWith('<')) { item = '<span>' + item + '</span>'; }
        var $item = $(item);

        // Need to re-adjust layout when an image size is known
        if (column.renderTypeName.startsWith('photo') && !$.isBlank($item))
        {
            $item.find('img').andSelf().filter('img').one('load', function()
                { $item.trigger('image_resize'); });
        }
        $container.append($item);
    };

    var renderNestedTable = function(row, column)
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
                    '.richColumn .nested_table table .col' + cc.id);
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
                renderItem($cell, subRow, cc);
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

    var setUpNestedTableWidths = function($nt, column)
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

})(jQuery);
