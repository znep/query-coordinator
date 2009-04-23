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
        return eval(expression);
    }

    /**
     * Generate a unique variable name for type information.
     */
    var nextVarID = 1;
    var createUniqueName = function() {
        return "_u" + nextVarID++;
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

    var sortGenSimple = function(a, b) {
        return sortGenCore("return " + a + " < " + b + " ? -1 : " + a + " > " + b + " ? 1 : 0")
    }
    

    /*** HTML RENDERERS ***/

    var renderText = function(value) {
        if (value == null)
            return '';
        value = value + '';
        if (value.substring(0, 11) == '<TEXTFORMAT') {
            // XXX  - HACK - clean up terrible Flash markup
            return value.replace(/<\/?textformat[^>]*>/gi, '').replace(/ size="\d+"/gi, '');
        }
        return value;
    }

    var renderGenText = function(value) {
        return "renderText(" + value + ")";
    }

    var renderGenCheckbox = function(value) {
        return "(" + value + " ? '<div class=\"blist-table-checked\"></div>' : '')";
    }

    var renderDate = function(value) {
        if (value == null)
            return '';
        
        // Note -- jQuery.dates would do a nicer job of this but it appears to be GPL so not sure if we can use it.
        // Plus this is probably faster.
        if (typeof value == 'number')
            value = new Date(value * 1000);
        var day = value.getMonth();
        if (day < 10)
            day = '0' + day;
        var hour = value.getHours();
        var meridian = hour < 12 ? ' am' : ' pm';
        if (hour > 12)
            hour -= 12;
        else if (!hour)
            hour = 12;
        var minute = value.getMinutes();
        if (minute < 10)
            minute = '0' + minute;
        return (value.getMonth() + 1) + '/' + value.getDate() + '/' + (value.getYear() + 1900) + ' ' + hour + ':' + minute + meridian;
    }

    var renderGenDate = function(value) {
        return "renderDate(" + value + ")";
    }

    var renderGenPicklist = function(value, column, context) {
        var valueLookupVariable = createUniqueName();
        if (column.options) {
            context[valueLookupVariable] = column.options;
            return "(" + valueLookupVariable + "[" + value + "] || '')";
        }
        return "'?'";
    }


    /*** DATA TYPE DEFINITIONS ***/

    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        text: {
            renderGen: renderGenText,
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
            renderGen: renderGenText,
            sortGen: sortGenSimple
        },

        money: {
            renderGen: renderGenText,
            sortGen: sortGenNumeric
        },

        phone: {
            renderGen: renderGenText,
            sortGen: sortGenSimple
        },

        checkbox: {
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric
        },

        flag: {
            renderGen: renderGenText,
            sortGen: sortGenSimple
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
            renderGen: renderGenText,
            sortGen: sortGenSimple,
            filterText: true
        },

        document: {
            renderGen: renderGenText,
            sortGen: sortGenSimple
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
            renderGen: renderGenText,
            sortGen: sortGenSimple
        },

        picklist: {
            renderGen: renderGenPicklist,
            sortGen: sortGenSimple
        }
    });
})(jQuery);
