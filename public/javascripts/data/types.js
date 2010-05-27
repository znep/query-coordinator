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

    var renderDate = function(value, format)
    {
        if (value == null) { return ''; }
        var d;
        if (typeof value == 'number') { d = new Date(value * 1000); }
        else { d = Date.parse(value); }
        return d ? d.format(format) : '';
    };

    // Optimized format for date/time rendering (datejs is a very inefficient way to go)
    var OPTIMIZE_FORMAT_DATETIME1 = 'm/d/Y h:i:s A O';
    var renderDate_dateTime1 = function(value) {
        if (value == null) { return ''; }
        var d;
        if (typeof value == 'number') { d = new Date(value * 1000); }
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
        var format = blist.data.types.date.formats[column.format] ||
            blist.data.types.date.formats['date_time'];
        if (format == OPTIMIZE_FORMAT_DATETIME1)
            return "renderDate_dateTime1(" + value + ")";
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
            return "(" + valueLookupVariable + "[(typeof " + value +
                " == 'string' ? " + value + " : '').toLowerCase()] || '')";
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
        var format = blist.data.types.date.formats[column.format] ||
            blist.data.types.date.formats['date_time'];
        return renderDate(value, format);
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
                (valueLookup[value.toLowerCase()]['html'] || '') +
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

    var timeFormat = 'h:i:s A O';
    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        invalid: { renderGen: renderGenEscapedText },

        text: {
            renderGen: renderGenEscapedText,
            sortGen: sortGenText,
            filterRender: renderFilterEscapedText,
            filterText: true,
            group: groupText,
            sortable: true,
            filterable: true,
            deleteable: true
        },

        html: {
            renderGen: renderGenHtml,
            filterRender: renderFilterText,
            sortGen: sortGenText,
            filterText: true,
            sortable: true,
            filterable: true,
            deleteable: true
        },

        number: {
            renderGen: renderGenNumber,
            sortGen: sortGenNumeric,
            filterRender: renderFilterNumber,
            filterText: true,
            cls: 'number',
            sortable: true,
            filterable: true,
            deleteable: true
        },

        date: {
            cls: 'date',
            renderGen: renderGenDate,
            sortGen: sortGenNumeric,
            filterRender: renderFilterDate,
            filterValue: function(v) { return v; },
            sortable: true,
            filterable: true,
            deleteable: true,
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

        photo_obsolete: {
            renderGen: renderGenPhoto,
            cls: 'photo',
            deleteable: true
        },

        photo: {
            renderGen: renderGenPhoto,
            cls: 'photo',
            deleteable: true
        },

        money: {
            renderGen: renderGenMoney,
            sortGen: sortGenNumeric,
            filterRender: renderFilterMoney,
            cls: 'money',
            filterText: true,
            sortable: true,
            filterable: true,
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
            cls: 'phone',
            renderGen: renderGenPhone,
            sortGen: sortGenText,
            filterRender: renderFilterPhone,
            filterText: true,
            sortable: true,
            filterable: true,
            deleteable: true,
            isObject: true
        },

        checkbox: {
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric,
            filterRender: renderFilterCheckbox,
            filterValue: valueFilterCheckbox,
            sortable: true,
            filterable: true,
            deleteable: true,
            isInlineEdit: true
        },

        flag: {
            renderGen: renderGenFlag,
            sortGen: sortGenText,
            filterRender: renderFilterFlag,
            sortable: true,
            filterable: true,
            deleteable: true
        },

        stars: {
            cls: 'stars',
            renderGen: renderGenStars,
            sortGen: sortGenNumeric,
            filterRender: renderFilterStars,
            filterText: true,
            sortable: true,
            filterable: true,
            deleteable: true,
            isInlineEdit: true
        },

        percent: {
            cls: 'percent',
            renderGen: renderGenPercent,
            sortGen: sortGenNumeric,
            filterRender: renderFilterPercent,
            filterText: true,
            sortable: true,
            filterable: true,
            deleteable: true
        },

        url: {
            renderGen: renderGenURL,
            sortPreprocessor: sortHtmlPrepro,
            filterRender: renderFilterURL,
            filterText: true,
            sortable: true,
            filterable: true,
            deleteable: true,
            isObject: true
        },

        document: {
            renderGen: renderGenDocument,
            deleteable: true,
            isObject: true
        },

        document_obsolete: {
            renderGen: renderGenDocument,
            deleteable: true,
            isObject: true
        },

        location: {
            renderGen: renderGenLocation,
            deleteable: true,
            isObject: true,
            renderAddress: renderLocationAddress,
            filterable: true,
            filterRender: renderFilterLocation
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
            filterable: true,
            deleteable: true
        },

        nested_table: {
            renderGen: renderGenText,
            deleteable: true
        },

        picklist: {
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            filterable: true,
            deleteable: true
        },
        drop_down_list: {
            renderGen: renderGenPicklist,
            sortPreprocessor: sortPicklistPrepro,
            filterRender: renderFilterPicklist,
            sortable: true,
            filterable: true,
            deleteable: true
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
        blist.data.types.drop_down_list.editor = $.blistEditor.picklist;
        blist.data.types.checkbox.editor = $.blistEditor.checkbox;
        blist.data.types.stars.editor = $.blistEditor.stars;
        blist.data.types.html.editor = $.blistEditor.html;
        blist.data.types.document.editor = $.blistEditor.document;
        blist.data.types.document_obsolete.editor = $.blistEditor.document;
        blist.data.types.photo.editor = $.blistEditor.photo;
        blist.data.types.photo_obsolete.editor = $.blistEditor.photo;
        blist.data.types.tag.editor = $.blistEditor.tag;
        blist.data.types.location.editor = $.blistEditor.location;
    }

    for (var name in blist.data.types) {
        var type = blist.data.types[name];
        if (typeof type == "object") {
            type.name = name;
        }
    }
})(jQuery);
