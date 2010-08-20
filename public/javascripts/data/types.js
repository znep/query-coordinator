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

    var renderNumber = function(value, decimalPlaces, precisionStyle,
        prefix, suffix, humane)
    {
        if (value == null) { return ''; }

        if (typeof value != "number")
        {
            // Skip this if we already have a number as it is slow
            value = parseFloat(value);
        }

        if (precisionStyle == 'scientific')
        {
            if (decimalPlaces !== undefined)
            { value = value.toExponential(decimalPlaces); }
            else
            { value = value.toExponential(); }
        }
        else if (decimalPlaces !== undefined)
        { value = value.toFixed(decimalPlaces); }

        if (humane === true || humane === 'true')
        {
            value = blist.util.toHumaneNumber(value, 2);
        }
        // HACK HACK HACK
        // Temporary HACK: Don't put commas if a number is less than 10,000.
        // This should help with the display of dates
        else if (value > 9999)
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

        if (prefix) { value = prefix + value; }
        if (suffix) { value += suffix; }

        return value;
    };

    var renderGenNumber = function(value, plain, column) {
        return "renderNumber(" + value + ", " + column.decimalPlaces + ", '" +
            column.precisionStyle + "')";
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
            return "renderNumber(" + value + ", " + column.decimalPlaces +
                ", '" + column.precisionStyle + "', null, '%')";
        }
        var renderText;
        var renderBar;
        switch (column.format) {
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
            rv += " + '<div class=\"blist-cell blist-percent-num\">' + " +
                "renderNumber(" + value + ", " + column.decimalPlaces +
                ", '" + column.precisionStyle + "', null, '%') + '</div>'";
        }
        rv += "+ '</div>'";
        return rv;
    };

    var renderGenMoney = function(value, plain, column) {
        var rv = "renderNumber({0}, {1}, {2}, '{3}', null, {4})".format(
            value,
            column.decimalPlaces || 2,
            column.precisionStyle ? "'" + column.precisionStyle + "'" : 'undefined',
            blist.data.types.money.currencies[column.currency || 'dollar'],
            column.humane || 'false');
        return rv;
    };

    var renderPhone = function(value, plain, skipURL, skipBlankType)
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

        var typeStr = type ? type.toLowerCase() : 'unknown';

        if (plain)
        {
            if (type) { label += " (" + typeStr + ")"; }
            return label;
        }

        label = (skipBlankType && !type ? '' :
            "<div class='blist-phone-icon blist-phone-icon-" +
            typeStr + "'>" + typeStr + "</div>&nbsp;") + htmlEscape(label);

        return skipURL ? label :
            renderURL([ "callto://" + num.replace(/[\-()\s]/g, ''), label ], true);
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

    var renderHtml = function(value)
    {
        if (value == null) { return ''; }
        // Add an extra wrapper so we can tweak the display to something
        // reasoanble
        return '<div class="blist-html">' + value + '</div>';
    };

    var renderGenHtml = function(value, plain)
    {
        return plain ? "htmlStrip(" + value + " || '')"
            : "renderHtml(" + value + " || '')";
    };

    var renderDate = function(value, format, stringParse)
    {
        if (value == null) { return ''; }
        var d;
        if (typeof value == 'number') { d = new Date(value * 1000); }
        else if (!$.isBlank(stringParse))
        { d = Date.parseExact(value, stringParse); }
        else { d = Date.parse(value); }
        return d ? d.format(format) : '';
    };

    // Optimized format for date/time rendering (datejs is a very inefficient
    // way to go)
    var OPTIMIZE_FORMAT_DATETIME1 = 'm/d/Y h:i:s A O';
    var renderDate_dateTime1 = function(value, stringParse)
    {
        if (value == null) { return ''; }
        var d;
        if (typeof value == 'number') { d = new Date(value * 1000); }
        else if (!$.isBlank(stringParse))
        { d = Date.parseExact(value, stringParse); }
        else { d = Date.parse(value); }

        if (!d)
            return '';
        var hour = d.getHours();
        if (hour > 11) {
            hour -= 12;
            var meridian = ' PM';
        } else
            meridian = ' AM';
        if (!hour)
            hour = 12;
        if (hour < 10)
            hour = "0" + hour;
        var minute = d.getMinutes();
        if (minute < 10)
            minute = "0" + minute;
        var second = d.getSeconds();
        if (second < 10)
            second = "0" + second;
        var day = d.getDate();
        if (day < 10)
            day = "0" + day;
        var month = d.getMonth() + 1;
        if (month < 10)
            month = "0" + month;
        return month + "/" + day + "/" + d.getFullYear() + " " + hour + ":" + minute + ":" + second + meridian + " " + d.getUTCOffset();
    }

    var renderGenDate = function(value, plain, column)
    {
        var type = blist.data.types[column.type] || blist.data.types.date;
        var format = type.formats[column.format] || type.formats['date_time'];
        if (format == OPTIMIZE_FORMAT_DATETIME1)
        {
            return "renderDate_dateTime1(" + value + ", '" +
                (type.stringParse || '') + "')";
        }
        return "renderDate(" + value + ", '" + format + "', '" +
            (type.stringParse || '') + "')";
    };


    var renderPicklist = function(valueLookupVariable, value)
    {
        if (typeof value == 'string')
        {
            return valueLookupVariable[value.toLowerCase()] ||
                '<div class="blist-dataset-link-dangling">{0}</div>'.format(value);
        }

        return '';
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

            return "(renderPicklist(" + valueLookupVariable + "," + value + "))";
        }
        return "'?'";
    };

    var renderURL = function(value, captionIsHTML, plain)
    {
        if (!value) { return ''; }
        var url;
        var caption;
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
        else { caption = url = value + ''; }

        if (url && url != '' && !url.match(/^([a-z]+):/i) &&
                url.indexOf('/') != 0)
        { url = 'http://' + url; }

        if (plain) { return url || ''; }

        if (!captionIsHTML) { caption = htmlEscape(caption); }
        return "<a target='blist-viewer' rel='external' href='" +
            htmlEscape(url) + "'>" + caption + "</a>";
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
            if (value.id)
            { // old-style document
                url = value.id;
                name = value.filename;
                size = value.size;
            }
            else
            { // new-style document
                url = value.file_id + '?';
                args=[];
                if(value.filename) args.push('filename=' + escape(value.filename));
                if(value.content_type) args.push('content_type=' + escape(value.content_type));
                url += args.join('&');
                name = value.filename;
                size = value.size;
            }
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


    var renderLocation = function(value, plain, addressOnly)
    {
        if ($.isBlank(value)) { return ''; }

        var pieces = [];
        if (!$.isBlank(value.human_address))
        {
            var a = JSON.parse(value.human_address);
            if (!$.isBlank(a.address) && a.address !== '')
            { pieces.push(a.address); }
            pieces.push(_.compact([_.compact([a.city, a.state]).join(', '),
                a.zip]).join(' '));
        }

        if (!addressOnly &&
            (!$.isBlank(value.latitude) || !$.isBlank(value.longitude)))
        {
            pieces.push('(' + (value.latitude || '') + (plain ? '' : '&deg;') +
                ', ' + (value.longitude || '') + (plain ? '' : '&deg;') + ')');
        }

        return pieces.join(plain ? ' \n' : '<br />');
    };

    var renderLocationAddress = function(value, plain)
    {
        return renderLocation(value, plain, true);
    };

    var renderGenLocation = function(value, plain)
    {
        return 'renderLocation(' + value + ', ' + plain + ')';
    };

    /** FILTER RENDERERS ***/
    var renderFilterText = function(value)
    {
        return htmlStrip((value || '') + '');
    };

    var renderFilterEscapedText = function(value)
    {
        return htmlEscape(htmlStrip((value || '') + ''));
    };

    var renderFilterNumber = function(value, column)
    {
        return renderNumber(value, column.decimalPlaces, column.precisionStyle);
    };

    var renderFilterDate = function(value, column)
    {
        var type = blist.data.types[column.type || column.renderTypeName] ||
            blist.data.types.date;
        var format = type.formats[_.isString(column.format) ? column.format :
            (column.format || {}).view] || type.formats['date_time'];
        return renderDate(value, format, type.stringParse);
    };

    var renderFilterMoney = function(value, column)
    {
        return renderNumber(value, (column.decimalPlaces || 2),
            column.precisionStyle,
            blist.data.types.money.currencies[column.currency || 'dollar'],
            null,
            column.humane);
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
        return renderNumber(value, column.decimalPlaces, column.precisionStyle,
            null, '%');
    };

    var renderFilterURL = function(value)
    {
        if (!value) { return ''; }

        if (typeof value == "object") { return value[1] || value[0]; }
        // Else, cast to a string & strip HTML
        return htmlStrip(value || '');
    };

    var renderFilterPicklist = function(value, column)
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
                ( (valueLookup[value.toLowerCase()] || {})['html'] || '') +
                "</div>";
        }
        return '?';
    };

    var renderFilterPhone = function(value, column, subType)
    {
        var args = {};
        args[subType] = value;
        return renderPhone(args, false, true, true);
    };

    var renderFilterLocation = function(value, column, subType)
    {
        if (subType == 'machine_address' || subType == 'needs_recoding')
        { return ''; }

        if (subType == 'human_address')
        { return renderLocationAddress({human_address: value}, true); }

        return renderFilterText(value);
    };

    /*** DATA TYPE DEFINITIONS ***/

    var timeFormat = 'h:i:s A';
    var zTimeFormat = timeFormat + ' O';
    var baseDTFormats = {
        'date': 'm/d/Y',
        'date_time': 'm/d/Y',
        'date_dmy': 'd/m/Y',
        'date_dmy_time': 'd/m/Y',
        'date_ymd': 'Y/m/d',
        'date_ymd_time': 'Y/m/d',
        'date_monthdy': 'F d, Y',
        'date_dmonthy': 'd F Y',
        'date_ymonthd': 'Y F d'
    };
    var dateTimeFormats = {};
    var zDateTimeFormats = {};
    _.each(baseDTFormats, function(v, k)
    {
        dateTimeFormats[k] = v;
        zDateTimeFormats[k] = v;
        if (k.endsWith('_time'))
        {
            dateTimeFormats[k] += ' ' + timeFormat;
            zDateTimeFormats[k] += ' ' + zTimeFormat;
        }
    });

    var aggs = [
        {text: 'Average', value: 'average'},
        {text: 'Count', value: 'count'},
        {text: 'Sum', value: 'sum'},
        {text: 'Maximum', value: 'maximum'},
        {text: 'Minimum', value: 'minimum'}
    ];

    var nonNumericAggs = _.select(aggs, function(a)
    { return 'count' == a.value; });

    var filterConditions = {
        textual:    [ { value: "EQUALS", text: "equals" },
                      { value: "NOT_EQUALS", text: "does not equal" },
                      { value: "STARTS_WITH", text: "starts with" },
                      { value: "CONTAINS", text: "contains" },
                      { value: "IS_NOT_BLANK", text: "is not blank" },
                      { value: "IS_BLANK", text: "is blank" }
                    ],
        date:       [ { value: "EQUALS", text: "on" },
                      { value: "NOT_EQUALS", text: "not on" },
                      { value: "LESS_THAN", text: "before" },
                      { value: "GREATER_THAN", text: "after" },
                      { value: "BETWEEN", text: "between" },
                      { value: "IS_NOT_BLANK", text: "is not blank" },
                      { value: "IS_BLANK", text: "is blank" }
                    ],
        comparable: [ { value: "EQUALS", text: "equals" },
                      { value: "IS_NOT_BLANK", text: "is not blank" },
                      { value: "IS_BLANK", text: "is blank" }
                    ],
        blob:       [ { value: "IS_BLANK", text: "is empty" },
                      { value: "IS_NOT_BLANK", text: "exists" } ],
        numeric:    [ { value: "EQUALS", text: "equals" },
                      { value: "NOT_EQUALS", text: "not equals" },
                      { value: "LESS_THAN", text: "less than" },
                      { value: "LESS_THAN_OR_EQUALS",
                        text: "less than or equal to" },
                      { value: "GREATER_THAN", text: "greater than" },
                      { value: "GREATER_THAN_OR_EQUALS",
                        text: "greater than or equal to" },
                      { value: "BETWEEN", text: "between" },
                      { value: "IS_NOT_BLANK", text: "is not blank" },
                      { value: "IS_BLANK", text: "is blank" }
                    ]
    };

    var alignLeft = {text: 'Left', value: 'left'};
    var alignCenter = {text: 'Center', value: 'center'};
    var alignRight ={text: 'Right', value: 'right'};

    var alignment = [alignLeft, alignCenter, alignRight];
    var numericAlignment = [alignRight, alignLeft, alignCenter];

    var dateViews = [
        {value: 'date', text: 'month/day/year'},
        {value: 'date_time', text: 'month/day/year hour:minute'},
        {value: 'date_dmy', text: 'day/month/year'},
        {value: 'date_dmy_time', text: 'day/month/year hour:minute'},
        {value: 'date_ymd', text: 'year/month/day'},
        {value: 'date_ymd_time', text: 'year/month/day hour:minute'},
        {value: 'date_monthdy', text: 'month day, year'},
        {value: 'date_dmonthy', text: 'day month year'},
        {value: 'date_ymonthd', text: 'year month day'}
    ];

    var numericConvertTypes = ['money', 'number', 'percent', 'stars'];

    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        invalid: { renderGen: renderGenEscapedText },

        text: {
            title: 'Plain Text',
            priority: 1,
            createable: true,
            renderGen: renderGenEscapedText,
            sortGen: sortGenText,
            filterRender: renderFilterEscapedText,
            filterText: true,
            group: groupText,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['html', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link'].concat(numericConvertTypes),
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        html: {
            title: 'Formatted Text',
            priority: 2,
            createable: true,
            renderGen: renderGenHtml,
            filterRender: renderFilterText,
            sortGen: sortGenText,
            filterText: true,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            convertableTypes: ['text', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link'].concat(numericConvertTypes),
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        number: {
            title: 'Number',
            priority: 3,
            createable: true,
            renderGen: renderGenNumber,
            sortGen: sortGenNumeric,
            filterRender: renderFilterNumber,
            filterText: true,
            cls: 'number',
            sortable: true,
            aggregates: aggs,
            rollUpAggregates: aggs,
            alignment: numericAlignment,
            convertableTypes: _.without(numericConvertTypes, 'number')
                .concat('text').concat('dataset_link'),
            precisionStyle: [{text: 'Standard (1,020.4)', value: 'standard'},
                {text: 'Scientific (1.0204e+3)', value: 'scientific'}],
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true
        },

        date: {
            title: 'Date & Time (with timezone)',
            priority: 7,
            createable: true,
            cls: 'date',
            renderGen: renderGenDate,
            sortGen: sortGenNumeric,
            filterRender: renderFilterDate,
            filterValue: function(v) { return v; },
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'calendar_date'],
            viewTypes: dateViews,
            filterable: true,
            filterConditions: filterConditions.date,
            deleteable: true,
            group: groupDate,
            formats: zDateTimeFormats
        },

        calendar_date: {
            title: 'Date & Time',
            priority: 6,
            createable: true,
            cls: 'date',
            renderGen: renderGenDate,
            sortGen: sortGenNumeric,
            filterRender: renderFilterDate,
            filterValue: function(v) { return v; },
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'date'],
            viewTypes: dateViews,
            filterable: true,
            filterConditions: filterConditions.date,
            deleteable: true,
            group: groupDate,
            formats: dateTimeFormats,
            stringFormat: 'yyyy-MM-ddTHH:mm:ss'
        },

        photo_obsolete: {
            title: 'Photo (Image, old)',
            renderGen: renderGenPhoto,
            cls: 'photo',
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true
        },

        photo: {
            title: 'Photo (Image)',
            priority: 16,
            createable: true,
            renderGen: renderGenPhoto,
            cls: 'photo',
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true
        },

        money: {
            title: 'Money',
            priority: 4,
            createable: true,
            renderGen: renderGenMoney,
            sortGen: sortGenNumeric,
            filterRender: renderFilterMoney,
            cls: 'money',
            filterText: true,
            sortable: true,
            aggregates: aggs,
            rollUpAggregates: aggs,
            alignment: numericAlignment,
            convertableTypes: _.without(numericConvertTypes, 'money')
                .concat('text'),
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true,
            currencies: {
                'dollar': "$",
                'pound': "£",
                'euro': "€",
                'yen': "¥",
                'forint': "Ft",
                'hk_dollar': "HK$",
                'kuna': "Kn",
                'koruna': "Kč",
                'lats': "Ls",
                'litas': "Lt",
                'nt_dollar': "NT$",
                'peso': "PhP",
                'real': "R$",
                'rupiah': "Rp",
                'rupee': "Rs.",
                'koruna': "Sk",
                'lira': "TL",
                'new_lira': "YTL",
                'krone': "kr",
                'lei_noi': "lei",
                'zloty': "zł",
                'baht': "฿",
                'dong': "₫",
                'won': "₩",
                'ruble': "р.",
                'lev': "лв.",
                'dinar': "Дин.",
                'hryvnia': "грн."
            }
        },

        phone: {
            title: 'Phone',
            priority: 14,
            createable: true,
            cls: 'phone',
            renderGen: renderGenPhone,
            sortGen: sortGenText,
            filterRender: renderFilterPhone,
            filterText: true,
            sortable: true,
            alignment: alignment,
            convertableTypes: ['text'],
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true,
            isObject: true
        },

        checkbox: {
            title: 'Checkbox',
            priority: 11,
            createable: true,
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric,
            filterRender: renderFilterCheckbox,
            filterValue: valueFilterCheckbox,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: [alignCenter, alignLeft, alignRight],
            convertableTypes: ['text'],
            filterable: true,
            filterConditions: filterConditions.comparable,
            deleteable: true,
            isInlineEdit: true
        },

        flag: {
            title: 'Flag',
            priority: 12,
            createable: true,
            renderGen: renderGenFlag,
            sortGen: sortGenText,
            filterRender: renderFilterFlag,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            filterable: true,
            filterConditions: filterConditions.comparable,
            deleteable: true
        },

        stars: {
            title: 'Star',
            priority: 13,
            createable: true,
            cls: 'stars',
            renderGen: renderGenStars,
            sortGen: sortGenNumeric,
            filterRender: renderFilterStars,
            filterText: true,
            sortable: true,
            aggregates: _.reject(aggs, function(a)
                { return a.value == 'sum'; }),
            rollUpAggregates: _.reject(aggs, function(a)
                { return a.value == 'sum'; }),
            alignment: alignment,
            convertableTypes: _.without(numericConvertTypes, 'stars')
                .concat('text'),
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true,
            isInlineEdit: true
        },

        percent: {
            title: 'Percent',
            priority: 5,
            createable: true,
            cls: 'percent',
            renderGen: renderGenPercent,
            sortGen: sortGenNumeric,
            filterRender: renderFilterPercent,
            filterText: true,
            sortable: true,
            aggregates: aggs,
            rollUpAggregates: aggs,
            alignment: numericAlignment,
            convertableTypes: _.without(numericConvertTypes, 'percent')
                .concat('text'),
            viewTypes: [{value: 'percent_bar_and_text', text: 'Bar &amp; Text' },
                { value: 'percent_bar', text: 'Bar Only' },
                { value: 'percent_text', text: 'Text Only' }],
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true
        },

        url: {
            title: 'Website URL',
            priority: 9,
            createable: true,
            renderGen: renderGenURL,
            sortPreprocessor: sortHtmlPrepro,
            filterRender: renderFilterURL,
            filterText: true,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'dataset_link'],
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true,
            isObject: true
        },

        document: {
            title: 'Document',
            priority: 17,
            createable: true,
            renderGen: renderGenDocument,
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true,
            isObject: true
        },

        document_obsolete: {
            title: 'Document (old)',
            renderGen: renderGenDocument,
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true,
            isObject: true
        },

        location: {
            title: 'Location',
            priority: 8,
            createable: true,
            renderGen: renderGenLocation,
            deleteable: true,
            isObject: true,
            alignment: alignment,
            renderAddress: renderLocationAddress,
            filterable: true,
            filterConditions: filterConditions.comparable,
            filterRender: renderFilterLocation
        },

        tag: {
            title: 'Row Tag',
            priority: 19,
            renderGen: renderGenTags,
            aggregates: nonNumericAggs,
            filterRender: renderFilterText,
            filterText: true,
            filterable: true,
            filterConditions: filterConditions.textual
        },

        email: {
            title: 'Email',
            priority: 10,
            createable: true,
            renderGen: renderGenEmail,
            sortGen: sortGenText,
            filterRender: renderFilterText,
            filterText: true,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        nested_table: {
            title: 'Nested Table',
            priority: 18,
            createable: true,
            excludeInNestedTable: true,
            renderGen: renderGenText,
            deleteable: true
        },

        picklist: {
            title: 'Multiple Choice',
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true
        },
        drop_down_list: {
            title: 'Multiple Choice',
            priority: 15,
            createable: true,
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            filterable: true,
            filterConditions: filterConditions.numeric,
            deleteable: true
        },
        dataset_link: {
            title: 'Dataset Link',
            priority: 19, // haven't check what priority does yet.
            createable: true,
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            filterable: true,
            filterConditions: filterConditions.textual,
            convertableTypes: ['text'],
            deleteable: true
        }
    });

    for (var name in blist.data.types) {
        var type = blist.data.types[name];
        if (typeof type == "object") {
            type.name = name;
        }
    }
})(jQuery);
