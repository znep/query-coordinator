/**
 * This file implements the Blist table control.  This control offers an interactive presentation of tabular data to
 * the user.
 *
 * The table renders data contained within a Blist "model" class.  The table uses the model associated with its root
 * DOM node.
 *
 * Most events triggered by the table are managed by the model class.  Events supported directly by the table are:
 *
 * <ul>
 *   <li>cellclick - fired whenever the user clicks a cell and the table does not perform a default action</li>
 *   <li>table_click - fired when the mouse is clicked within the table and the table does not fire a default
 *      action</li>
 * </ul>
 *
 * Implementation note: We process mouse up and mouse down events manually.  We treat some mouse events differently
 * regardless of the element on which they occur.  For example, a mouse down within a few pixels of a column heading
 * border is a resize, but the mouse may in fact be over a control.  Because of this and the fact that you can't
 * cancel click events in mouseup handlers we generally can't use the browser's built in "click" event.  Instead the
 * table fires a "table_click" event.  You should be able to use this anywhere you would instead handle "click".
 */

(function($)
{
    // Milliseconds to delay before expanding a cell's content
    var EXPAND_DELAY = 100;

    // Milliseconds in which expansion should occur
    var EXPAND_DURATION = 200;

    // Millisecond delay before loading missing rows
    var MISSING_ROW_LOAD_DELAY = 100;

    // Minimum size for a column (pixels)
    var MINIMUM_HEADER_SIZE = 10;

    var nextTableID = 1;

    // HTML escaping utility
    var htmlEscape = function(text)
    {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    // Make a DOM element into a table
    var makeTable = function(options)
    {
        var model;

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
            $('.sort.active', $header)
                .removeClass('sort-asc').addClass('sort-desc')
                .attr('title', 'Sort ascending')
                .removeClass('active')
                .parent().removeClass('sorted');
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
                    .addClass('active')
                    .parent().addClass('sorted');
            }
        };

        var configureFilterHeaders = function()
        {
            $('.filter.active', $header).removeClass('active');
            var colFilters = model.meta().columnFilters;
            if (colFilters != null)
            {
                $.each(columns, function (i, c)
                {
                    if (colFilters[c.dataIndex] != null)
                    {
                        $('.filter', c.dom).addClass('active');
                    }
                });
            }
        };

        // Filter data
        var applyFilter = function()
        {
            setTimeout(function() {
                var searchText = $filterBox[0].value;
                model.filter(searchText, 250);
                if (!searchText || searchText == '')
                {
                    $filterClear.hide();
                }
                else
                {
                    $filterClear.show();
                }
            }, 10);
        }

        var clearFilter = function(e)
        {
            e.preventDefault();
            $filterBox.val('').blur();
            $filterClear.hide();
            model.filter('');
        }

        // Obtain a model column associated with a column header DOM node
        var getColumnForHeader = function(e) {
            return model.getColumn(e.getAttribute('uid'));
        }


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
            if (options.noExpand) return;

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
            var maxWidth = Math.floor($scrolls.width() * .5);
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
            var viewportWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
                viewportWidth -= scrollbarWidth;
            var scrollLeft = $scrolls.scrollLeft();
            if (rc.left + rc.width > scrollLeft + viewportWidth)
                rc.left = scrollLeft + viewportWidth - rc.width;
            if (rc.left < scrollLeft)
                rc.left = scrollLeft;

            // Ensure viewport is in the window vertically
            var viewportHeight = $scrolls.height();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
                viewportHeight -= scrollbarWidth;
            var scrollTop = $scrolls.scrollTop();
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


        /*** MOUSE HANDLING ***/

        // Handle mouse movement within the inside (cell) area
        var hotCell;
        var hotRowID;
        var hotCellTimer;
        var hotHeader;
        var hotHeaderMode; // 1 = hover, 2 = resize, 3 = control hover
        var hotHeaderDrag;
        var dragFrom;
        var dragHeaderLeft;
        var clickTarget;

        var findContainer = function(event, selector)
        {
            var $container;
            // Firefox will sometimes return a XULElement for relatedTarget
            //  Catch the error when trying to access anything on it, and ignore
            try
            {
                $container = $(event.type == "mouseout" ?
                    event.relatedTarget : event.target);
            }
            catch (ignore) {}
            if (!$container)
            {
                return null;
            }
            if (!$container.is(selector))
            {
                $container = $container.closest(selector);
                if (!$container.length)
                {
                    return null;
                }
            }
            return $container[0];
        }

        var findCell = function(event)
        {
            var cell = findContainer(event, '.blist-td, .blist-expander');
            if (cell && (cell == hotExpander || cell.parentNode == hotExpander))
            {
                return hotCell;
            }
            return cell;
        }

        var handleHeaderHover = function(event) {
            var container = findContainer(event, '.blist-tr, .blist-table-header');
            if (!container)
                return false;

            var x = event.clientX;
            var hh, hhm;
            var $headers = $('.blist-th:not(.blist-table-ghost), .blist-tdh',
                container);
            $headers.each(function(i) {
                var header = $(this);
                var left = header.offset().left;
                if (left > x)
                    return false;
                var width = header.outerWidth();
                var right = left + width;

                var isCtl = header.is('.blist-opener');
                var isSizable = !isCtl && !header.is('.nested_table') &&
                    !(options.disableLastColumnResize &&
                        (i == ($headers.length - 1)));

                if (isSizable && x >= right - options.resizeHandleAdjust && x < right + options.resizeHandleAdjust) {
                    hh = header[0];
                    hhm = 2;
                    dragHeaderLeft = left;
                    return false;
                }

                if (x >= left && x < right) {
                    hh = header[0];
                    hhm = isCtl ? 3 : 1;
                    return false;
                }
            });

            // TODO -- remove "hhm != 1" when column moving is implemented
            if (hh && hhm != 1) {
                if (hh != hotHeader || hhm != hotHeaderMode) {
                    hotHeader = hh;
                    hotHeaderMode = hhm;
                    if (hotHeaderMode == 2)
                        $outside.css('cursor', 'col-resize');
                    else
                        $outside.css('cursor', 'pointer');
                }
                return true;
            }

            return false;
        }

        var handleColumnResize = function(event) {
            var width = event.clientX - dragHeaderLeft - paddingX;
            if (width < MINIMUM_HEADER_SIZE)
                width = MINIMUM_HEADER_SIZE;
            var col = getColumnForHeader(hotHeader);
            if (col.hasOwnProperty('percentWidth'))
            {
                varDenom[0] -= col.percentWidth;
                delete col.percentWidth;
                variableColumns[0] = $.grep(variableColumns[0], function (c, i)
                    { return c.dataIndex == col.dataIndex; }, true);
                if (col.minWidth)
                {
                    varMinWidth[0] -= col.minWidth;
                }
            }
            col.width = width;
            model.colWidthChange();
        }

        var handleColumnMove = function(event) {
            var delta = { x: event.clientX - dragFrom.x, y: event.clientY - dragFrom.y };

            // TODO -- implement column dragging support...
        }

        var unHotRow = function(rowID)
        {
            inside.find('#' + id + '-r' + rowID)
                .removeClass('blist-hot-row');
            $locked.find('#' + id + '-l' + rowID)
                .removeClass('blist-hot-row');
        };

        var onMouseMove = function(event)
        {
            if (hotHeaderDrag)
                if (hotHeaderMode == 1) {
                    handleColumnMove(event);
                    return;
                } else if (hotHeaderMode == 2) {
                    handleColumnResize(event);
                    return;
                }

            if (handleHeaderHover(event)) {
                if (hotCell)
                    onCellOut(event);
                return;
            }
            if (hotHeader) {
                hotHeader = null;
                $outside.css('cursor', 'auto');
            }

            // Locate the cell the mouse is in, if any
            var over = findCell(event);
            
            // If the hover cell is currently hot, nothing to do
            if (over == hotCell)
            {
                return;
            }

            // Update row hover state
            // + 2 for "-r"/"-l" suffix prior to row ID
            var $nhr = $(over).closest('.blist-tr');
            var newHotID = $nhr.length > 0 ?
                $nhr.attr('id').substring(id.length + 2) : null;
            if (newHotID != hotRowID)
            {
                if (hotRowID)
                {
                    unHotRow(hotRowID);
                }
                if (newHotID)
                {
                    inside.find('#' + id + '-r' + newHotID)
                        .addClass('blist-hot-row');
                    $locked.find('#' + id + '-l' + newHotID)
                        .addClass('blist-hot-row');
                }
                hotRowID = newHotID;
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
                if (options.cellExpandEnabled)
                {
                    hotCellTimer = setTimeout(expandHotCell, EXPAND_DELAY);
                }
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
                if (hotRowID)
                {
                    var $nhr = $(to).closest('.blist-tr');
                    var newHotID = $nhr.length > 0 ?
                        $nhr.attr('id').substring(id.length + 2) : null;
                    if (newHotID != hotRowID)
                    {
                        unHotRow(hotRowID);
                    }
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

        var onCellClick = function(event, origEvent)
        {
            var cell = findCell(event);
            if (cell)
            {
                // Retrieve the row
                var rowDOM = cell.parentNode;
                // + 2 for "-r"/"-l" suffix prior to row ID
                var rowID = rowDOM.id.substring(id.length + 2);
                var row = model.getByID(rowID);

                // If this is a row opener, invoke expand on the model
                if ($(cell).hasClass('blist-opener'))
                    model.expand(row);

                // Retrieve the column
                // The cell will have a class like 'tableId-c4'; we need to
                //  extra the part after the tableId-c, which is the uid of
                //  the column that can be looked up
                var classIndex = cell.className.indexOf(id + '-c');
                var colUID = cell.className.slice(classIndex + id.length + 2,
                    cell.className.indexOf(' ', classIndex));
                var column = model.getColumn(colUID);

                // Notify listeners
                var cellEvent = $.Event('cellclick');
                $this.trigger(cellEvent, [ row, column, event ]);
                if (!cellEvent.isDefaultPrevented() && !(row.level < 0))
                {
                    if (origEvent.metaKey) // ctrl/cmd key
                    {
                        model.toggleSelectRow(row);
                    }
                    else if (origEvent.shiftKey)
                    {
                        model.selectRowsTo(row);
                    }
                    else
                    {
                        model.selectSingleRow(row);
                    }
                    unHotRow(rowID);
                    // Set the focus so that the shift/meta click won't select
                    // any text.
                    $this.focus();
                }
            }
        };

        var onMouseDown = function(event) {
            if (hotHeader && hotHeaderMode != 3) {
                clickTarget = null;
                hotHeaderDrag = true;
                dragFrom = { x: event.clientX, y: event.clientY };
                event.stopPropagation();
                event.preventDefault();
                return false;
            }
            clickTarget = event.target;
        }

        var onMouseUp = function(event) {
            if (hotHeaderDrag) {
                hotHeaderDrag = false;
                onMouseMove(event);
                event.stopPropagation();
                event.preventDefault();
                return true;
            }
            if (clickTarget && clickTarget == event.target &&
                !$(clickTarget).is('a'))
                $(clickTarget).trigger('table_click', event);
        }
        
        if (options.simpleCellExpand)
        {
            $('.blist-td:not(.blist-td-popout)').live('mouseover', function (event)
            {
                var $this = $(this);

                var innerContentWidth = 0;
                $this.children().each(function() { innerContentWidth += $(this).outerWidth(true); });

                if (innerContentWidth <= $this.innerWidth())
                    return;

                var offsetPos = $this.offset();
                offsetPos.top += $this.offsetParent().scrollTop();

                var $copy = $this.clone();
                $copy
                    .addClass('blist-td-popout')
                    .css('left', offsetPos.left)
                    .css('top', offsetPos.top)
                    .mouseleave(function (event)
                    {
                        $(this).fadeOut('fast', function() {
                            $(this).remove();
                        });
                    })
                    .fadeIn();
                $(document.body).append($copy);
            });
        }


        /*** HTML RENDERING ***/

        var headerStr =
            '<div class="blist-table-locked-scrolls">\
                <div class="blist-table-locked-header">&nbsp;</div>\
                <div class="blist-table-locked">&nbsp;</div>\
                <div class="blist-table-locked-footer">&nbsp;</div>\
            </div>\
            <div class="blist-table-top">';
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
            <div class="blist-table-footer-scrolls">\
                <div class="blist-table-footer">&nbsp;</div>\
            </div>\
            <div class="blist-table-util"></div>';

        $(document)
            .mouseup(onMouseUp);

        // Render container elements
        var $outside = $this
            .addClass('blist-table')
            .mousedown(onMouseDown)
            .mousemove(onMouseMove)
            .html(headerStr);

        var $lockedScrolls = $outside.find('.blist-table-locked-scrolls');
        var $lockedHeader = $lockedScrolls.find('.blist-table-locked-header');
        var $locked = $lockedScrolls.find('.blist-table-locked')
            .bind('table_click', onCellClick);
        var $lockedFooter = $lockedScrolls.find('.blist-table-locked-footer');

        // The top area
        var $top = $outside.find('.blist-table-top');

        var $title;
        var $nameLabel;
        var $filterBox;
        var $filterClear;
        if (options.showTitle)
        {
            // The title bar
            $title = $top.find('.blist-table-title');
            $nameLabel = $title.find('.blist-table-name');
            $filterBox = $title
                .find('.blist-table-filter')
                .keydown(applyFilter)
                .change(applyFilter)
                .example('Find');
            $filterClear = $title.find('.blist-table-clear-filter')
                .bind('click', clearFilter).hide();
        }

        // The table header elements
        var $headerScrolls = $top
            .find('.blist-table-header-scrolls');
        var $header = $headerScrolls
            .find('.blist-table-header')

        // The scrolling container
        var $scrolls = $outside
            .find('.blist-table-scrolls')
            .scroll(function () {onScroll(); renderRows();});


        // The non-scrolling row container
        var inside = $scrolls
            .find('.blist-table-inside')
            .mouseout(onCellOut)
            .bind('table_click', onCellClick);
        var insideDOM = inside[0];

        // Footer pieces
        var $footerScrolls = $outside.find('.blist-table-footer-scrolls');
        var $footer = $footerScrolls.find('.blist-table-footer');

        // These utility nodes are used to append rows and measure cell text,
        // respectively
        var appendUtil = $(document.createElement('div'));
        var appendUtilDOM = appendUtil[0];

        var measureUtil = $outside
            .find('.blist-table-util');
        var measureUtilDOM = measureUtil[0];

        // Set up initial top of locked section
        $locked.css('top', $header.outerHeight());

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
            $headerScrolls.height($header.outerHeight());

            // Size the scrolling area.  TODO - change to absolute positioning
            // when IE6 is officially dead (June 2010?)
            $scrolls.height($outside.height() - $top.outerHeight() -
                ($scrolls.outerHeight() - $scrolls.height()) - 1);
            $scrolls.width($outside.width() -
                ($scrolls.outerWidth() - $scrolls.width()));

            // Size the inside row container
            var insideHeight = model ? rowOffset * model.rows().length : 0;
            var scrollsHeight = $scrolls[0].clientHeight;
            if ($footerScrolls.is(':visible'))
                insideHeight += $footerScrolls.outerHeight() - 1;
            if (insideHeight < scrollsHeight)
                insideHeight = scrollsHeight;
            inside.height(insideHeight);
            $locked.height(insideHeight);

            renderRows();
            configureWidths();

            // Move footer up to bottom, or just above the scrollbar
            var lockedBottom = parseFloat($scrolls.css('border-bottom-width')) + 1;
            var footerBottom = parseFloat($scrolls.css('border-bottom-width')) +
                $footerScrolls.outerHeight();
            if ($scrolls[0].scrollWidth > $scrolls[0].clientWidth)
            {
                lockedBottom += scrollbarWidth;
                footerBottom += scrollbarWidth;
            }
            $lockedScrolls.css('bottom', lockedBottom);
            $footerScrolls.css('bottom', footerBottom);

            // Adjust the margin footer for the scrollbar if necessary
            // Adjusting the width directly caused Safari to lose scrolling
            //  events after resizing the browser window a few times, and making
            //  the grid vertical scrollbar go from on->off->on
            var marginR = $scrolls.outerHeight() - $scrolls.height();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            {
                marginR += scrollbarWidth;
            }
            $footerScrolls.css('margin-right', marginR);
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
        var rowsScrolledTo = 0;
        var onScroll = function()
        {
            var scrollHoriz = $scrolls[0].scrollLeft;
            if (scrollHoriz != headerScrolledTo)
            {
                $header[0].style.left = -scrollHoriz + 'px';
                $footer[0].style.left = -scrollHoriz + 'px';
                headerScrolledTo = scrollHoriz;
            }

            var scrollVert = $scrolls[0].scrollTop;
            if (scrollVert != rowsScrolledTo)
            {
                $locked.css('top', $header.outerHeight() - scrollVert);
                rowsScrolledTo = scrollVert;
            }
        };


        /*** CSS STYLE MANIPULATION ***/

        var css;
        var rowStyle;
        var unlockedRowStyle;
        var ghostStyle;
        var openerStyle;
        var cellStyle;
        var groupHeaderStyle;
        var ghostClass;
        var openerClass;

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

        // Obtain a CSS class for a column
        var getColumnClass = function(column) {
            return id + '-c' + column.uid;
        };

        // Obtain a CSS style for a column
        var colStyles = [];
        var getColumnStyle = function(column) {
            return colStyles[column.uid] || (colStyles[column.uid] = addRule('.' + getColumnClass(column)).style);
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
            ghostClass = id + "-ghost";
            openerClass = id + "-opener";

            // Dynamic style applied to the ghost column
            ghostStyle = addRule("." + ghostClass).style;

            // Dynamic style applied to nested table openers
            openerStyle = addRule("." + openerClass).style;

            // Dynamic style applied to rows
            rowStyle = addRule("#" + id + " .blist-tr").style;
            unlockedRowStyle =
                addRule("#" + id + " .blist-table-inside .blist-tr").style;

            // Dynamic style available to cell renderers to fill height properly
            cellStyle = addRule("#" + id + " .blist-cell").style;

            // Dynamic style applied to "special" row cells
            groupHeaderStyle = addRule("#" + id + " .blist-td-header").style;
        })();


        /*** COLUMNS ***/

        // Internal representation of visible top-level columns in the model
        var columns = [];
        var lockedColumns = [];
        var variableColumns = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var rowRenderFn;
        var rowLockedRenderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var handleDigits;
        var paddingX;
        var lockedWidth;
        var openerWidth;
        var varMinWidth = [];
        var varDenom = [];
        var insideWidth;

        /**
         * Create rendering code for a series of columns.
         */
        var createColumnRendering = function(mcols, contextVariables, prefix) {
            var colParts = [];
            var generatedCode = '';
            if (prefix)
                colParts.push(prefix);

            // Utility function that writes a push for all column parts
            var completeStatement = function() {
                if (colParts.length) {
                    generatedCode += 'html.push(' + colParts.join(',') + ');';
                    colParts = [];
                }
            }

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];

                if (mcol.body) {
                    // Nested table header -- render headers for child columns
                    completeStatement();

                    generatedCode +=
                        "if (row" + mcol.dataLookupExpr + " && row" + mcol.dataLookupExpr + ".length)";
                    colParts.push("\"<div class='blist-td blist-tdh blist-opener " + openerClass + "'></div>\"");
                    var children = mcol.body.children;
                    for (var k = 0; k < children.length; k++) {
                        var child = children[k];
                        colParts.push(
                            "\"<div class='blist-td blist-tdh " +
                            getColumnClass(child) +
                            "' uid='" +
                            child.uid +
                            "'>&nbsp;" +
                            htmlEscape(child.name) +
                            "</div>\""
                        );
                    }
                    completeStatement();

                    generatedCode += "else " +
                        "html.push('<div class=\"blist-td " + getColumnClass(mcol) + "\">&nbsp;</div>');";
                } else if (mcol.children) {
                    // Nested table row -- render cells if the row is present or filler if not
                    completeStatement();

                    // Add the code.  If no record is present we add a filler row; otherwise we add the rows.  This is
                    // just getting ridiculous
                    generatedCode +=
                        "if (row" + mcol.header.dataLookupExpr + ") " +
                            createColumnRendering(mcol.children, contextVariables, "'<div class=\"blist-td blist-opener-space " + openerClass + "\"></div>'") +
                        "else " +
                            "html.push('<div class=\"blist-td blist-tdfill " + getColumnClass(mcol.header) + "\">&nbsp;</div>');";
                } else if (mcol.type && mcol.type == 'fill')
                    // Fill column -- covers background for a range of columns that aren't present in this row
                    colParts.push("\"<div class='blist-td blist-tdfill " + getColumnClass(mcol) + "'>&nbsp;</div>\"");
                else {
                    // Standard cell
                    var type = blist.data.types[mcol.type] || blist.data.types.text;
                    var renderer = mcol.renderer || type.renderGen;
                    var cls = mcol.cls || type.cls;
                    cls = cls ? ' blist-td-' + cls : '';

                    renderer = renderer("row" + mcol.dataLookupExpr, mcol,
                        contextVariables);

                    colParts.push(
                        "\"<div class='blist-td " + getColumnClass(mcol) + cls +
                            (j == 0 ? ' blist-td-first' : '') + "'>\", " +
                            renderer + ", \"</div>\""
                    );
                }

                // Initialize column heights (TODO - we don't support variable heights; can we do this on a single
                // style rather than for each column style individually?)
                if (options.generateHeights)
                {
                    getColumnStyle(mcol).height = rowHeight + 'px';
                }
            }

            completeStatement();
            
            return generatedCode;
        }



        /**
         * Initialize based on current model metadata.
         */
        var initMeta = function(newModel)
        {
            model = newModel;

            // Convert the model columns to table columns
            columns = [];
            variableColumns = [];
            varMinWidth = [];
            varDenom = [];

            // Set up variable columns at each level
            for (var j = 0; j < model.meta().columns.length; j++)
            {
                variableColumns[j] = [];
                varMinWidth[j] = 0;
                varDenom[j] = 0.0;
                var mcols = model.meta().columns[j];
                for (var i = 0; i < mcols.length; i++)
                {
                    var mcol = mcols[i];
                    var col = $.extend(false, { index: i }, mcol);
                    if (col.hasOwnProperty('percentWidth'))
                    {
                        varDenom[j] += col.percentWidth;
                        if (col.minWidth)
                        {
                            varMinWidth[j] += col.minWidth;
                        }
                        col.width = 0;
                        variableColumns[j].push(col);
                    }
                    else if (!col.hasOwnProperty('width'))
                    {
                        col.width = 100;
                    }
                    if (j == 0)
                    {
                        columns.push(col);
                    }
                }
            }
            if (variableColumns[0].length < 1 && options.showGhostColumn)
            {
                variableColumns[0].push({percentWidth: 100,
                        minWidth: options.ghostMinWidth,
                        ghostColumn: true});
                varMinWidth[0] += options.ghostMinWidth;
                varDenom[0] += 100;
            }
            else
            {
                options.showGhostColumn = false;
            }

            lockedColumns = [];
            if (options.showRowNumbers)
            {
                lockedColumns.push({uid: 'rowNumberCol',
                    cls: 'blist-table-row-numbers',
                    measureText: Math.max(model.rows().length, 100),
                    renderer: '(index + 1)',
                    footerText: 'Totals'});
            }
            if (options.showRowHandle)
            {
                lockedColumns.push({uid: 'rowHandleCol',
                    cls: 'blist-table-row-handle',
                    width: 1,
                    renderer: '""'});
            }

            handleDigits = calculateHandleDigits(model);

            // Measure width of a default cell and height and width of the cell
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

            // Set row heights
            if (options.generateHeights && options.showGhostColumn)
            {
                ghostStyle.height = rowHeight + 'px';
            }
            if (options.generateHeights)
            {
                cellStyle.height = rowHeight + 'px';
            }

            // Update the locked column styles with proper dimensions
            lockedWidth = 0;
            $.each(lockedColumns, function (i, c)
            {
                measureUtilDOM.innerHTML =
                    '<div class="' + (c.cls || '') + ' ' + getColumnClass(c) +
                    ' blist-td">' + (c.measureText || '') + '</div>';
                var $measureCol = $(measureUtilDOM.firstChild);
                var colStyle = getColumnStyle(c);
                if (c.width)
                {
                    colStyle.width = c.width + 'px';
                }
                else
                {
                    colStyle.width = $measureCol.width() + 'px';
                }
                lockedWidth += $measureCol.outerWidth();
                if (options.generateHeights)
                {
                    colStyle.height = rowHeight + 'px';
                }
            });

            // Record the width of the opener for nested tables
            openerWidth = measuredInnerDims.width * 1.5;
            openerStyle.width = openerWidth + 'px';
            if (options.generateHeights)
                openerStyle.height = rowHeight + 'px';

            // These variables are available to the rendering function
            var contextVariables = {
                renderSpecial: function(specialRow) {
                    return "<div class='blist-td blist-td-header'>" +
                        specialRow.title + "</div>";
                }
            };

            // Create default column rendering
            var levelRender = [];
            for (i = 0; i < model.meta().columns.length; i++)
            {
                mcols = model.meta().columns[i];
                levelRender[i] = createColumnRendering(mcols, contextVariables);
            }

            var rowDivContents =
                'class=\'blist-tr", \
                (index % 2 ? " blist-tr-even" : ""), \
                (row.level != undefined ? " blist-tr-level" + row.level : ""), \
                (row.expanded ? " blist-tr-open" : ""), \
                (row.groupLast ? " last" : ""), \
                "\' style=\'top: ", \
                (index * ' + rowOffset + '), "px\'';
            // Create the rendering function.  We precompile this for speed so
            // we can avoid tight loops, function calls, etc.
            var renderFnSource =
                '(function(html, index, row) {\
                    html.push(\
                        "<div id=\'' + id + '-r", \
                        (row.id || row[0]), \
                        "\' ' + rowDivContents + '>"\
                        );\
                    switch (row.level || 0) {\
                      case -1:\
                        html.push(renderSpecial(row));\
                        break;';
            for (i = 0; i < levelRender.length; i++) {
                renderFnSource += 'case ' + i + ':' +
                    levelRender[i] +
                    'break;';
            }
            renderFnSource += '}';
            if (options.showGhostColumn)
            {
                renderFnSource += 'html.push("<div class=\'blist-td ' +
                    ghostClass + ' blist-table-ghost\'></div>");';
            }
            renderFnSource += 'html.push("</div>");' +
                '})';
            rowRenderFn = blist.data.types.compile(
                renderFnSource, contextVariables);

            var renderLockedFnSource =
                    '(function(html, index, row) {';
            renderLockedFnSource += 'html.push(\
                "<div id=\'' + id + '-l", \
                (row.id || row[0]), \
                "\' ' + rowDivContents + '>");';

            $.each(lockedColumns, function (i, c)
            {
                renderLockedFnSource += 'html.push(\
                    "<div class=\'' + (c.cls || '') + ' blist-td ' +
                        getColumnClass(c) + '\'>", ' +
                        c.renderer + ', \
                        "</div>");';
            });
            renderLockedFnSource += 'html.push("</div>");';
            renderLockedFnSource += '})';
            rowLockedRenderFn = blist.data.types.compile(
                    renderLockedFnSource, contextVariables);

            // Configure the left position of grid rows
            groupHeaderStyle.left = lockedWidth + 'px';
            unlockedRowStyle.left = lockedWidth + 'px';

            $headerScrolls.css('margin-left', lockedWidth);
            $footerScrolls.css('margin-left', lockedWidth);

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

            configureWidths();
        }

        /**
         * Configure column widths.
         */
        var configureWidths = function()
        {
            // Compute the actual width for all columns with static widths
            insideWidth = 0;
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++)
                configureLevelWidths(mcols[i], i);

            // Configure grouping header column widths
            groupHeaderStyle.width = Math.max(0,
                (insideWidth - lockedWidth - paddingX)) + 'px';

            // Set the scrolling area width
            var scrollWidth = $scrolls.width();
            if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
            {
                scrollWidth -= scrollbarWidth;
            }
            var totalWidth = Math.max(insideWidth, scrollWidth);
            $header.width(totalWidth);
            $footer.width(totalWidth);
            inside.width(totalWidth);

            $lockedScrolls.width(lockedWidth);
            $locked.width(lockedWidth);
        }

        var configureLevelWidths = function(mcols, level)
        {
            var hpos = lockedWidth;
            if (level == 0 && options.showGhostColumn)
                hpos += paddingX;

            for (var j = 0; j < mcols.length; j++)
            {
                var mcol = mcols[j];
                var colWidth;

                if (mcol.body)
                {
                    // Nested table header -- set width based on child widths
                    colWidth = openerWidth + paddingX;
                    var children = mcol.body.children;
                    for (var k = 0; k < children.length; k++)
                        colWidth += children[k].width + paddingX;
                }
                else if (mcol.children)
                {
                    // Nested table row -- column width is irrelevant because
                    // the only nested columns are actually rendered into the
                    // DOM, so only compute width for nested children
                    colWidth = null;
                    configureLevelWidths(mcol.children, level);
                }
                else if (mcol.fillFor)
                {
                    // Fill column -- covers background for a range of columns
                    // that aren't present in this row; set width to that of
                    // covered columns
                    colWidth = 0;
                    for (k = 0; k < mcol.fillFor.length; k++) {
                        var fillFor = mcol.fillFor[k];
                        colWidth += (fillFor.width ||
                            parseFloat(getColumnStyle(fillFor).width)) + paddingX;
                    }
                }
                else
                {
                    // Standard cell
                    colWidth = (mcol.width || 0) + paddingX;
                }

                // Initialize the column's style
                if (colWidth)
                {
                    hpos += colWidth;
                    var style = getColumnStyle(mcol);
                    style.width = (colWidth - paddingX) + 'px';
                }
            }

            hpos += varMinWidth[level];

            configureVariableWidths(level, hpos);

            // Expand the inside width if the level is wider
            if (hpos > insideWidth)
                insideWidth = hpos;
        }

        var configureVariableWidths = function(level, levelWidth)
        {
            if (variableColumns[level].length > 0)
            {
                // Start with the total fixed width for this level
                var pos = levelWidth;

                var varSize = $scrolls.width() - pos;
                if ($scrolls[0].scrollHeight > $scrolls[0].clientHeight)
                {
                    varSize -= scrollbarWidth;
                }
                varSize = Math.max(varSize, 0);
                for (i = 0; i < variableColumns[level].length; i++)
                {
                    var c = variableColumns[level][i];
                    if (c.ghostColumn)
                    {
                        ghostStyle.width = (c.minWidth + varSize)  + "px";
                    }
                    else
                    {
                        getColumnStyle(c).width = ((c.minWidth || 0) +
                            ((c.percentWidth / varDenom[level]) * varSize)) + 'px';
                    }
                }

                // If we're not dealing with just the ghost column,
                //  readjust column lefts
                if (level == 0 && !options.showGhostColumn)
                {
                    pos = lockedWidth;
                    for (var i = 0; i < columns.length; i++)
                    {
                        var col = columns[i];
                        col.left = pos;
                        pos += paddingX;
                        pos += col.width || parseFloat(getColumnStyle(col).width);
                    }
                }
            }
        }

        /**
         * Create column header elements for the current row configuration and
         * install event handlers.
         */
        var renderHeader = function()
        {
            var html = [];
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                var cls = col.cls ? ' blist-th-' + col.cls : '';
                var colName = col.name == null ? '' : htmlEscape(col.name);
                html.push(
                    '<div class="blist-th ',
                    !i ? 'blist-th-first ' : '',
                    col.type,
                    ' ',
                    getColumnClass(col),
                    cls,
                    '" title="',
                    colName,
                    '" uid="',
                    col.uid,
                    '">',
                    '<span class="blist-th-icon"></span>',
                    '<span class="blist-th-name">',
                    colName,
                    '</span>');
                html.push('<div class="filter"',
                        options.generateHeights ? ' style="height: ' +
                        rowOffset + 'px"' : '',
                        '></div>');
                html.push(
                        '<div class="sort sort-desc" title="Sort ascending"',
                        options.generateHeights ? ' style="height: ' +
                        rowOffset + 'px"' : '',
                        '></div>');
                html.push('</div>');
            }
            if (options.showGhostColumn)
            {
                html.push('<div class="blist-th blist-table-ghost ',
                    columns.length < 1 ? 'blist-th-first ' : '',
                    ghostClass, '"></div>');
            }
            $header.html(html.join(''));

            $(".blist-th", $header).each(function(index)
            {
                if (index >= columns.length)
                {
                    // Skip the ghost column
                    return;
                }
                columns[index].dom = this;

                $(this)
                    .data('column', columns[index])
                    .bind('table_click', function()
                    {
                        $(this).removeClass('hover');
                        if ((blist.data.types[columns[index].type] != undefined &&
                                blist.data.types[columns[index].type].sortable) ||
                            columns[index].sortable)
                        {
                            sort(index);
                        }
                    })
                    .hover(function () { $(this).addClass('hover') },
                        function () { $(this).removeClass('hover') });

                if (options.headerMods != null)
                {
                    options.headerMods(columns[index]);
                }

            });

            var lockedHtml = '';
            $.each(lockedColumns, function (i, c)
            {
                lockedHtml += '<div class="blist-th ' + (c.cls || '') +
                    ' ' + getColumnClass(c) + '"></div>';
            });
            $lockedHeader.html(lockedHtml);

            // Render sort & filter headers
            configureSortHeader();
            configureFilterHeaders();
        };

        var updateHeader = function (model)
        {
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
            configureSortHeader();
            configureFilterHeaders();
        };

        /**
         * Create column footer elements for the current row configuration
         */
        var renderFooter = function()
        {
            var html = [];
            var showAgg = false;
            var renderColFooter = function (col)
            {
                var cls = col.cls ? ' blist-tf-' + col.cls : '';
                showAgg = showAgg || col.aggregate != undefined;
                // Convert string to float, then clip to desired number of digits;
                //  then convert back to float to strip extra zeros
                var val = col.aggregate ?
                    parseFloat(parseFloat(col.aggregate.value || 0)
                        .toFixed(col.decimalPlaces || 3)) :
                    '';
                html.push(
                    '<div class="blist-tf ',
                    !i ? 'blist-tf-first ' : '',
                    getColumnClass(col),
                    cls,
                    '" title="',
                    col.aggregate ? $.capitalize(col.aggregate.type) : '',
                    '" uid="',
                    col.uid,
                    '">',
                    '<span class="blist-tf-value">',
                    val,
                    '</span></div>');
            };
            for (var i = 0; i < columns.length; i++)
            {
                var col = columns[i];
                if (col.body)
                {
                    // This assumes that columns with children in the body
                    //  fit inside the width of this column, and override any
                    //  parent aggregate
                    html.push(
                        '<div class="blist-tf blist-opener ',
                        id,
                        '-opener"></div>');
                    $.each(col.body.children,
                        function(i, cc) {renderColFooter(cc);});
                }
                else
                {
                    renderColFooter(col);
                }
            }
            if (options.showGhostColumn)
            {
                html.push('<div class="blist-tf blist-table-ghost ',
                    columns.length < 1 ? 'blist-tf-first ' : '',
                    ghostClass, '"></div>');
            }
            if (showAgg)
            {
                $footer.html(html.join(''));
                $footerScrolls.show();
                $lockedFooter.show();
            }
            else
            {
                $footerScrolls.hide();
                $lockedFooter.hide();
            }

            var lockedHtml = '';
            $.each(lockedColumns, function (i, c)
            {
                lockedHtml += '<div class="blist-tf ' + (c.cls || '') +
                    ' ' + getColumnClass(c) + '">' + (c.footerText || '') +
                    '</div>';
            });
            $lockedFooter.html(lockedHtml);
        };

        /*** ROWS ***/

        var renderedRows = {}; // All rows that are rendered, by ID
        var dirtyRows = {}; // Rows that are rendered but need to re-render
        var rowIndices = {}; // Position of rendered rows (triggers re-rendering if a row moves)
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
                    if (!renderedRows[rowID])
                        renderedRows[rowID] = {};
                    renderedRows[rowID].row = row;
                    if (dirtyRows[rowID]) {
                        insideDOM.replaceChild(row, dirtyRows[rowID].row);
                        delete dirtyRows[rowID];
                    } else
                        insideDOM.appendChild(row);
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
        };

        // TODO: This should probably be consolidated with appendRows...
        var appendLockedRows = function(html)
        {
            // These functions only exist for profiling purposes.  We call this
            // relatively infrequently so it's OK to leave these in for
            // production purposes.
            var appendRows_render = function()
            {
                appendUtilDOM.innerHTML = html;
            };
            var appendRows_append = function()
            {
                while (appendUtilDOM.firstChild)
                {
                    var row = appendUtilDOM.firstChild;
                    // + 2 for "-l" suffix prior to row ID
                    var rowID = row.id.substring(id.length + 2);
                    if (!renderedRows[rowID])
                        renderedRows[rowID] = {};
                    renderedRows[rowID].locked = row;
                    if (dirtyRows[rowID])
                        $locked[0].replaceChild(row, dirtyRows[rowID].locked);
                    else
                        $locked[0].appendChild(row);
                }
            };

            // Call the append functions
            appendRows_render();
            appendRows_append();
        };


        /**
         * Render all rows that should be visible but are not yet rendered.  Removes invisible rows.
         */
        var renderRows = function() {
            if (!model)
                return;
            
            var top = $scrolls.scrollTop();

            // Compute the first row to render
            var first = Math.floor(top / rowOffset);

            // Compute the number of (possibly partially) visible rows
            var count = Math.ceil((top - (first * rowOffset) + $scrolls.height()) / rowOffset) + 1;

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
            var lockedHtml = [];
            var rowsToLoad = [];
            for (var i = start; i < stop; i++)
            {
                var row = rows[i];
                if (typeof row == 'object')
                {
                    // Loaded row -- render immediately
                    var rowID = row.id || row[0];
                    if (unusedRows[rowID] && rowIndices[rowID] == i)
                    {
                        // Keep the existing row
                        delete unusedRows[rowID];
                    }
                    else
                    {
                        // Add a new row
                        rowRenderFn(html, i, row);
                        if (rowLockedRenderFn != null)
                            rowLockedRenderFn(lockedHtml, i, row);
                        rowIndices[rowID] = i;
                    }
                }
                else
                {
                    // Unloaded row -- record for load request
                    rowsToLoad.push(row);
                }
            }

            // Destroy the rows that are no longer visible
            for (var unusedID in unusedRows)
            {
                row = unusedRows[unusedID].row;
                row.parentNode.removeChild(row);
                row = unusedRows[unusedID].locked;
                if (row)
                    row.parentNode.removeChild(row);
                delete renderedRows[unusedID];
            }

            // Now add new/moved rows
            // appendLockedRows must be called first; it should probably
            //  be consolidated with appendRows
            appendLockedRows(lockedHtml.join(''));
            appendRows(html.join(''));

            // Load rows that aren't currently present
            if (rowsToLoad.length) {
                if (rowLoadTimer)
                    clearTimeout(rowLoadTimer);
                rowLoadTimer = setTimeout(loadMissingRows, MISSING_ROW_LOAD_DELAY);
                rowLoadRows = rowsToLoad;
            }

            updateSelection();
        };

        var updateSelection = function()
        {
            inside.find('.blist-select-row').removeClass('blist-select-row');
            $locked.find('.blist-select-row').removeClass('blist-select-row');
            $.each(model.selectedRows, function (k, v)
            {
                inside.find('#' + id + '-r' + k).addClass('blist-select-row');
                $locked.find('#' + id + '-l' + k).addClass('blist-select-row');
            });
        };

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
                renderFooter();
            }

            $locked.empty();
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
            renderFooter();
        });
        $this.bind('header_change', function(event, model)
        {
            updateHeader(model);
        });
        $this.bind('before_load', function() {
            $outside.addClass('blist-loading');
        });
        $this.bind('load', function(event, model) {
            initRows(model);
        });
        $this.bind('after_load', function() {
            $outside.removeClass('blist-loading');
        });
        $this.bind('row_change', function(event, rows) {
            updateRows(rows);
        });
        $this.bind('selection_change', function(event, rows) {
            updateSelection(rows);
        });
        $this.bind('row_add', updateLayout);
        $this.bind('row_remove', updateLayout);
        $this.bind('col_width_change', configureWidths);

        // Install the model
        $this.blistModel(options.model);


        /*** STARTUP ***/

        updateLayout();
    }

    var blistTableDefaults = {
        cellExpandEnabled: true,
        disableLastColumnResize: false,
        generateHeights: true,
        ghostMinWidth: 20,
        headerMods: function (col) {},
        manualResize: false,
        resizeHandleAdjust: 3,
        showGhostColumn: false,
        showName: true,
        showRowNumbers: true,
        showRowHandle: false,
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
