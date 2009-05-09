/**
 * This file implements functionality specific to Blist data types.  All specialization based on datatype should be
 * controlled by the related object in blist.data.types.
 */

blist.namespace.fetch('blist.data.types');

(function($) {
    STAR_WIDTH = 10;

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
    };


    /*** SORT FUNCTION GENERATORS ***/

    var sortGenCore = function(compare) {
        return new Function("a", "b", compare);
    };

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

    var DIGITS = {
        "0": true,
        "1": true,
        "2": true,
        "3": true,
        "4": true,
        "5": true,
        "6": true,
        "7": true,
        "8": true,
        "9": true
    };

    var renderNumber = function(value, decimalPlaces, prefix, suffix) {
        if (value == null)
            return '';
        value = parseFloat(value).toFixed(decimalPlaces);
        var pos = value.indexOf('.');
        if (pos == -1)
            pos = value.length;
        pos -= 3;
        while (pos > 0 && DIGITS[value.charAt(pos - 1)]) {
            value = value.substring(0, pos) + "," + value.substring(pos);
            pos -= 3;
        }
        if (prefix)
            value = prefix + value;
        if (suffix)
            value += suffix;
        return value;
    }

    var renderGenNumber = function(value, column) {
        return "renderNumber(" + value + ", " + (column.decimalPlaces || 0) + ")";
    }

    var renderPercentBar = function(value) {
        if (!value)
            return "";
        var cls;
        if (value > 0)
            cls = 'blist-percent-bar-pos';
        else {
            cls = 'blist-percent-bar-neg';
            value *= -1;
        }
        if (value > 100)
            value = 100;
        return "<div class='blist-cell " + cls + "' style='width: " + value + "%'></div>";
    }

    var renderGenPercent = function(value, column) {
        var renderText;
        var renderBar;
        switch (column.format || 'percent_bar') {
            case 'percent_bar':
                renderText = false;
                renderBar = true;
                break;

            case 'percent_text':
                renderText = true;
                renderBar = false;
                break;

            default:
                renderText = renderBar = true;
                break;
        }
        var rv = "'<div class=\"blist-percent\">'";
        if (renderBar)
            rv += " + renderPercentBar(" + value + ")";
        if (renderText)
            rv += " + '<div class=\"blist-cell blist-percent-num\">' + renderNumber(" + value + ", " + (column.decimalPlaces || 0) + ", null, '%') + '</div>'";
        rv += "+ '</div>'";
        return rv;
    }

    var renderGenMoney = function(value, column) {
        return "renderNumber(" + value + ", " + (column.decimalPlaces || 2) + ", '$')";
    }

    var renderGenPhone = function(value) {
        return "((" + value + " && " + value + "[0]) || '')";
    }

    var renderGenCheckbox = function(value, column) {
        var format = column.format || 'check';
        return value + " && (\"<div class='blist-cell blist-checkbox blist-" + format + "-\" + (" + value + " ? 'on' : 'off') + \"'></div>\")";
    }

    var renderGenFlag = function(value, column) {
        return value + " && (\"<div class='blist-flag-\" + " + value + " + \"'></div>\")";
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
        if (url && url != '' && !url.match(/^([a-z]+):/i))
        {
            url = 'http://' + url;
        }
        return "<a target='blist-viewer' href='" + escape(url) + "'>" + escape(caption) + "</a>";
    }

    var renderGenURL = function(value) {
        return "renderURL(" + value + ")";
    }

    var renderGenEmail = function(value) {
        return "renderURL(" + value + " && ['mailto:' + " + value + ", " + value + "])";
    }

    var renderStars = function(value, range) {
        if (value == null)
            return '';
        var on = Math.round(value * STAR_WIDTH);
        if (on < 0)
            on = 0;
        else if (on > range)
            on = range;
        var off = range - on;
        return "<span class='blist-tstars' style='width: " + range + "px'><div class='blist-cell blist-tstar-on' style='width: " + on + "px'></div><div class='blist-cell blist-tstar-off' style='width: " + off + "px; background-position-x: " + -(on % STAR_WIDTH) + "px'></div></span>";
    }

    var renderGenStars = function(value, column) {
        var range = parseFloat(column.range);
        if (range <= 0 || range == NaN)
            range = 5;
        return "renderStars(" + value + ", " + (range * 10) + ")";
    }

    var renderGenPhoto = function(value, column) {
        var rv = value + " && ('<img src=\"";
        if (column.base)
            rv += column.base;
        return rv + "' + escape(" + value + ") + '\"></img>')";
    }

    var renderDocument = function(value, base) {
        var url, name, size;
        if (value == null)
            return '';
        if (typeof value == 'object') {
            url = value[2];
            if (url == null)
                return '';
            name = value[1];
            size = value[3];
        } else
            url = value;
        var rv = renderURL([ (base || '') + url, name || 'Document' ]);
        if (size != null) {
            size = Math.round(size / 1024);
            if (size == 0)
                size = 1;
            rv += "&nbsp;<span class='blist-document-size'>(" + size + "k)</span>";
        }
        return rv;
    }

    var renderGenDocument = function(value, column) {
        return "renderDocument(" + value + ", " + (column.base ? "'" + column.base + "'" : "null") + ")";
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
            renderGen: renderGenNumber,
            sortGen: sortGenNumeric,
            filterText: true,
            cls: 'number'
        },

        date: {
            renderGen: renderGenDate,
            sortGen: sortGenNumeric
        },

        photo: {
            renderGen: renderGenPhoto
        },

        money: {
            renderGen: renderGenMoney,
            sortGen: sortGenNumeric,
            cls: 'number',
            filterText: true
        },

        phone: {
            renderGen: renderGenPhone,
            filterText: true
        },

        checkbox: {
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric
        },

        flag: {
            renderGen: renderGenFlag
        },

        stars: {
            renderGen: renderGenStars,
            sortGen: sortGenNumeric,
            filterText: true
        },

        percent: {
            renderGen: renderGenPercent,
            sortGen: sortGenNumeric,
            filterText: true
        },

        url: {
            renderGen: renderGenURL,
            sortPreprocessor: sortHtmlPrepro,
            filterText: true
        },

        document: {
            renderGen: renderGenDocument
        },

        tag: {
            renderGen: renderGenText,
            sortGen: sortGenText,
            filterText: true
        },

        email: {
            renderGen: renderGenEmail,
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
