/**
 * This file implements the Blist table control.  This control offers an interactive presentation of tabular data to
 * the user.
 */

(function($) {
    // Milliseconds to delay before expanding a cell's content
    var EXPAND_DELAY = 100;

    // Milliseconds in which expansion should occur
    var EXPAND_DURATION = 100;

    var nextTableID = 1;

    // HTML escaping utility
    var escape = function(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Debugging utility
    var puts = function(value) {
        if (window.console && window.console.log)
            window.console.log(value);
    }

    // Make a DOM element into a table
    var makeTable = function(options) {

        /*** MISC. VARIABLES AND INITIALIZATION ***/

        var id = this.id;
        if (!id) {
            id = nextTableID++;
            id = "blist-t" + id;
            this.id = id;
        }

        
        /*** CLOSURE UTILITY FUNCTIONS ***/

        var appendInside = function(html) {
            // Straight jQuery method - slightly slower
            //inside.append(html);

            // These functions only exist for profiling purposes.  We call this relatively infrequently so it's OK to
            // leave these in for production purposes.
            var appendInside_render = function() {
                appendUtilDOM.innerHTML = html;
            };
            var appendInside_append = function() {
                /*
                var frag = document.createDocumentFragment();
                while (appendUtilDOM.firstChild)
                    frag.appendChild(appendUtilDOM.firstChild);
                insideDOM.appendChild(frag);
                */
               while (appendUtilDOM.firstChild)
                   insideDOM.appendChild(appendUtilDOM.firstChild);
            };

            // Call the append functions
            appendInside_render();
            appendInside_append();
        }

        // Calculate the number of digits in the handle.  This is important because we need to recreate our layout if
        // the width of the column changes.
        var calculateHandleDigits = function(model) {
            return Math.ceil(Math.log(model.rows().length || 1) * Math.LOG10E);
        }

        // Sort data
        var sortBy;
        var sortDescending;
        var sort = function(index) {
            if (sortBy == index)
                sortDescending = !sortDescending;
            else {
                sortBy = index;
                sortDescending = false;
            }
            $('.sort', header).remove();
            var col = columns[sortBy];
            $(col.dom).append('<div class="sort sort-' + (sortDescending ? 'desc' : 'asc') + '" style="height: ' + rowOffset + 'px"></div>');
            model.sort(col.srcIndex, sortDescending);
        }

        // Filter data
        var applyFilter = function() {
            setTimeout(function() {
                model.filter(filterBox[0].value, 250);
            }, 10);
        }


        /*** CELL HOVER EXPANSION ***/

        // Handle mouse movement within the inside (cell) area
        var hotCell;
        var hotCellTimer;
        var hotExpander;

        var findCell = function(event) {
            var cell = $(event.target);
            if (!cell.hasClass('blist-td') && !cell.hasClass('blist-expander')) {
                cell = cell.closest('.blist-td');
                if (!cell.length)
                    return null;
            }
            cell = cell[0];
            if (cell == hotExpander || cell.parentNode == hotExpander)
                return hotCell;
            return cell;
        }

        var onCellMove = function(event) {
            // Locate the cell the mouse is in, if any
            var over = findCell(event);

            // If the hover cell is currently hot, nothing to do
            if (over == hotCell)
                return;
            if ($(over).hasClass('blist-table-expander'))
                return;

            // Update hover state
            if (hotCell)
                onCellOut(event);
            hotCell = over;
            if (over) {
                $(over).addClass('blist-hot');
                hotCellTimer = setTimeout(expandHotCell, EXPAND_DELAY);
            }
        }

        var onCellOut = function(event) {
            if (hotCell) {
                var to = findCell(event);
                if (to == hotCell)
                    return;

                $(hotCell).removeClass('blist-hot');
                hotCell = null;
                if (hotCellTimer) {
                    clearTimeout(hotCellTimer);
                    hotCellTimer = null;
                }
                if (hotExpander)
                    $(hotExpander).remove();
            }
        }

        var expandHotCell = function() {
            if (!hotCellTimer)
                return;
            hotCellTimer = null;

            // Create the expanding element
            hotExpander = document.createElement('div');
            var expander = $(hotExpander);
            expander.addClass('blist-table-expander');
            var wrap = hotCell.cloneNode(true);
            var w = $(wrap);
            w.width('auto').height('auto');
            hotExpander.appendChild(wrap);
            measureUtilDOM.appendChild(hotExpander);

            // Compute cell padding
            var padx = w.outerWidth() - w.width();
            var pady = w.outerHeight() - w.height();

            // Determine the cell's "natural" size
            var rc = { width: w.outerWidth(), height: w.outerHeight() };

            // Determine if expansion is necessary.  The + 2 prevents us from expanding if the box would just be
            // slightly larger than the containing cell.  This is a nicety except in the case of picklists where the
            // 16px image tends to be just a tad larger than the text (currently configured at 15px).
            var h = $(hotCell);
            var hotWidth = h.outerWidth();
            var hotHeight = h.outerHeight();
            if (rc.width <= hotWidth + 2 && rc.height <= hotHeight + 2) {
                // Expansion is not necessary
                expander.remove();
                return;
            }

            // The expander must be at least as large as the hot cell
            if (rc.width < hotWidth)
                rc.width = hotWidth;
            if (rc.height < hotHeight)
                rc.height = hotHeight;

            // Determine the size to which the contents expand, constraining to predefined maximums
            var maxWidth = Math.floor(scrolls.width() * .5);
            if (rc.width > maxWidth) {
                // Constrain the width and determine the height
                expander.width(maxWidth);
                rc.width = maxWidth;
                rc.height = expander.height();
            }
            var maxHeight = Math.floor(inside.height() * .75);
            if (rc.height > maxHeight)
                rc.height = maxHeight;

            // Locate a position for the expansion.  We prefer the expansion to align top-left with the cell but do our
            // best to ensure the expansion remains within the viewport
            rc.left = hotCell.offsetLeft;
            rc.top = hotCell.parentNode.offsetTop;
            rc.left -= 1; // assumes 1px right border
            rc.top -= 1; // assumes 1px bottom border
            var origOffset = { top: rc.top, left: rc.left };

            // Ensure viewport is in the window horizontally
            var viewportWidth = scrolls.width() - scrollbarWidth;
            var scrollLeft = scrolls.scrollLeft();
            if (rc.left + rc.width > scrollLeft + viewportWidth)
                rc.left = scrollLeft + viewportWidth - rc.width;
            if (rc.left < scrollLeft)
                rc.left = scrollLeft;

            // Ensure viewport is in the window vertically
            var viewportHeight = scrolls.height() - scrollbarWidth;
            var scrollTop = scrolls.scrollTop();
            if (rc.top + rc.height > scrollTop + viewportHeight)
                rc.top = scrollTop + viewportHeight - rc.height;
            if (rc.top < scrollTop - 1)
                rc.top = scrollTop - 1;

            // Size the content wrapper
            w.width(rc.width - padx);
            w.height(rc.height - pady);

            // Position the expander
            expander.css('top', origOffset.top + 'px');
            expander.css('left', origOffset.left + 'px');
            expander.width(hotWidth);
            expander.height(hotHeight);
            insideDOM.appendChild(hotExpander);

            // Expand the element into position
            expander.animate($.extend(rc, rc), EXPAND_DURATION);
        }


        /*** HTML RENDERING ***/

        // Render container elements
        var outside = $(this)
            .addClass('blist-table')
            .html(
                '<div class="blist-table-top">' +
                '  <div class="blist-table-title-tl"><div class="blist-table-title-tr"><div class="blist-table-title">' +
                '    <div class="blist-table-filter-l"><div class="blist-table-filter-r"><input class="blist-table-filter"/></div></div>' +
                '    <div class="blist-table-name">&nbsp;</div>' +
                '  </div></div></div>' +
                '  <div class="blist-table-header-scrolls"><div class="blist-table-header">&nbsp;</div></div>' +
                '</div>' +
                '<div class="blist-table-scrolls">' +
                '<div class="blist-table-inside">&nbsp;</div></div>' +
                '<div class="blist-table-util"></div>'
            );

        // The top area
        var top = outside
            .find('.blist-table-top');

        // The title bar
        var title = top
            .find('.blist-table-title');
        var nameLabel = title
            .find('.blist-table-name');
        var filterBox = title
            .find('.blist-table-filter')
            .keypress(applyFilter)
            .change(applyFilter)
            .example('Find');

        // The table header elements
        var headerScrolls = top
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
            .mouseout(onCellOut);
        var insideDOM = inside[0];

        // These utility nodes are used to append rows and measure cell text, respectively
        var appendUtil =
            $(document.createElement('div'));
        var appendUtilDOM = appendUtil[0];
        
        var measureUtil = outside
            .find('.blist-table-util');
        var measureUtilDOM = measureUtil[0];


        /*** SCROLLING AND SIZING ***/

        // Measure the scroll bar
        var scrollbarWidth = (function scrollbarWidth() {
            var div = $('<div style="width:50px;height:50px;overflow:hidden;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');
            $('body').append(div);
            var w1 = $('div', div).innerWidth();
            div.css('overflow-y', 'scroll');
            var w2 = $('div', div).innerWidth();
            $(div).remove();
            return w1 - w2;
        })();

        // Window sizing
        var updateLayout = function() {
            headerScrolls.height(header.height());

            // Size the scrolling area.  Note that this assumes a width and height of 2px.  TODO - change to absolute
            // positioning when IE6 is officially dead (June 2010?)
            scrolls.height(outside.height() - top.height() - 2);
            scrolls.width(outside.width() - 2);
        }
        $(window).resize(updateLayout);
        updateLayout();

        // Install scrolling handler
        var headerScrolledTo = 0;
        var onScroll = function() {
            var scrollTo = this.scrollLeft;
            if (scrollTo != headerScrolledTo) {
                header[0].style.left = -scrollTo + 'px';
                headerScrolledTo = scrollTo;
            }
        };


        /*** CSS STYLE MANIPULATION ***/

        var css;
        var rowStyle;
        var handleStyle;
        var handleClass;
        var colStyles = [];
        var colClasses = [];

        // Add a CSS rule.  This creates an empty rule and returns it.  We then dynamically update the rule values as
        // needed.
        var addRule = function(selector) {
            // Add the rule
            var rules = css.cssRules || css.rule;
            css.insertRule ? css.insertRule(selector + " {}", rules.length)
                : css.addRule(selector, null, rules.length);
            rules = css.cssRules || css.rule;

            // Find the new rule
            selector = selector.toLowerCase();
            for (var i = 0; i < rules.length; i++) {
                if (rules[i].selectorText.toLowerCase() == selector)
                    return rules[i];
            }

            // Shouldn't get here
            return null;
        };

        // Initialize CSS for the current column set
        var initCSS = function() {
            var cnt = columns.length;
            var ruleClass;
            while (colStyles.length < cnt) {
                colClasses.push(ruleClass = id + '-c' + colStyles.length);
                var style = addRule("." + ruleClass).style;
                colStyles.push(style);
                //style.position = 'absolute';
            }
        };

        // Initialize my stylesheet
        (function() {
            var rulesNode = $('head')
                .append('<style type="text/css" id="' + id + '-styles"></style>')
                .children('#' + id + '-styles')[0];
            for (css in document.styleSheets) {
                css = document.styleSheets.item(css);
                if ((css.ownerNode || css.owningElement) == rulesNode)
                    break;
            }
            handleClass = id + "-handle";
            handleStyle = addRule("." + handleClass).style;
            rowStyle = addRule(".blist-table-tr").style;
        })();


        /*** COLUMNS ***/

        // Internal representation of visible columns in the model
        var columns = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var renderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var handleDigits;
        var paddingX;

        /**
         * Initialize based on current model metadata.
         */
        var initMeta = function(model) {
            // Create an object for each column
            columns = [];
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++) {
                var mcol = mcols[i];
                var col = {
                    name: mcol.name,
                    type: mcol.type,
                    index: columns.length,
                    srcIndex: mcol.dataIndex,
                    width: mcol.width || 100,
                    options: mcol.options
                }
                columns.push(col);
            }

            // Ensure CSS styles are initialized
            initCSS();

            // Measure width and height of text and cell for the handle (these dimensions must also apply to cells)
            handleDigits = calculateHandleDigits(model);
            measureUtilDOM.innerHTML = '<div>x</div>';
            var measuredInnerDims = { width: measureUtil.width(), height: measureUtil.height() };
            measureUtilDOM.innerHTML = '<div class="blist-td">x</div>';
            var measuredOuterDims = { width: measureUtil.width(), height: measureUtil.height() };

            // Record the amount of padding and border in a table cell
            paddingX = measuredOuterDims.width - measuredInnerDims.width;

            // Row positioning information
            rowHeight = measuredInnerDims.height;
            rowOffset = measuredOuterDims.height;
            rowStyle.height = rowHeight + 'px';

            // Update the handle style with proper dimensions
            var dummyHandleText = Math.min(model.rows().length, 1000);
            measureUtilDOM.innerHTML = '<div class="blist-table-handle">' + dummyHandleText + '</div>';
            var handleOuterWidth = measureUtil.width();
            var handleWidth = $(measureUtilDOM.firstChild).width();
            handleStyle.height = rowHeight + 'px';
            handleStyle.width = handleWidth + 'px';

            // These variables are used during column initialization
            var pos = handleOuterWidth;
            var renderFnParts = [
                '(function(html, index, row) { html.push("<div class=\'blist-tr" + (index % 2 ? " blist-tr-even" : "") + "\' style=\'top: " + (index * ' + rowOffset + ') + "px\'><div class=\'blist-table-handle ' + handleClass + '\'>" + (index + 1) + "</div>"'
            ]

            // Initialize each column
            var contextVariables = {};
            for (i = 0; i < columns.length; i++) {
                // Initialize the column's style
                col = columns[i];
                col.left = pos;
                colStyles[i].width = columns[i].width + 'px';
                colStyles[i].height = rowHeight + 'px';
                pos += columns[i].width + paddingX;

                // Add rendering information to the rendering function
                var type = blist.data.types[col.type] || blist.data.types.text;
                var renderer = type.renderGen("row[" + col.srcIndex + "]", col, contextVariables);
                renderFnParts.push(
                    "\"<div class='blist-td " + colClasses[i] + "'>\", " + renderer + ", \"</div>\""
                )
            }

            // Create the rendering function.  We precompile this for speed so we can avoid tight loops, function
            // calls, etc.
            renderFnParts.push('"</div>") })')
            renderFn = renderFnParts.join(',');
            renderFn = blist.data.types.compile(renderFn, contextVariables);

            // Set the scrolling area width
            header.width(pos);
            inside.width(pos);

            // Set the title
            nameLabel.html(model.title());
        }
        
        /**
         * Create column header elements for the current row configuration and install event handlers.
         */
        var renderHeader = function() {
            var html = [
                '<div class="blist-th blist-table-corner ', handleClass, '"></div>'
            ];
            for (var i = 0; i < columns.length; i++) {
                var col = columns[i];
                html.push(
                    '<div class="blist-th ',
                    colClasses[i],
                    '">',
                    escape(col.name),
                    '</div>'
                );
            }
            header.html(html.join(''));

            $(".blist-th", header).each(function(index) {
                if (!index)
                    // Skip the header handle
                    return;
                index -= 1;
                columns[index].dom = this;
                $(this).click(function() { sort(index) });
            });

            var handleResize = function(event, ui) {
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
                colStyles[drag.col.index].width = drag.col.width + 'px';
            }

            // Create column sizers
            for (i = 0; i < columns.length; i++) {
                col = columns[i];
                var sizer = col.sizer = document.createElement('div');
                sizer.className = 'blist-th-sizer';
                sizer.innerHTML = '&nbsp;'
                header[0].appendChild(sizer);
                col.sizerLeft = col.left + col.width + paddingX - 3;
                sizer.style.left = col.sizerLeft + 'px';
                $(sizer)
                    .data('col', col)
                    .draggable({
                        axis: 'x',

                        start: function(event, ui) {
                            // Record original position information used to update drag position
                            var col = $(this).data('col');
                            $(this).data('drag', {
                                col: col,
                                originalColWidth: col.width,
                                originalSizerLeft: col.sizerLeft,
                                originalInsideWidth: inside.width()
                            })
                        },

                        drag: handleResize,

                        stop: function(event, ui) {
                            handleResize.call(this, event, ui);

                            // Everything is up-to-date now but size handles to the right; take care of these now
                            var drag = $(this).data('drag');
                            for (var i = drag.col.index + 1; i < columns.length; i++) {
                                var otherCol = columns[i];
                                otherCol.sizerLeft = otherCol.sizerLeft + drag.delta;
                                otherCol.sizer.style.left = otherCol.sizerLeft + 'px';
                            }

                            $(this).removeData('drag');
                        }
                    });
            }
        }


        /*** ROWS ***/

        var firstRenderedRow;

        /**
         * Render all rows that should be visible but are not yet rendered.  Removes invisible rows.
         */
        var renderRows = function() {
            var top = scrolls.scrollTop();

            // Compute the first row to render
            var first = Math.floor(top / rowOffset);

            // Compute the number of (possibly partially) visible rows
            var count = Math.ceil((top - (first * rowOffset) + scrolls.height()) / rowOffset);

            // Remove the rows that we will destroy (after rendering the new rows, for visual perf.)
            var renderedRows = inside.children('.blist-tr');
            if (firstRenderedRow != null) {
                var delta = firstRenderedRow - first;
                renderedRows.sort(function(row1, row2) {
                    return row1.firstChild.innerHTML - row2.firstChild.innerHTML;
                });
                if (delta > 0) {
                    var spliceFrom = renderedRows.length - delta;
                    if (spliceFrom < 0)
                        spliceFrom = 0;
                    destroy = renderedRows.splice(spliceFrom, renderedRows.length);
                    var start = first;
                    var stop = first + destroy.length;
                } else if (delta < 0) {
                    var destroy = renderedRows.splice(0, -delta);
                    start = first + renderedRows.length;
                    stop = first + count;
                }
            } else {
                start = first;
                stop = first + count;
            }

            // Safety checks in case above are buggy
            var rows = model.rows();
            if (start < 0)
                start = 0;
            if (rows) {
                if (stop > rows.length)
                    stop = rows.length;
            } else if (stop > 0)
                stop = 0;

            // Render the rows that are newly visible
            var html = [];
            for (var i = start; i < stop; i++)
                renderFn(html, i, rows[i]);
            appendInside(html.join(''));

            // Destroy the rows that are no longer visible
            if (destroy)
                $(destroy).each(function() {
                    this.parentNode.removeChild(this);
                });

            scrolls.unbind("scroll", onScroll);
            scrolls.unbind("scroll", renderRows);
            scrolls.scroll(onScroll);
            scrolls.scroll(renderRows);

            firstRenderedRow = first;
        }

        /**
         * Initialize the row container for the current row set.
         */
        var initRows = function(model) {
            if (handleDigits != calculateHandleDigits(model)) {
                // The handle changed.  Reinitialize columns.
                initMeta(model);
                renderHeader();
            }
            inside.height(rowOffset * model.rows().length);

            inside.empty();
            firstRenderedRow = null;
            
            renderRows();
        }


        /*** MODEL ***/

        // Monitor model events
        $(this).bind('meta_change', function(event, model) {
            initMeta(model);
            renderHeader();
        });
        $(this).bind('before_load', function() {
            outside.addClass('blist-loading');
        });
        $(this).bind('load', function(event, model) {
            initRows(model);
        });
        $(this).bind('after_load', function() {
            outside.removeClass('blist-loading');
        })

        // Install the model
        var model = $(this).blistModel(options.model);
    }

    $.fn.extend({
        /**
         * Make an element into a Blist Table.
         */
        blistTable: function(options) {
            // Create the table
            return this.each(function() {
                makeTable.apply(this, [ options || {} ]);
            });
        }
    });
})(jQuery);
