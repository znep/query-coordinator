/**
 * This file implements functionality specific to Blist data types.  All specialization based on datatype should be
 * controlled by the related object in blist.data.types.
 */

blist.namespace.fetch('blist.data.types');

(function($) {

    /*** UTILITY FUNCTIONS ***/

    /**
     * OK, you're going to hate me for this little gem.
     *
     * This function compiles a JavaScript expression using eval in this closure.  This allows external code to build
     * complex expressions that use functions that are local to this closure (such as type rendering functions).
     *
     * @param expression is the JavaScript expression to compile
     * @param context defines variables that will be available in the scope of the compiled function.  The key is a
     *   variable name and the value is the actual value used by the expression.
     */
    blist.data.types.compile = function(expression, context) {
        // Set local variables for each context variable
        for (var _key_ in context) {
            var _object_ = context[_key_];
            eval(_key_ + " = _object_");
        }

        // Compile
        var val;
        eval("val = (" + expression + ")");
        return val;
    }

    /**
     * Generate a unique variable name for type information.
     */
    var nextVarID = 1;
    var createUniqueName = function() {
        return "_u" + nextVarID++;
    }

    /**
     * Escape HTML characters.
     */
    var escape = function(text) {
        if (text == null)
            return '';
        return (text + "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    var MATCHES_TAGS = /<[^>]+>/;

    /**
     * Remove HTML tags in a completely hacky but relatively performant way.  We use this for sorting so it doesn't
     * need to be 100% accurate.  A far more accurate method would be to set innerHTML on a hidden div, then retrieve
     * nodeValue.  Have to do perf. tests but that's probably going to be considerably more expensive so we'll just
     * stick with this for now.
     */
    var removeTags = function(text) {
        return ((text || '') + '').replace(MATCHES_TAGS, '');
    }


    /*** SORT FUNCTION GENERATORS ***/
    
    var sortGenCore = function(compare) {
        return eval("(function(a, b) { "  + compare + " })")
    }

    var sortGenText = function(a, b) {
        return sortGenCore(
            "var x = ((" + a + " || '') + '').toLowerCase();" +
            "var y = ((" + b + " || '') + '').toLowerCase();" +
            "return x < y ? -1 : x > y ? 1 : 0"
        )
    }

    var sortGenNumeric = function(a, b) {
        return sortGenCore("return " + a + " - " + b)
    }

    var sortHtmlPrepro = function(html) {
        return removeTags(html).toLowerCase();
    }

    var sortPicklistPrepro = function(value, column) {
        var option = column.options[value];
        if (option)
            return (option.text || '').toLowerCase();
        return '';
    }


    /*** GROUPING FUNCTIONS ***/

    var groupText = function(value) {
        if (value == null || value == "")
            return "";
        return (value + "").substring(0, 1).toUpperCase();
    }
    

    /*** HTML RENDERERS ***/

    var renderGenText = function(value) {
        // Blist text is currently returned with character entities escaped
        //return "escape(" + value + ")";
        return "(" + value + " || '')";
    }

    var renderGenCheckbox = function(value, column) {
        var format = column.format || 'check';
        return "(\"<div class='blist-cell blist-checkbox blist-" + format + "-\" + (" + value + " ? 'on' : 'off') + \"'></div>\")";
    }

    var renderRichtext = function(value) {
        // TODO -- sanitize insecure HTML...  This should happen on the server but currently doesn't.
        if (value == null)
            return '';
        value = value + '';
        if (value.substring(0, 11) == '<TEXTFORMAT') {
            // XXX  - HACK - clean up terrible Flash markup
            return value.replace(/<\/?textformat[^>]*>/gi, '').replace(/ size="\d+"/gi, '');
        }
        return value;
    }

    var renderGenRichtext = function(value) {
        return "renderRichtext(" + value + " || '')";
    }

    var renderDate = function(value, includeDate, includeTime) {
        if (value == null)
            return '';
        
        // Note -- jQuery.dates would do a nicer job of this but it appears to be GPL so not sure if we can use it.
        // Plus this is probably faster.
        if (typeof value == 'number')
            value = new Date(value * 1000);

        var result;

        if (includeDate) {
            var day = value.getMonth();
            if (day < 10)
                day = '0' + day;
            result = (value.getMonth() + 1) + '/' + value.getDate() + '/' + (value.getYear() + 1900);
        }
        if (includeTime) {
            var hour = value.getHours();
            var meridian = hour < 12 ? ' am' : ' pm';
            if (hour > 12)
                hour -= 12;
            else if (!hour)
                hour = 12;
            var minute = value.getMinutes();
            if (minute < 10)
                minute = '0' + minute;
            var time = hour + ':' + minute + meridian;
            if (result)
                result += ' ' + time;
            else
                result = time;
        }

        return result;
    }

    var renderGenDate = function(value, column) {
        var date, time;
        switch (column && column.format) {
            case 'date':
                date = true;
                time = false;
                break;

            case 'time':
                date = false;
                time = true;
                break;

            default:
                date = time = true;
                break;
        }
        return "renderDate(" + value + ", " + date + ", " + time + ")";
    }

    var renderGenPicklist = function(value, column, context) {
        var valueLookupVariable = createUniqueName();
        if (column.options) {
            var valueLookup = context[valueLookupVariable] = {};
            for (var key in column.options) {
                var option = column.options[key];
                var icon = option.icon;
                if (icon)
                    icon = "<img class='blist-table-option-icon' src='" + icon + "'> ";
                else
                    icon = "";
                valueLookup[key] = icon + escape(option.text);
            }
            return "(" + valueLookupVariable + "[" + value + "] || '')";
        }
        return "'?'";
    }

    var renderURL = function(value) {
        if (!value)
            return '';
        else if (typeof value == "string") {
            // Terrible legacy format
            if (value.charAt(0) == '<')
                return value;
            var url = value;
            var caption = value;
        }
        else if (typeof value == "object")
        {
            url = value[0];
            caption = value[1] || url;
        }
        if (url && url != '' && !url.match(/^(ht|f)tps?:\/\//))
        {
            url = 'http://' + url;
        }
        return "<a href='" + escape(url) + "'>" + escape(caption) + "</a>";
    }

    var renderGenURL = function(value) {
        return "renderURL(" + value + ")";
    }


    /*** DATA TYPE DEFINITIONS ***/

    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        text: {
            renderGen: renderGenText,
            sortGen: sortGenText,
            filterText: true,
            group: groupText
        },

        richtext: {
            renderGen: renderGenRichtext,
            sortGen: sortGenText,
            filterText: true
        },

        number: {
            renderGen: renderGenText,
            sortGen: sortGenNumeric
        },

        date: {
            renderGen: renderGenDate,
            sortGen: sortGenNumeric
        },

        photo: {
            renderGen: renderGenText
        },

        money: {
            renderGen: renderGenText,
            sortGen: sortGenNumeric
        },

        phone: {
            renderGen: renderGenText
        },

        checkbox: {
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric
        },

        flag: {
            renderGen: renderGenText
        },

        stars: {
            renderGen: renderGenText,
            sortGen: sortGenNumeric
        },

        percent: {
            renderGen: renderGenText,
            sortGen: sortGenNumeric
        },

        url: {
            renderGen: renderGenURL,
            sortPreprocessor: sortHtmlPrepro,
            filterText: true
        },

        document: {
            renderGen: renderGenText
        },

        tag: {
            renderGen: renderGenText,
            sortGen: sortGenText
        },

        email: {
            renderGen: renderGenText,
            sortGen: sortGenText,
            filterText: true
        },

        blist_in_blist: {
            renderGen: renderGenText
        },

        picklist: {
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro
        }
    });

    for (var name in blist.data.types) {
        var type = blist.data.types[name];
        if (typeof type == "object")
            type.name = name;
    }
})(jQuery);
