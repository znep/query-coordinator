/**
 * This file implements the Blist table control.  This control offers an interactive presentation of tabular data to
 * the user.
 */

(function($)
{
    // Milliseconds to delay before expanding a cell's content
    var EXPAND_DELAY = 100;

    // Milliseconds in which expansion should occur
    var EXPAND_DURATION = 200;

    // Millisecond delay before loading missing rows
    var MISSING_ROW_LOAD_DELAY = 100;

    var nextTableID = 1;

    // HTML escaping utility
    var escape = function(text)
    {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    };

    // Make a DOM element into a table
    var makeTable = function(options)
    {

        /*** MISC. VARIABLES AND INITIALIZATION ***/

        var id = this.id;
        if (!id)
        {
            id = nextTableID++;
            id = "blist-t" + id;
            this.id = id;
        }

        var $this = $(this);


        /*** CLOSURE UTILITY FUNCTIONS ***/

        // Calculate the number of digits in the handle.  This is important
        // because we need to recreate our layout if the width of the column
        // changes.
        var calculateHandleDigits = function(model)
        {
            return Math.ceil(Math.log(model.rows().length || 1) * Math.LOG10E);
        };

        // Sort data
        var sortBy = -1;
        var sortDescending;
        var sort = function(index)
        {
            if (sortBy == index)
            {
                sortDescending = !sortDescending;
            }
            else
            {
                sortBy = index;
                sortDescending = false;
            }
            configureSortHeader();
            model.sort(index, sortDescending);
        };

        var configureSortHeader = function()
        {
            $('.sort.active', header)
                .removeClass('sort-asc').addClass('sort-desc')
                .attr('title', 'Sort ascending')
                .removeClass('active');
            if (sortBy >= 0)
            {
                var col = columns[sortBy];
                var oldClass = 'sort-' + (sortDescending ? 'asc' : 'desc');
                var newClass = 'sort-' + (sortDescending ? 'desc' : 'asc');
                var newTitle = 'Sort ' +
                    (sortDescending ? 'ascending' : 'descending');
                $('.sort', col.dom)
                    .removeClass(oldClass).addClass(newClass)
                    .attr('title', newTitle)
                    .addClass('active');
            }
        };

        // Filter data
        var applyFilter = function()
        {
            setTimeout(function() {
                model.filter($filterBox[0].value, 250);
            }, 10);
        };

        var clearFilter = function(e)
        {
            e.preventDefault();
            $filterBox.val('').blur();
            model.filter('');
        };



        /*** CELL HOVER EXPANSION ***/

        var hotExpander;

        var hideHotExpander = function()
        {
            if (hotExpander)
            {
                hotExpander.style.top = '-10000px';
                hotExpander.style.left = '-10000px';
            }
        };

        var expandHotCell = function()
        {
            if (!hotCellTimer)
            {
                return;
            }
            hotCellTimer = null;

            // Obtain an expanding node in utility (off-screen) mode
            if (!hotExpander)
            {
                // Create the expanding element
                hotExpander = document.createElement('div');
                var $hotExpander = $(hotExpander);
                $hotExpander.addClass('blist-table-expander');
                $hotExpander.addClass('blist-table-util');
            }
            else
            {
                hideHotExpander();
                $hotExpander = $(hotExpander);
            }
            // If hotExpander is not in the tree anywhere, stick it inside
            if (hotExpander.parentNode == null)
            {
                inside.append($hotExpander);
            }

            // Clone the node
            var wrap = hotCell.cloneNode(true);
            var $wrap = $(wrap);
            $wrap.width('auto').height('auto');
            $hotExpander.width('auto').height('auto');
            $hotExpander.empty();
            $hotExpander.append(wrap);

            // Compute cell padding
            var padx = $wrap.outerWidth() - $wrap.width();
            var pady = $wrap.outerHeight() - $wrap.height();

            // Determine the cell's "natural" size
            var rc = { width: $wrap.outerWidth() + 1,
                height: $wrap.outerHeight() };

            // Determine if expansion is necessary.  The + 2 prevents us from
            // expanding if the box would just be slightly larger than the
            // containing cell.  This is a nicety except in the case of
            // picklists where the 16px image tends to be just a tad larger
            // than the text (currently configured at 15px).
            var h = $(hotCell);
            var hotWidth = h.outerWidth();
            var hotHeight = h.outerHeight();
            if (rc.width <= hotWidth + 2 && rc.height <= hotHeight + 2)
            {
                // Expansion is not necessary
                hideHotExpander();
                return;
            }

            // The expander must be at least as large as the hot cell
            if (rc.width < hotWidth)
            {
                rc.width = hotWidth;
            }
            if (rc.height < hotHeight)
            {
                rc.height = hotHeight;
            }

            // Determine the size to which the contents expand, constraining to
            // predefined maximums
            var maxWidth = Math.floor(scrolls.width() * .5);
            if (rc.width > maxWidth)
            {
                // Constrain the width and determine the height
                $hotExpander.width(maxWidth);
                rc.width = maxWidth;
                rc.height = $hotExpander.height();
            }
            var maxHeight = Math.floor(inside.height() * .75);
            if (rc.height > maxHeight)
                rc.height = maxHeight;

            // Locate a position for the expansion.  We prefer the expansion to
            // align top-left with the cell but do our best to ensure the
            // expansion remains within the viewport
            rc.left = hotCell.offsetLeft;
            rc.top = hotCell.parentNode.offsetTop;
            rc.left -= 1; // assumes 1px right border
            rc.top -= 1; // assumes 1px bottom border
            var origOffset = { top: rc.top, left: rc.left };

            // Ensure viewport is in the window horizontally
            var viewportWidth = scrolls.width();
            if (scrolls[0].scrollHeight > scrolls[0].clientHeight)
                viewportWidth -= scrollbarWidth;
            var scrollLeft = scrolls.scrollLeft();
            if (rc.left + rc.width > scrollLeft + viewportWidth)
                rc.left = scrollLeft + viewportWidth - rc.width;
            if (rc.left < scrollLeft)
                rc.left = scrollLeft;

            // Ensure viewport is in the window vertically
            var viewportHeight = scrolls.height();
            if (scrolls[0].scrollWidth > scrolls[0].clientWidth)
                viewportHeight -= scrollbarWidth;
            var scrollTop = scrolls.scrollTop();
            if (rc.top + rc.height > scrollTop + viewportHeight)
                rc.top = scrollTop + viewportHeight - rc.height;
            if (rc.top < scrollTop - 1)
                rc.top = scrollTop - 1;

            // Size the content wrapper
            $wrap.width(rc.width - padx);
            $wrap.height(rc.height - pady);

            // Position the expander
            $hotExpander.css('top', origOffset.top + 'px');
            $hotExpander.css('left', origOffset.left + 'px');
            $hotExpander.width(hotWidth);
            $hotExpander.height(hotHeight);
            $hotExpander.removeClass('blist-table-util');

            // Expand the element into position
            $hotExpander.animate($.extend(rc, rc), EXPAND_DURATION);
        };


        /*** CELL EVENT HANDLING ***/

        // Handle mouse movement within the inside (cell) area
        var hotCell;
        var hotRow;
        var hotCellTimer;

        var findCell = function(event)
        {
            var $cell;
            // Firefox will sometimes return a XULElement for relatedTarget
            //  Catch the error when trying to access anything on it, and ignore
            try
            {
                $cell = $(event.type == "mouseout" ?
                    event.relatedTarget : event.target);
            }
            catch (ignore) {}
            if (!$cell)
            {
                return null;
            }

            if (!$cell.hasClass('blist-td') && !$cell.hasClass('blist-expander'))
            {
                $cell = $cell.closest('.blist-td');
                if (!$cell.length)
                {
                    return null;
                }
            }
            var cell = $cell[0];
            if (cell == hotExpander || cell.parentNode == hotExpander)
            {
                return hotCell;
            }
            return cell;
        };

        var onCellMove = function(event)
        {
            // Locate the cell the mouse is in, if any
            var over = findCell(event);

            // If the hover cell is currently hot, nothing to do
            if (over == hotCell)
            {
                return;
            }

            // Update row hover state
            var newHotRow = $(over).closest('.blist-tr');
            if (newHotRow != hotRow)
            {
                if (hotRow)
                {
                    $(hotRow).removeClass('blist-hot-row');
                }
                if (newHotRow)
                {
                    $(newHotRow).addClass('blist-hot-row');
                }
                hotRow = newHotRow;
            }

            // Update cell hover state
            if (hotCell)
            {
                onCellOut(event);
            }
            hotCell = over;
            if (over)
            {
                $(over).addClass('blist-hot');
                hotCellTimer = setTimeout(expandHotCell, EXPAND_DELAY);
            }
        };

        var onCellOut = function(event)
        {
            if (hotCell)
            {
                // Find the cell focus is moving to
                var to = findCell(event);
                if (to == hotCell)
                {
                    // Ignore -- hot cell isn't changing
                    return;
                }

                // The row is no longer hot if we're changing rows
                if (hotRow)
                {
                    var newHotRow = $(to).closest('.blist-tr');
                    if (newHotRow != hotRow)
                        $(hotRow).removeClass('blist-hot-row');
                }

                // Cell is no longer hot
                $(hotCell).removeClass('blist-hot');
                hotCell = null;
                if (hotCellTimer)
                {
                    clearTimeout(hotCellTimer);
                    hotCellTimer = null;
                }
                hideHotExpander();
            }
        };

        var onCellClick = function(event)
        {
            var cell = findCell(event);
            if (cell)
            {
                // Retrieve the column
                var index = 0;
                for (var pos = cell.previousSibling; pos;
                    pos = pos.previousSibling)
                {
                    index++;
                }
                index--;
                var column = columns[index];

                // Retrieve the row
                var row = cell.parentNode;
                // + 2 for "-r" suffix prior to row ID
                var rowID = row.id.substring(id.length + 2);
                row = model.getByID(rowID);

                // Notify listeners
                $this.trigger("cellclick", [ row, column, event ]);
            }
        };


        /*** HTML RENDERING ***/

        var headerStr = '<div class="blist-table-top">';
        if (options.showTitle)
        {
            headerStr +=
                '<div class="blist-table-title-tl">\
                  <div class="blist-table-title-tr">\
                    <div class="blist-table-title">\
                      <div class="blist-table-filter-l">\
                        <div class="blist-table-filter-r">\
                          <input class="blist-table-filter"/>\
                          <a class="blist-table-clear-filter" title="Clear Search" href="#clear_filter">Clear Search</a>\
                      </div></div>';
            if (options.showName)
            {
                headerStr += '<div class="blist-table-name">&nbsp;</div>';
            }
            headerStr += '</div></div></div>';
        }
        headerStr +=
            '  <div class="blist-table-header-scrolls">\
                <div class="blist-table-header">&nbsp;</div>\
              </div></div>\
            <div class="blist-table-scrolls">\
              <div class="blist-table-inside">&nbsp;</div></div>\
            <div class="blist-table-util"></div>';
        // Render container elements
        var outside = $this
            .addClass('blist-table')
            .html(headerStr);

        // The top area
        var $top = outside.find('.blist-table-top');

        var $title;
        var $nameLabel;
        var $filterBox;
        if (options.showTitle)
        {
            // The title bar
            $title = $top.find('.blist-table-title');
            $nameLabel = $title.find('.blist-table-name');
            $filterBox = $title
                .find('.blist-table-filter')
                .keydown(applyFilter)
                .change(applyFilter)
                .example('Find Inside');
            $title.find('.blist-table-clear-filter')
                .click(clearFilter);
        }

        // The table header elements
        var headerScrolls = $top
            .find('.blist-table-header-scrolls');
        var header = headerScrolls
            .find('.blist-table-header');

        // The scrolling container
        var scrolls = outside
            .find('.blist-table-scrolls');

        // The non-scrolling row container
        var inside = scrolls
            .find('.blist-table-inside')
            .mousemove(onCellMove)
            .mouseout(onCellOut)
            .click(onCellClick);
        var insideDOM = inside[0];

        // These utility nodes are used to append rows and measure cell text,
        // respectively
        var appendUtil = $(document.createElement('div'));
        var appendUtilDOM = appendUtil[0];

        var measureUtil = outside
            .find('.blist-table-util');
        var measureUtilDOM = measureUtil[0];


        /*** SCROLLING AND SIZING ***/

        // Measure the scroll bar
        var scrollbarWidth = (function scrollbarWidth()
        {
            var div = $('<div style="width:50px;height:50px;overflow:hidden;' +
                'position:absolute;top:-200px;left:-200px;">' +
                '<div style="height:100px;"></div></div>');
            $('body').append(div);
            var w1 = div[0].clientWidth;
            div.css('overflow', 'scroll');
            var w2 = div[0].clientWidth;
            $(div).remove();
            return w1 - w2;
        })();

        // Window sizing
        var updateLayout = function()
        {
            headerScrolls.height(header.height());

            // Size the scrolling area.  Note that this assumes a width and
            // height of 2px.  TODO - change to absolute positioning when IE6
            // is officially dead (June 2010?)
            scrolls.height(outside.height() - $top.height() - 2);
            scrolls.width(outside.width() - 2);

            renderRows();

            adjustVariableColumns();
        };

        var adjustVariableColumns = function()
        {
            if (variableColumns.length > 0)
            {
                var pos = 0;
                // Sum up all the fixed column widths & paddings
                if (options.showGhostColumn)
                {
                    // Count the ghost column padding
                    pos += paddingX;
                }
                if (options.showRowNumbers)
                {
                    pos += handleOuterWidth;
                }
                for (var i = 0; i < columns.length; i++)
                {
                    pos += columns[i].width + paddingX;
                }
                pos += varMinWidth;

                var varSize = scrolls.width() - pos;
                if (scrolls[0].scrollHeight > scrolls[0].clientHeight)
                {
                    varSize -= scrollbarWidth;
                }
                varSize = Math.max(varSize, 0);
                for (i = 0; i < variableColumns.length; i++)
                {
                    var c = variableColumns[i];
                    if (c.ghostColumn)
                    {
                        ghostStyle.width = (c.minWidth + varSize)  + "px";
                    }
                    else
                    {
                        colStyles[c.index].width = ((c.minWidth || 0) +
                            ((c.percentWidth / 100.0) * varSize)) + 'px';
                    }
                }

                inside.width(varSize + pos);
                header.width(varSize + pos);

                // If we're not dealing with just the ghost column,
                //  readjust column lefts, sizers
                if (!options.showGhostColumn)
                {
                    pos = 0;
                    if (options.showRowNumbers)
                    {
                        pos += handleOuterWidth;
                    }
                    for (var i = 0; i < columns.length; i++)
                    {
                        var col = columns[i];
                        col.left = pos;
                        pos += paddingX;
                        pos += col.width || parseFloat(colStyles[col.index].width);
                        col.sizerLeft = pos - options.resizeHandleAdjust;
                        col.sizer.style.left = col.sizerLeft + 'px';
                    }
                }
            }
        };

        if (options.manualResize)
        {
            $this.bind('resize', updateLayout);
        }
        else
        {
            $(window).resize(updateLayout);
        }

        // Install scrolling handler
        var headerScrolledTo = 0;
        var onScroll = function()
        {
            var scrollTo = this.scrollLeft;
            if (scrollTo != headerScrolledTo)
            {
                header[0].style.left = -scrollTo + 'px';
                headerScrolledTo = scrollTo;
            }
        };


        /*** CSS STYLE MANIPULATION ***/

        var css;
        var rowStyle;
        var handleStyle;
        var ghostStyle;
        var cellStyle;
        var groupHeaderStyle;
        var handleClass;
        var ghostClass;
        var colStyles = [];
        var colClasses = [];

        // Add a CSS rule.  This creates an empty rule and returns it.  We then
        // dynamically update the rule values as needed.
        var addRule = function(selector)
        {
            // Add the rule
            var rules = css.cssRules || css.rules;
            css.insertRule ? css.insertRule(selector + " {}", rules.length)
                : css.addRule(selector, null, rules.length);
            rules = css.cssRules || css.rules;

            // Find the new rule
            selector = selector.toLowerCase();
            for (var i = 0; i < rules.length; i++)
            {
                if (rules[i].selectorText.toLowerCase() == selector)
                {
                    return rules[i];
                }
            }

            // Shouldn't get here
            return null;
        };

        // Initialize CSS for the current column set
        var initCSS = function()
        {
            var cnt = columns.length;
            var ruleClass;
            while (colStyles.length < cnt)
            {
                colClasses.push(ruleClass = id + '-c' + colStyles.length);
                var style = addRule("." + ruleClass).style;
                colStyles.push(style);
            }
        };

        // Initialize my stylesheet
        (function() {
            var rulesNode = $('head')
                .append('<style type="text/css" id="' + id + '-styles"></style>')
                .children('#' + id + '-styles')[0];
            for (var i = 0; i < document.styleSheets.length; i++) {
                css = document.styleSheets[i];
                if ((css.ownerNode || css.owningElement) == rulesNode)
                    break;
            }
            handleClass = id + "-handle";
            ghostClass = id + "-ghost";

            // Dynamic style applied to the handle
            handleStyle = addRule("." + handleClass).style;

            // Dynamic style applied to the handle
            ghostStyle = addRule("." + ghostClass).style;

            // Dynamic style applied to rows
            rowStyle = addRule("#" + id + " .blist-tr").style;

            // Dynamic style available to cell renderers to fill height properly
            cellStyle = addRule("#" + id + " .blist-cell").style;

            // Dynamic style applied to "special" row cells
            groupHeaderStyle = addRule("#" + id + " .blist-td-header").style;
        })();


        /*** COLUMNS ***/

        // Internal representation of visible columns in the model
        var columns = [];
        var variableColumns = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var rowRenderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var handleDigits;
        var paddingX;
        var handleOuterWidth;
        var handleWidth;

        var varMinWidth;

        /**
         * Initialize based on current model metadata.
         */
        var initMeta = function(model)
        {
            // Create an object for each column
            columns = [];
            variableColumns = [];
            varMinWidth = 0;
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++)
            {
                var mcol = mcols[i];
                var modCol = $.extend(true, {
                    index: columns.length
                }, mcol);
                if (modCol.hasOwnProperty('percentWidth'))
                {
                    if (modCol.minWidth)
                    {
                        varMinWidth += modCol.minWidth;
                    }
                    modCol.width = 0;
                    variableColumns.push(modCol);
                }
                else if (!modCol.hasOwnProperty('width'))
                {
                    modCol.width = 100;
                }
                columns.push(modCol);
            }
            if (variableColumns.length < 1 && options.showGhostColumn)
            {
                variableColumns.push({percentWidth: 100,
                    minWidth: options.ghostMinWidth,
                    ghostColumn: true});
                varMinWidth += options.ghostMinWidth;
            }
            else
            {
                options.showGhostColumn = false;
            }

            // Ensure CSS styles are initialized
            initCSS();

            // Measure width of the handle and height and width of the cell
            handleDigits = calculateHandleDigits(model);
            measureUtilDOM.innerHTML = '<div class="blist-td">x</div>';
            var $measureDiv = $(measureUtilDOM.firstChild);
            var measuredInnerDims = { width: $measureDiv.width(),
                height: $measureDiv.height() };
            var measuredOuterDims = { width: $measureDiv.outerWidth(),
                height: $measureDiv.outerHeight() };

            // Record the amount of padding and border in a table cell
            paddingX = measuredOuterDims.width - measuredInnerDims.width;

            // Row positioning information
            rowHeight = measuredInnerDims.height;
            rowOffset = measuredOuterDims.height;
            rowStyle.height = rowOffset + 'px';

            // Update the handle style with proper dimensions
            var dummyHandleText = Math.max(model.rows().length, 100);
            measureUtilDOM.innerHTML = '<div class="blist-table-handle">' +
                dummyHandleText + '</div>';
            var $measureHandle = $(measureUtilDOM.firstChild);
            handleOuterWidth = $measureHandle.outerWidth();
            handleWidth = $measureHandle.width();
            if (options.generateHeights && options.showRowNumbers)
            {
                handleStyle.height = rowHeight + 'px';
            }
            if (options.generateHeights && options.showGhostColumn)
            {
                ghostStyle.height = rowHeight + 'px';
            }
            handleStyle.width = handleWidth + 'px';
            if (options.generateHeights)
            {
                cellStyle.height = rowHeight + 'px';
            }

            // These variables are available to the rendering function
            var contextVariables = {
                renderSpecial: function(specialRow) {
                    return "<div class='blist-td blist-td-header'>" +
                        specialRow.title + "</div>";
                }
            };

            // Create default column rendering
            var columnParts = [];
            // Count the ghost column padding
            var pos = 0;
            if (options.showRowNumbers)
            {
                pos += handleOuterWidth;
            }
            for (i = 0; i < columns.length; i++)
            {
                // Initialize the column's style
                var col = columns[i];
                col.left = pos;
                colStyles[i].width = columns[i].width + 'px';
                if (options.generateHeights)
                {
                    colStyles[i].height = rowHeight + 'px';
                }
                pos += columns[i].width + paddingX;

                // Add rendering information to the rendering function
                var type = blist.data.types[col.type] || blist.data.types.text;
                var renderer = type.renderGen("row[" + col.dataIndexExpr + "]",
                    col, contextVariables);
                var cls = col.cls || type.cls;
                cls = cls ? ' blist-td-' + cls : '';
                columnParts.push(
                    "\"<div class='blist-td " + colClasses[i] + cls + "'>\", " +
                        renderer + ", \"</div>\""
                );
            }
            if (options.showGhostColumn)
            {
                pos += paddingX;
            }

            // Create the rendering function.  We precompile this for speed so
            // we can avoid tight loops, function calls, etc.
            var renderFnSource =
                '(function(html, index, row) {' +
                    'html.push(' +
                        '"<div id=\'' + id + '-r", ' +
                        '(row.id || row[0]), ' +
                        '"\' class=\'blist-tr", ' +
                        '(index % 2 ? " blist-tr-even" : ""), ' +
                        '"\' style=\'top: ", ' +
                        '(index * ' + rowOffset + '), "px\'>"';
            if (options.showRowNumbers)
            {
                renderFnSource += ', "<div class=\'blist-table-handle '
                    + handleClass + '\'>", (index + 1), "</div>"';
            }
            renderFnSource += ');' +
                    'if (row._special) ' +
                        'html.push(renderSpecial(row)); ' +
                    'else ' +
                        'html.push(' + columnParts.join(',') + '); ';
            if (options.showGhostColumn)
            {
                renderFnSource += 'html.push("<div class=\'blist-td ' +
                    ghostClass + ' blist-table-ghost\'></div>");';
            }
            renderFnSource += 'html.push("</div>");' +
                '})';
            rowRenderFn = blist.data.types.compile(renderFnSource,
                contextVariables);

            // Set the scrolling area width
            header.width(pos);
            inside.width(pos);
            ghostStyle.width = 0;

            // Configure the group header style
            groupHeaderStyle.left = handleOuterWidth + 'px';
            groupHeaderStyle.width = Math.max(0,
                (pos - handleOuterWidth - paddingX)) + 'px';

            // Set the title of the table
            if ($nameLabel)
            {
                $nameLabel.html(model.title());
            }

            // Set up data for existing sort
            if (model.meta().sort)
            {
                var s = model.meta().sort;
                sortDescending = !s.ascending;
                $.each(columns, function (i, c)
                {
                    if (s.column.dataIndex == c.dataIndex)
                    {
                        sortBy = i;
                        return false;
                    }
                });
            }
        };

        /**
         * Create column header elements for the current row configuration and
         * install event handlers.
         */
        var renderHeader = function()
        {
            var html = [];
            if (options.showRowNumbers)
            {
                html.push('<div class="blist-th blist-table-corner ',
                    handleClass, '"></div>');
            }
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                var cls = col.cls ? ' blist-th-' + col.cls : '';
                html.push(
                    '<div class="blist-th ',
                    !i ? 'blist-th-first ' : '',
                    col.type + ' ',
                    colClasses[i],
                    cls,
                    '" title="',
                    col.name == null ? '' : escape(col.name),
                    '">',
                    '<span class="blist-th-icon"></span>',
                    '<span class="blist-th-name">',
                    col.name == null ? '' : escape(col.name),
                    '</span>',
                    '<div class="sort sort-desc" title="Sort ascending"',
                    options.generateHeights ? ' style="height: ' +
                        rowOffset + 'px"' : '',
                    '></div>',
                    '</div>'
                );
            }
            if (options.showGhostColumn)
            {
                html.push('<div class="blist-th blist-table-ghost ',
                    columns.length < 1 ? 'blist-th-first ' : '',
                    ghostClass, '"></div>');
            }
            header.html(html.join(''));

            $(".blist-th", header).each(function(index)
            {
                if (!index && options.showRowNumbers)
                {
                    // Skip the header handle
                    return;
                }
                if (options.showRowNumbers)
                {
                    index -= 1;
                }
                if (index >= columns.length)
                {
                    // Skip the ghost column
                    return;
                }
                columns[index].dom = this;
                $(this).click(function()
                    {
                        $(this).removeClass('hover');
                        sort(index);
                    })
                    .hover(function () { $(this).addClass('hover') },
                        function () { $(this).removeClass('hover') });
            });


            // Render sort header
            configureSortHeader();

            var handleResize = function(event, ui)
            {
                // Find the column object
                var drag = $(this).data('drag');

                // Constrain left-drag to container width
                var position = ui.position;
                if (position.left < drag.col.left + 5)
                    position.left = drag.col.left + 5;

                // Compute the delta from the original position
                var delta = drag.delta = ui.position.left - drag.originalSizerLeft;

                // Update container sizes
                header.width(drag.originalInsideWidth + delta);
                inside.width(drag.originalInsideWidth + delta);

                // Update the column style
                drag.col.width = drag.originalColWidth + delta;
                if (drag.col.percentWidth)
                {
                    variableColumns.splice($.inArray(drag.col,
                        variableColumns), 1);
                    drag.col.percentWidth = null;
                }
                colStyles[drag.col.index].width = drag.col.width + 'px';

                adjustVariableColumns();
            };

            // Create column sizers
            for (i = 0; i < columns.length; i++)
            {
                col = columns[i];
                var sizer = col.sizer = document.createElement('div');
                sizer.className = 'blist-th-sizer';
                sizer.innerHTML = '&nbsp;'
                header[0].appendChild(sizer);
                col.sizerLeft = col.left + col.width + paddingX -
                    options.resizeHandleAdjust;
                sizer.style.left = col.sizerLeft + 'px';
                $(sizer)
                    .data('col', col)
                    .draggable({
                        axis: 'x',

                        start: function(event, ui) {
                            // Record original position information used to
                            // update drag position
                            var col = $(this).data('col');
                            $(this).data('drag', {
                                col: col,
                                originalColWidth: col.width ||
                                    parseFloat(colStyles[col.index].width),
                                originalSizerLeft: col.sizerLeft,
                                originalInsideWidth: inside.width()
                            })
                        },

                        drag: handleResize,

                        stop: function(event, ui) {
                            handleResize.call(this, event, ui);

                            // Everything is up-to-date now but size handles
                            // and column.left to the right; take care of these
                            // now
                            var drag = $(this).data('drag');
                            drag.col.sizerLeft = drag.col.left + drag.col.width
                                + paddingX - options.resizeHandleAdjust;
                            for (var i = drag.col.index + 1; i < columns.length;
                                i++)
                            {
                                var otherCol = columns[i];
                                otherCol.left += drag.delta;
                                otherCol.sizerLeft += drag.delta;
                                otherCol.sizer.style.left =
                                    otherCol.sizerLeft + 'px';
                            }

                            adjustVariableColumns();

                            $(this).removeData('drag');
                        }
                });
            }
        }


        /*** ROWS ***/

        var renderedRows = {};
        var dirtyRows = {};
        var rowLoadTimer = null;
        var rowLoadRows = null;

        var appendRows = function(html) {
            // These functions only exist for profiling purposes.  We call this relatively infrequently so it's OK to
            // leave these in for production purposes.
            var appendRows_render = function() {
                appendUtilDOM.innerHTML = html;
            };
            var appendRows_append = function() {
                while (appendUtilDOM.firstChild) {
                    var row = appendUtilDOM.firstChild;
                    var rowID = row.id.substring(id.length + 2); // + 2 for "-r" suffix prior to row ID
                    renderedRows[rowID] = row;
                    if (dirtyRows[rowID]) {
                        insideDOM.replaceChild(row, dirtyRows[rowID]);
                        delete dirtyRows[rowID];
                    } else
                        insideDOM.appendChild(row);
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
        }

        /**
         * Render all rows that should be visible but are not yet rendered.  Removes invisible rows.
         */
        var renderRows = function() {
            if (!model)
                return;
            
            var top = scrolls.scrollTop();

            // Compute the first row to render
            var first = Math.floor(top / rowOffset);

            // Compute the number of (possibly partially) visible rows
            var count = Math.ceil((top - (first * rowOffset) + scrolls.height()) / rowOffset) + 1;

            // Determine the range of rows we need to render, with safety checks to be sure we don't attempt the
            // impossible
            var start = first;
            var stop = start + count * 1.5;
            var rows = model.rows();
            if (start < 0)
                start = 0;
            if (rows) {
                if (stop > rows.length)
                    stop = rows.length;
            } else if (stop > 0)
                stop = 0;

            // Render the rows that are newly visible
            var unusedRows = $.extend({}, renderedRows);
            var html = [];
            var rowsToLoad = [];
            for (var i = start; i < stop; i++) {
                var row = rows[i];
                if (typeof row == 'object') {
                    // Loaded row -- render immediately
                    var rowID = row.id || row[0];
                    if (unusedRows[rowID])
                        // Keep the existing row
                        delete unusedRows[rowID];
                    else
                        // Add a new row
                        rowRenderFn(html, i, row);
                } else
                    // Unloaded row -- record for load request
                    rowsToLoad.push(row);
            }
            appendRows(html.join(''));

            // Destroy the rows that are no longer visible
            for (var unusedID in unusedRows) {
                row = unusedRows[unusedID];
                row.parentNode.removeChild(row);
                delete renderedRows[unusedID];
            }

            // Bind scroll handlers
            scrolls.unbind("scroll", onScroll);
            scrolls.unbind("scroll", renderRows);
            scrolls.scroll(onScroll);
            scrolls.scroll(renderRows);

            // Load rows that aren't currently present
            if (rowsToLoad.length) {
                if (rowLoadTimer)
                    clearTimeout(rowLoadTimer);
                rowLoadTimer = setTimeout(loadMissingRows, MISSING_ROW_LOAD_DELAY);
                rowLoadRows = rowsToLoad;
            }
        }

        var loadMissingRows = function() {
            if (!rowLoadTimer)
                return;
            rowLoadTimer = null;
            if (!rowLoadRows)
                return;
            model.loadRows(rowLoadRows);
            rowLoadRows = null;
        }

        /**
         * Initialize the row container for the current row set.
         */
        var initRows = function(model)
        {
            if (handleDigits != calculateHandleDigits(model)) {
                // The handle changed.  Reinitialize columns.
                initMeta(model);
                renderHeader();
            }
            inside.height(rowOffset * model.rows().length);

            inside.empty();
            renderedRows = {};

            updateLayout();
        };

        /**
         * Re-render a set of rows (if visible).
         */
        var updateRows = function(rows) {
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var rowID = row.id || row[0];
                var rendered = renderedRows[rowID];
                if (rendered) {
                    delete renderedRows[rowID];
                    dirtyRows[rowID] = rendered;
                }
            }
            updateLayout();
        }


        /*** MODEL ***/

        // Monitor model events
        $this.bind('meta_change', function(event, model) {
            initMeta(model);
            renderHeader();
        });
        $this.bind('before_load', function() {
            outside.addClass('blist-loading');
        });
        $this.bind('load', function(event, model) {
            initRows(model);
        });
        $this.bind('after_load', function() {
            outside.removeClass('blist-loading');
        });
        $this.bind('row_change', function(event, rows) {
            updateRows(rows);
        });

        // Install the model
        var model = $this.blistModel(options.model);


        /*** STARTUP ***/

        updateLayout();
    }

    var blistTableDefaults = {
        generateHeights: true,
        ghostMinWidth: 20,
        manualResize: false,
        resizeHandleAdjust: 3,
        showGhostColumn: false,
        showName: true,
        showRowNumbers: true,
        showTitle: true
    };

    $.fn.extend({
        /**
         * Make an element into a Blist Table.
         */
        blistTable: function(options) {
            // Create the table
            return this.each(function() {
                makeTable.apply(this,
                    [ $.extend({}, blistTableDefaults, options) ]);
            });
        }
    });
})(jQuery);
