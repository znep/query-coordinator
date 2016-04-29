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
            balanceNaively: false,
            columnCount: 1,
            config: null,
            defaultItem: '',
            highlight: null,
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
            renderRow: function($content, row, noBkgColor)
            {
                var rrObj = this;
                var isHighlight = (row.sessionMeta || {}).highlight || false;
                $content.css('background-color', noBkgColor || isHighlight ? '' : row.color || '');
                $content.toggleClass('rowHighlight', !noBkgColor && isHighlight);
                $content.data('renderrow', row);
                _.each(rrObj.visibleColumns(), function(c)
                {
                    $content.find('.columnId' + c.id).each(function()
                        { renderItem(rrObj, $(this), row, c); });
                });
            },

            setConfig: function(newConfig)
            {
                this.settings.config = newConfig;
            },

            adjustLayout: function()
            {
                var rrObj = this;
                // If we have a config, it's not going to dynamically move around
                if ($.subKeyDefined(rrObj.settings.config, 'columns')) { return; }

                var $cols = rrObj.$dom().find('.richColumn');
                var numCols = $cols.length;

                var itemHeight = 0;
                var $allLines = rrObj.$dom().find('.richLine').each(function()
                {
                    itemHeight += $(this).outerHeight(true);
                });

                // If all the content fits in one column, move everything there
                if (!rrObj.settings.balanceFully &&
                    !rrObj.settings.balanceNaively &&
                    itemHeight < rrObj.$dom().height())
                { $cols.eq(0).append($allLines); }

                else if(rrObj.settings.balanceNaively)
                {
                    var i = 0;
                    var cellsPerColumn = Math.floor($allLines.length / numCols);
                    var leftovers = $allLines.length % numCols;
                    // Fewer columns than cells? Get rid of extra columns
                    if (cellsPerColumn == 0)
                    {
                        var colWidth = Math.floor(100/leftovers);
                        $cols.each(function(j)
                        {
                            var $col = $(this);
                            if (j < leftovers)
                            { $col.width(colWidth + '%'); }
                            else
                            { $col.remove(); }
                        });
                    }

                    $cols.each(function()
                    {
                        var thisCol = cellsPerColumn;
                        if (leftovers > 0)
                        {
                            thisCol++;
                            leftovers--;
                        }
                        for (var j = 0; j < thisCol; j++)
                        {
                            $(this).append($allLines.eq(i));
                            i++;
                        }
                    });
                }

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

                if (!$.subKeyDefined(rrObj.settings.config, 'columns'))
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
                                { recurseColumn(cc, $row); });
                        }
                        else if (!$.isBlank(r.fields))
                        {
                            _.each(r.fields, function(f)
                                { addField(rrObj, f, $row); });
                        }
                    });
                };

                _.each(rrObj.settings.config.columns || [], function(c)
                {
                    recurseColumn(c, rrObj.$dom());
                });
            },

            visibleColumns: function()
            {
                var rrObj = this;

                if (!$.subKeyDefined(rrObj.settings.config, 'columns'))
                { return rrObj.settings.view.visibleColumns; }

                var cols = [];
                var recurseColumn;
                recurseColumn = function(col)
                {
                    _.each(col.rows || [], function(r)
                    {
                        if (!$.isBlank(r.columns))
                        {
                            _.each(r.columns, function(cc)
                                { recurseColumn(cc); });
                        }
                        else if (!$.isBlank(r.fields))
                        {
                            _.each(r.fields, function(f)
                            {
                                if (f.type != 'columnData') { return; }
                                var c = rrObj.settings.view.columnForIdentifier(
                                    f.fieldName || f.tableColumnId)
                                if (!$.isBlank(c) && !c.hidden) { cols.push(c); }
                            });
                        }
                    });
                };
                _.each(rrObj.settings.config.columns || [], function(c)
                { recurseColumn(c); });

                return _.uniq(cols);
            }
        }
    });


    var getStyles = function(conf)
    {
        var styles = {};
        if (!$.isBlank(conf.styles))
        {
            styles.style = conf.styles;
            styles['data-rr-width'] = conf.styles.width;
            styles['data-rr-height'] = conf.styles.height;
            styles['data-rr-styles'] = $.htmlEscape(JSON.stringify(conf.styles));
        }
        return styles;
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
        var col = field.column ||
            rrObj.settings.view.columnForIdentifier(field.fieldName || field.tableColumnId);
        if (field.type.startsWith('column') && ($.isBlank(col) || col.hidden)) { return; }

        var commonAttrs = getStyles(field);

        var $field;
        switch (field.type)
        {
            case 'columnLabel':
                $field = $.tag($.extend(commonAttrs,
                    {tagName: 'span', 'class': ['richLabel', 'columnLabel'],
                        'data-tcId': col.tableColumnId,
                        contents: $.htmlEscape(col.name)}));
                break;

            case 'columnData':
                if (col.renderType.inlineType)
                {
                    commonAttrs.style =
                        $.extend({display: 'inline'}, commonAttrs.style);
                }
                $field = $.tag($.extend(commonAttrs, {tagName: 'div',
                    'data-tcId': col.tableColumnId,
                    'class': ['richItem', 'columnData',
                        col.renderTypeName, 'columnId' + col.id]
                    }));
                break;

            case 'label':
                $field = $.tag($.extend(commonAttrs,
                    {tagName: 'span', 'class': ['richLabel', 'staticLabel'],
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

    var renderItem = function(rrObj, $container, row, column)
    {
        $container.empty();

        if (_.isNull(row.data[column.lookup]) ||
            (_.isArray(row.data[column.lookup]) && _.isEmpty(row.data[column.lookup])))
        {
            $container.append(rrObj.settings.defaultItem.replace('#{column.name}',
                $.htmlEscape(column.name)));
            return;
        }

        if (column.dataTypeName == 'nested_table')
        {
            $container.append(renderNestedTable(rrObj, row, column));
            setUpNestedTableWidths($container, column);
            return;
        }

        if (row.invalid && row.invalid[column.lookup])
        {
            return $('<span class="invalid">' +
                blist.datatypes.invalid.renderer(row.data[column.lookup], column) +
                '</span>');
        }

        var item = (column.renderType.renderer(row.data[column.lookup],
            column) || '') + '';

        // We don't want to replace the url portion
        // if it matched inside the <a> tag
        if (rrObj.settings.highlight && (column.renderTypeName != 'url') &&
            (column.renderTypeName != 'html'))
        {
            // $('<span>blah</span> word') == <span>blah</span>
            // so wrap the whole thing in a span
            item = '<span>' + item.replace(rrObj.settings.highlight,
                '<span class="highlight">$&</span>') + '</span>';
        }
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

    var renderNestedTable = function(rrObj, row, column)
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
            blist.styles.addStyle('richRender', 'pageNestedColumn' + cc.id,
                '.richColumn .nested_table table .col' + cc.id);
        });

        var $tbody = $table.find('tbody');
        _.each(row.data[column.lookup] || [], function(subRow)
        {
            var $row = $('<tr></tr>');
            _.each(column.visibleChildColumns, function(cc)
            {
                var $cell = $.tag({tagName: 'td', 'class': ['col' + cc.id,
                    cc.renderTypeName,
                    (cc.format.align ? 'align-' + cc.format.align : null)]});
                renderItem(rrObj, $cell, subRow, cc);
                $row.append($cell);
            });
            $tbody.append($row);
        });

        if ((row.data[column.lookup] || []).length < 1)
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
            blist.styles.getStyle('richRender',
                'pageNestedColumn' + cc.id).width = (cc.width - padding) + 'px';
        });
    };

})(jQuery);
