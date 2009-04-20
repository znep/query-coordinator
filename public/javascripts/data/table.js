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

        var onScroll = function() {
            header[0].style.left = -this.scrollLeft + 'px';
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
                style.position = 'absolute';
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


        /*** RENDERING ***/

        // Return the name of a rendering function, or null if the value should be displayed as literal text
        var chooseRenderer = function(column) {
            return null;
        }


        /*** COLUMNS ***/

        var columns = [];

        // This is the row rendering function.  Precompiled using eval() for perf.
        var renderFn;

        // Column configuration
        var rowHeight;
        var rowOffset;
        var initColumns = function(model) {
            // Create an object for each column
            columns = [];
            var mcols = model.meta().columns;
            for (var i = 0; i < mcols.length; i++) {
                var col = mcols[i];
                col.metaPos = i;
                if (!col.hidden)
                    columns.push(col);
                if (!col.width)
                    col.width = 100;
            }

            // Ensure CSS styles are initialized
            initCSS();

            // Measure width and height of text and cell for the handle (these dimensions must also apply to headers
            // and cells)
            var measureText = '&nbsp;' + (columns.length + 1) + '&nbsp;'
            var handleInnerDims = measure('<div>' + measureText + '</div>');
            var handleOuterDims = measure('<div class="blist-td">' + measureText + '</div>');

            // Record the amount of padding and border in a table cell
            var paddingX = handleOuterDims.width - handleInnerDims.width;

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
                '(function(html, index, row) { html.push("<div class=\'blist-tr\'><div class=\'blist-table-handle ' + handleClass + '\'>" + (index + 1) + "</div>"'
            ]

            // Initialize each column
            for (i = 0; i < columns.length; i++) {
                // Initialize the column's style
                col = columns[i];
                colStyles[i].width = columns[i].width + 'px';
                colStyles[i].height = headerHeight;
                colStyles[i].left = pos + 'px';
                pos += columns[i].width + paddingX;

                // Add rendering information to the rendering function
                var renderer = chooseRenderer(col);
                if (renderer)
                    renderer = renderer + "(row[" + i + "])";
                else
                    // Inline text for speed
                    renderer = "row[" + i + "] == null ? '' : (row[" + i + "] + '').replace(/&/g, '&amp;').replace(/</g, '&lt;')";
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
        }


        /*** ROWS ***/

        var firstRenderedRow;

        var initRows = function(model) {
            inside.height(rowHeight * model.rows().length);
            inside.remove('.blist-td');
        }

        var renderRows = function() {
            var top = inside.scrollTop();

            // Compute the first row to render
            var first = Math.floor(top / rowHeight);

            // Compute the number of rows to render
            var count = Math.ceil((top - (first * rowHeight) + inside.height()) / rowHeight);

            // Remove the rows that we will destroy (after rendering the new rows, for visual perf.)
            var renderedRows = inside.children('.blist-tr');
            if (firstRenderedRow) {
                var delta = firstRenderedRow - first;
                if (delta > 0)
                    var destroy = renderedRows.splice(0, delta);
                else if (delta < 0) {
                    var spliceFrom = renderedRows.length - delta;
                    if (spliceFrom < 0)
                        spliceFrom = 0;
                    destroy = renderedRows.splice(spliceFrom, renderedRows.length);
                }
            }

            // Render the rows that are newly visible
            var html = [];
            var rows = model.rows();
            for (var i = first + renderedRows.length, stop = first + count; i < stop; i++)
                renderFn(html, i, rows[i]);
            inside.append(html.join(''));

            // Position the rows
            $('.blist-tr').each(function(pos) {
                this.style.top = (first + pos) * rowOffset + 'px';
            });

            // Destroy the rows that are no longer visible
            $(destroy).remove();

            scrolls.unbind("scroll", onScroll);
            scrolls.scroll(onScroll);
        }


        /*** MODEL ***/

        // Monitor model events
        $(this).bind('meta_change', function(event, model) {
            initColumns(model);
            renderHeader();
        });
        $(this).bind('postload', function(event, model) {
            initRows(model);
            renderRows();
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
