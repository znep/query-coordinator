/**
 * This file implements functionality specific to Blist data types.  All specialization based on datatype should be
 * controlled by the related object in blist.data.types.
 */

blist.namespace.fetch('blist.data.types');

(function($) {
    STAR_WIDTH = 16;

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
    };

    /**
     * Generate a unique variable name for type information.
     */
    var nextVarID = 1;
    var createUniqueName = function() {
        return "_u" + nextVarID++;
    };

    /**
     * Escape HTML characters.
     */
    var htmlEscape = function(text) {
        if (text == null) {
            return '';
        }
        return (text + "").replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    var htmlStrip = function(text)
    {
        if (text == null) {
            return '';
        }
        return text.replace(/<[^>]*>/g, '');
    };

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
        );
    };

    var sortGenNumeric = function(a, b) {
        return sortGenCore("return " + a + " - " + b);
    };

    var sortHtmlPrepro = function(html) {
        return removeTags(html).toLowerCase();
    };

    var sortPicklistPrepro = function(value, column) {
        var option = column.options[value];
        if (option) {
            return (option.text || '').toLowerCase();
        }
        return '';
    };


    /*** GROUPING FUNCTIONS ***/

    var groupText = function(value) {
        if (value == null || value == "") {
            return "Empty";
        }
        return (value + "").substring(0, 1).toUpperCase();
    };

    var groupDate = function(value) {
        if (value == null || value == "") {
            return "";
        }
        return blist.util.humaneDate.getFromDate
                    (new Date(value * 1000), blist.util.humaneDate.DAY);
    };
    

    /*** HTML RENDERERS ***/

    var renderGenText = function(value) {
        // Blist text is currently returned with character entities escaped
        //return "htmlEscape(" + value + ")";
        return "(" + value + " || '')";
    };

    var renderGenEscapedText = function(value)
    { return "htmlEscape(" + value + " || '')"; };

    var renderGenTags = function(value) {
        return value + ' && ' + value + ' != "" ? "<div class=\'blist-tag\' ' +
            'title=\'" + htmlEscape(' + value + ' || "") + "\'></div>" : ""';
    };

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
        if (value == null) {
            return '';
        }
        if (typeof value != "number") {
            // Skip this if we already have a number as it is slow
            value = parseFloat(value);
        }
        if (decimalPlaces !== undefined) {
            value = value.toFixed(decimalPlaces);
        }
        // HACK HACK HACK
        // Temporary HACK: Don't put commas if a number is less than 10,000.
        // This should help with the display of dates
        if (value > 9999)
        {
            value = value + '';
            var pos = value.indexOf('.');
            if (pos == -1) {
                pos = value.length;
            }
            pos -= 3;
            while (pos > 0 && DIGITS[value.charAt(pos - 1)]) {
                value = value.substring(0, pos) + "," + value.substring(pos);
                pos -= 3;
            }
        }
        // END HACK
        if (prefix) {
            value = prefix + value;
        }
        if (suffix) {
            value += suffix;
        }
        return value;
    };

    var renderGenNumber = function(value, plain, column) {
        return "renderNumber(" + value + ", " + column.decimalPlaces + ")";
    };

    var renderPercentBar = function(value) {
        if (!value) {
            return "";
        }
        var cls;
        if (value > 0) {
            cls = 'blist-percent-bar-pos';
        }
        else {
            cls = 'blist-percent-bar-neg';
            value *= -1;
        }
        if (value > 100) {
            value = 100;
        }
        return "<div class='blist-cell " + cls + "' style='width: " + value + "%'></div>";
    };

    var renderGenPercent = function(value, plain, column)
    {
        if (plain)
        {
            return "renderNumber(" + value + ", " + column.decimalPlaces + ", null, '%')";
        }
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
        if (renderBar) {
            rv += " + renderPercentBar(" + value + ")";
        }
        if (renderText) {
            rv += " + '<div class=\"blist-cell blist-percent-num\">' + renderNumber(" + value + ", " + column.decimalPlaces + ", null, '%') + '</div>'";
        }
        rv += "+ '</div>'";
        return rv;
    };

    var renderGenMoney = function(value, plain, column) {
        return "renderNumber(" + value + ", " + (column.decimalPlaces || 2) + ", '$')";
    };

    var renderPhone = function(value, plain)
    {
        if (!value) { return ''; }

        var num;
        var type;
        if (value instanceof Array)
        {
            num = value[0] || '';
            type = value[1];
        }
        else if (value instanceof Object)
        {
            num = value.phone_number || '';
            type = value.phone_type;
        }
        else { num = value + ''; }

        var label = num + "";
        if (label.match(/^\d{10}$/))
        {
            label = "(" + label.substring(0, 3) + ") " +
                label.substring(3, 6) + "-" + label.substring(6, 10);
        }
        else if (label.match(/^\d{7}$/))
        {
            label = label.substring(0, 3) + "-" + label.substring(3, 7);
        }

        if (plain)
        {
            if (type) { label += " (" + type.toLowerCase() + ")"; }
            return label;
        }

        label = "<div class='blist-phone-icon blist-phone-icon-" +
            (type ? type.toLowerCase() : "unknown") + "'></div>&nbsp;" +
            htmlEscape(label);

        return renderURL([ "callto://" + num.replace(/[\-()\s]/g, ''), label ],
            true);
    };

    var renderGenPhone = function(value, plain)
    {
        return "renderPhone(" + value + ", " + plain + ")";
    };

    var renderGenCheckbox = function(value, plain, column)
    {
        if (plain) { return value + " ? '&#10003;' : ''"; }
        return "\"<div class='blist-cell blist-checkbox blist-checkbox-\" + (" +
            value + " ? 'on' : 'off') + \"' title='\" + (" + value +
            " ? 'True' : 'False') + \"'></div>\"";
    };

    var renderGenFlag = function(value, plain)
    {
        if (plain) { return value + " || ''"; }
        return value + " && (\"<div class='blist-flag blist-flag-\" + " +
            value + " + \"' title='\" + " + value + " + \"'></div>\")";
    };

    var renderRichtext = function(value)
    {
        if (value == null) { return ''; }
        // Add an extra wrapper so we can tweak the display to something
        // reasoanble
        return '<div class="blist-richtext">' + value + '</div>';
    };

    var renderGenRichtext = function(value, plain)
    {
        // TODO -- in plain text mode, strip out HTML?
        return "renderRichtext(" + value + " || '')";
    };

    var renderDate = function(value, format)
    {
        if (value == null) { return ''; }
        var d;
        if (typeof value == 'number') { d = new Date(value * 1000); }
        else { d = Date.parse(value); }
        return d ? d.format(format) : '';
    };

    var renderGenDate = function(value, plain, column)
    {
        var format = blist.data.types.date.formats[column.format] ||
            blist.data.types.date.formats['date_time'];
        return "renderDate(" + value + ", '" + format + "')";
    };

    var renderGenPicklist = function(value, plain, column, context) {
        var valueLookupVariable = createUniqueName();
        if (column.options) {
            var valueLookup = context[valueLookupVariable] = {};
            for (var key in column.options) {
                var option = column.options[key];
                if (plain)
				{
                    valueLookup[key.toLowerCase()] = option.text;
                } else {
                    var icon = option.icon;
                    if (icon) {
                        icon = "<img class='blist-table-option-icon' src='" + icon + "'> ";
                    } else {
                        icon = "";
                    }
                    valueLookup[key.toLowerCase()] = icon + htmlEscape(option.text);
                }
            }
            return "(" + valueLookupVariable + "[(" + value +
                " || '').toLowerCase()] || '')";
        }
        return "'?'";
    };

    var renderURL = function(value, captionIsHTML, plain)
    {
        if (!value) { return ''; }
        var url;
        if (value instanceof Array)
        {
            url = value[0];
            caption = value[1] || url;
        }
        else if (value instanceof Object)
        {
            url = value.url;
            caption = value.description || url;
        }
        else { url = value + ''; }

        if (url && url != '' && !url.match(/^([a-z]+):/i) &&
                url.indexOf('/') != 0)
        { url = 'http://' + url; }

        if (plain) { return url || ''; }

        if (!captionIsHTML) { caption = htmlEscape(caption); }
        return "<a target='blist-viewer' href='" + htmlEscape(url) + "'>" +
            caption + "</a>";
    };

    var renderGenURL = function(value, plain)
    {
        return "renderURL(" + value + ", false, " + plain + ")";
    };

    var renderGenEmail = function(value, plain)
    {
        if (plain) { return value; }
        return "renderURL(" + value + " && ['mailto:' + " + value + ", " +
            value + "], false, " + plain + ")";
    };

    var renderStars = function(value, range)
    {
        if (value == null) { return ''; }
        range *= STAR_WIDTH;
        var on = Math.round(value * STAR_WIDTH);
        if (on <= 0) { return ''; }
        else if (on > range) { on = range; }
        var off = range - on;
        return "<div class='blist-tstars-render-wrapper' style='width:" + range + "px'>" +
            (permissions.canEdit ? "<div class='blist-star-0'></div>" : "") +
            "<div class='blist-tstars' style='width: " + range +
            "px'><div class='blist-cell blist-tstar-on' style='width: " + on +
            "px'></div><div class='blist-cell blist-tstar-off' style='width: " +
            off + "px; background-position-x: " + -(on % STAR_WIDTH) +
            "px'></div></div></div>";
    };

    var renderTextStars = function(value, range)
    {
        var rv = '';
        for (var i = 0; i < value; i++) { rv += '*'; }
        return rv;
    };

    var renderGenStars = function(value, plain, column)
    {
        if (plain) { return "renderTextStars(" + value + ")"; }
        var range = parseFloat(column.range);
        if (range <= 0 || isNaN(range))
        {
            range = 5;
        }
        return "renderStars(" + value + ", " + range + ")";
    };

    var renderGenPhoto = function(value, plain, column)
    {
        var url = "'" + (column.base || '') + "' + " + value;
        if (plain)
        {
            // TODO
            return url;
        }
        return value + " && ('<img src=\"' + escape(" + url + ") + '\"></img>')";
    };

    var renderDocument = function(value, base, plain)
    {
        var url, name, size;
        if (!value) { return ''; }
        else if (value instanceof Array)
        {
            url = value[2];
            name = value[1];
            size = value[3];
        }
        else if (value instanceof Object)
        {
            url = value.id;
            name = value.filename;
            size = value.size;
        }
        else { url = value + ''; }

        if (!url) { return ''; }
        if (plain) { return name || ''; }

        var rv = renderURL([ (base || '') + url, name || 'Document' ]);
        if (size != null)
        {
            size = Math.round(size / 1024);
            if (size == 0) { size = 1; }
            rv += "&nbsp;<span class='blist-document-size'>(" + size + "k)</span>";
        }
        return rv;
    };

    var renderGenDocument = function(value, plain, column) {
        return "renderDocument(" + value + ", " + (column.base ? "'" + column.base + "'" : "null") + ", " + plain + ")";
    };


    /** FILTER RENDERERS ***/
    var renderFilterText = function(value)
    {
        return htmlStrip(value || '');
    };

    var renderFilterNumber = function(value, column)
    {
        return renderNumber(value, column.decimalPlaces);
    };

    var renderFilterDate = function(value, column)
    {
        var format = blist.data.types.date.formats[column.format] ||
            blist.data.types.date.formats['date_time'];
        return renderDate(value, format);
    };

    var renderFilterMoney = function(value, column)
    {
        return renderNumber(value, (column.decimalPlaces || 2), '$');
    };

    var renderFilterCheckbox = function(value, column)
    {
        var format = column.format || 'check';
        return "<div class='blist-cell blist-checkbox blist-" +
                format + "-" + (value ? 'on' : 'off') + "'>" +
                (value ? 'True' : 'False') + "</div>";
    };

    var valueFilterCheckbox = function(value)
    {
        return value ? 1 : 0;
    };

    var renderFilterFlag = function(value, column)
    {
        return value && "<div class='blist-flag blist-flag-" + value +
            "'>" + value + "</div>";
    };

    var renderFilterStars = function(value, column)
    {
        var range = parseFloat(column.range);
        if (range <= 0 || isNaN(range)) {
            range = 5;
        }
        return "<div class='blist-tstars-wrapper'>" +
            renderStars(value, range) + value + "</div>";
    };

    var renderFilterPercent = function(value, column)
    {
        return renderNumber(value, column.decimalPlaces, null, '%');
    };

    var renderFilterURL = function(value)
    {
        if (!value)
        {
            return '';
        }

        if (typeof value == "object")
        {
            return value[1] || value[0];
        }
        // Else, cast to a string & strip HTML
        return htmlStrip(value || '');
    };

    var renderFilterPicklist = function(value, column, context)
    {
        if (column.options)
        {
            var valueLookup = {};
            for (var key in column.options)
            {
                var option = column.options[key];
                var icon = option.icon;
                if (icon)
                {
                    icon = "<img class='blist-table-option-icon' src='" +
                        icon + "' /> ";
                }
                else
                {
                    icon = "";
                }
                valueLookup[key.toLowerCase()] = {};
                valueLookup[key.toLowerCase()]['text'] = htmlStrip(option.text);
                valueLookup[key.toLowerCase()]['html'] =
                    icon + htmlStrip(option.text);
            }
            return "<div class='blist-picklist-wrapper'>" +
                (valueLookup[value.toLowerCase()]['html'] || '') +
                "</div>";
        }
        return '?';
    };

    /*** DATA TYPE DEFINITIONS ***/

    var timeFormat = 'h:i:s A O';
    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        invalid: { renderGen: renderGenEscapedText },

        text: {
            renderGen: renderGenText,
            sortGen: sortGenText,
            filterRender: renderFilterText,
            filterText: true,
            group: groupText,
            sortable: true,
            filterable: true
        },

        richtext: {
            renderGen: renderGenRichtext,
            filterRender: renderFilterText,
            sortGen: sortGenText,
            filterText: true,
            sortable: true,
            filterable: true
        },

        number: {
            renderGen: renderGenNumber,
            sortGen: sortGenNumeric,
            filterRender: renderFilterNumber,
            filterText: true,
            cls: 'number',
            sortable: true,
            filterable: true
        },

        date: {
            cls: 'date',
            renderGen: renderGenDate,
            sortGen: sortGenNumeric,
            filterRender: renderFilterDate,
            filterValue: renderFilterDate,
            sortable: true,
            filterable: true,
            group: groupDate,
            formats: {
                'date': 'm/d/Y',
                'date_time': 'm/d/Y ' + timeFormat,
                'date_dmy': 'd/m/Y',
                'date_dmy_time': 'd/m/Y ' + timeFormat,
                'date_ymd': 'Y/m/d',
                'date_ymd_time': 'Y/m/d ' + timeFormat,
                'date_monthdy': 'F d, Y',
                'date_dmonthy': 'd F Y',
                'date_ymonthd': 'Y F d'
            }
        },

        photo: {
            renderGen: renderGenPhoto,
            cls: 'photo'
        },

        money: {
            renderGen: renderGenMoney,
            sortGen: sortGenNumeric,
            filterRender: renderFilterMoney,
            cls: 'money',
            filterText: true,
            sortable: true,
            filterable: true
        },

        phone: {
            cls: 'phone',
            renderGen: renderGenPhone,
            sortGen: sortGenText,
            filterText: true,
            sortable: true
//            filterable: true
        },

        checkbox: {
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric,
            filterRender: renderFilterCheckbox,
            filterValue: valueFilterCheckbox,
            sortable: true,
            filterable: true,
            isInlineEdit: true
        },

        flag: {
            renderGen: renderGenFlag,
            sortGen: sortGenText,
            filterRender: renderFilterFlag,
            sortable: true,
            filterable: true
        },

        stars: {
            cls: 'stars',
            renderGen: renderGenStars,
            sortGen: sortGenNumeric,
            filterRender: renderFilterStars,
            filterText: true,
            sortable: true,
            filterable: true,
            isInlineEdit: true
        },

        percent: {
            cls: 'percent',
            renderGen: renderGenPercent,
            sortGen: sortGenNumeric,
            filterRender: renderFilterPercent,
            filterText: true,
            sortable: true,
            filterable: true
        },

        url: {
            renderGen: renderGenURL,
            sortPreprocessor: sortHtmlPrepro,
            filterRender: renderFilterURL,
            filterText: true,
            sortable: true,
            filterable: true
        },

        document: {
            renderGen: renderGenDocument
        },

        tag: {
            renderGen: renderGenTags,
            filterRender: renderFilterText,
            filterText: true,
            filterable: true
        },

        email: {
            renderGen: renderGenEmail,
            sortGen: sortGenText,
            filterRender: renderFilterText,
            filterText: true,
            sortable: true,
            filterable: true
        },

        nested_table: {
            renderGen: renderGenText
        },

        picklist: {
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            filterable: true
        }
    });

    // Set editors, but make sure they exist first
    if ($.blistEditor)
    {
        blist.data.types.text.editor = $.blistEditor.text;
        blist.data.types.date.editor = $.blistEditor.date;
        blist.data.types.number.editor = $.blistEditor.number;
        blist.data.types.percent.editor = $.blistEditor.percent;
        blist.data.types.money.editor = $.blistEditor.money;
        blist.data.types.email.editor = $.blistEditor.email;
        blist.data.types.url.editor = $.blistEditor.url;
        blist.data.types.phone.editor = $.blistEditor.phone;
        blist.data.types.flag.editor = $.blistEditor.flag;
        blist.data.types.picklist.editor = $.blistEditor.picklist;
        blist.data.types.checkbox.editor = $.blistEditor.checkbox;
        blist.data.types.stars.editor = $.blistEditor.stars;
        blist.data.types.richtext.editor = $.blistEditor.richtext;
        blist.data.types.document.editor = $.blistEditor.document;
        blist.data.types.photo.editor = $.blistEditor.photo;
        blist.data.types.tag.editor = $.blistEditor.tag;
    }

    for (var name in blist.data.types) {
        var type = blist.data.types[name];
        if (typeof type == "object") {
            type.name = name;
        }
    }
})(jQuery);
