(function($) {
    var nextTableID = 1;

    // HTML escaping utility
    var escape = function(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Make a DOM element into a table
    var makeTable = function(options) {
        var self = this;
        
        // Element measuring utility
        var measure = function(html) {
            var e = $('<div class="blist-table-measure">' + html + '</div>');
            $(self).append(e);
            var result = { width: e.width(), height: e.height() };
            e.remove();
            return result;
        }

        // Calculate the number of digits in the handle.  This is important because we need to recreate our layout if
        // the width of the column changes.
        var calculateHandleDigits = function(model) {
            return Math.ceil(Math.log(model.rows().length || 1) * Math.LOG10E);
        }


        /*** HTML RENDERING ***/

        var id = this.id;
        if (!id) {
            id = nextTableID++;
            id = "blist-t" + id;
            this.id = id;
        }

        var outside = $(this)
            .addClass('blist-table')
            .html('<div class="blist-table-header"></div><div class="blist-table-scrolls"><div class="blist-table-inside">&nbsp;</div></div>');
        var header = outside
            .children('.blist-table-header');
        var scrolls = outside
            .children('.blist-table-scrolls');
        var inside = scrolls
            .children('.blist-table-inside');

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
        var handleStyle;
        var handleClass;
        var colStyles = [];
        var colClasses = [];

        // Add a CSS rule
        var addRule = function(selector) {
            var rules = css.cssRules || css.rule;
            css.insertRule ? css.insertRule(selector + " {}", rules.length)
                : css.addRule(selector, null, rules.length);
            return rules[rules.length - 1];
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
            var rulesNode = $('head').append('<style type="text/css" id="' + id + '-styles"></style>').select('.' + id + '-styles')[0];
            for (css in document.styleSheets) {
                css = document.styleSheets.item(css);
                if ((css.ownerNode || css.owningElement) == rulesNode)
                    break;
            }
            handleClass = id + "-handle";
            handleStyle = addRule("." + handleClass).style;
        })();


        /*** CELL RENDERING ***/

        var renderText = function(value) {
            if (value == null)
                return '';
            value = value + '';
            if (value.substring(0, 11) == '<TEXTFORMAT') {
                // HACK - clean up messy markup
                return value.replace(/<\/?textformat[^>]*>/gi, '').replace(/ size="\d+"/gi, '');
            }
            return value;
        }

        var renderCheckbox = function(value) {
            if (value == true || value == 'true')
                return "<center>&#9745;</center>";
            return "<center>&#9744;</center>";
        }

        // Return the name of a rendering function, or null if the value should be displayed as literal text.  Note:
        // the null optimization is currently not supported because of the Blist text data format.
        var chooseRenderer = function(column) {
            switch (column.columnType) {
                case 'checkbox':
                    return 'renderCheckbox';
            }
            return 'renderText';
        }


        /*** COLUMNS ***/

        var columns = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var renderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var handleDigits;
        var paddingX;
        var initColumns = function(model) {
            // Create an object for each column
            columns = [];
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++) {
                var col = mcols[i];
                if (!col.columnType)
                    // Internal column -- ignore for now
                    continue;
                col.index = columns.length;
                col.srcIndex = i;
                if (!col.hidden)
                    columns.push(col);
                if (!col.width)
                    col.width = 100;
            }

            // Ensure CSS styles are initialized
            initCSS();

            // Measure width and height of text and cell for the handle (these dimensions must also apply to headers
            // and cells)
            handleDigits = calculateHandleDigits(model);
            var measureText = '&nbsp;' + (model.rows().length + 1) + '&nbsp;'
            var handleInnerDims = measure('<div>' + measureText + '</div>');
            var handleOuterDims = measure('<div class="blist-td">' + measureText + '</div>');

            // Record the amount of padding and border in a table cell
            paddingX = handleOuterDims.width - handleInnerDims.width;

            // Update the handle style with proper dimensions
            var headerHeight = rowHeight + 'px';
            var handleWidth = handleInnerDims.width;
            handleStyle.height = headerHeight;
            handleStyle.width = handleWidth + 'px';

            // Record row positioning information for when we generate rows
            rowHeight = handleInnerDims.height;
            rowOffset = handleOuterDims.height;

            // These variables are used during column initialization
            var pos = handleOuterDims.width;
            var renderFnParts = [
                '(function(html, index, row) { html.push("<div class=\'blist-tr\' style=\'top: " + (index * rowOffset) + "px\'><div class=\'blist-table-handle ' + handleClass + '\'>" + (index + 1) + "</div>"'
            ]

            // Initialize each column
            for (i = 0; i < columns.length; i++) {
                // Initialize the column's style
                col = columns[i];
                col.left = pos;
                colStyles[i].width = columns[i].width + 'px';
                colStyles[i].height = headerHeight;
                pos += columns[i].width + paddingX;

                // Add rendering information to the rendering function
                var renderer = chooseRenderer(col);
                var index = col.srcIndex;
                if (renderer)
                    renderer = renderer + "(row[" + index + "])";
                else
                    // Inline text for speed
                    renderer = "row[" + index + "] == null ? '' : (row[" + index + "] + '').replace(/&/g, '&amp;').replace(/</g, '&lt;')";
                renderFnParts.push(
                    "\"<div class='blist-td " + colClasses[i] + "'>\", " + renderer + ", \"</div>\""
                )
            }

            // Create the rendering function.  We precompile this for speed so we can avoid tight loops, function
            // calls, etc.
            renderFnParts.push('"</div>") })')
            renderFn = renderFnParts.join(',');
            renderFn = eval(renderFn);

            // Position the scrolling area
            scrolls[0].style.top = rowOffset + 'px';
            scrolls.height(outside.height() - rowOffset);
            scrolls.width(outside.width());
            header.width(pos);
            inside.width(pos);
        }

        // Column header rendering
        var renderHeader = function() {
            var html = [
                '<div class="blist-th ', handleClass, '"></div>'
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

        var initRows = function(model) {
            if (handleDigits != calculateHandleDigits(model)) {
                initColumns(model);
                renderHeader();
            }
            inside.height(rowHeight * model.rows().length);
            inside.remove('.blist-td');
        }

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

            // Render the rows that are newly visible
            var html = [];
            var rows = model.rows();
            for (var i = start; i < stop; i++)
                renderFn(html, i, rows[i]);
            inside.append(html.join(''));

            // Destroy the rows that are no longer visible
            if (destroy)
                $(destroy).each(function() {
                    this.parentNode.removeChild(this);
                });

            var deferredRender = function() {
                // Currently never defer
                renderRows();
                //setTimeout(renderRows, 10);
            }

            scrolls.unbind("scroll", onScroll);
            scrolls.unbind("scroll", deferredRender);
            scrolls.scroll(onScroll);
            scrolls.scroll(renderRows);

            firstRenderedRow = first;
        }


        /*** MODEL ***/

        // Monitor model events
        $(this).bind('meta_change', function(event, model) {
            initColumns(model);
            renderHeader();
        });
        $(this).bind('postload', function(event, model) {
            initRows(model);
            setTimeout(renderRows);
        });

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
