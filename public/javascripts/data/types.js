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


    /*** RENDERERS ***/

    // Text

    var renderText = function(value)
    {
        return htmlEscape(value);
    };

    var renderGenText = function(value)
    {
        // Blist text is currently returned with character entities escaped
        //return "htmlEscape(" + value + ")";
        return "(" + value + " || '')";
    };

    var renderGenEscapedText = function(value)
    { return "htmlEscape(" + value + " || '')"; };

    var renderGenTags = function(value)
    {
        return value + ' && ' + value + ' != "" ? "<div class=\'blist-tag\' ' +
            'title=\'" + htmlEscape(' + value + ' || "") + "\'></div>" : ""';
    };

    var renderTags = function(value)
    {
        return htmlEscape((value || []).join(', '));
    };

    var renderHtml = function(value, col, plain)
    {
        if ($.isBlank(value)) { return ''; }
        if (plain) { return htmlStrip(value); }
        // Add an extra wrapper so we can tweak the display to something
        // reasoanble
        return '<span class="blist-html">' + value + '</span>';
    };

    var renderGenHtml = function(value, plain)
    {
        return "renderHtml(" + value + ", null, " + plain + ")";
    };

    var renderFilterText = function(value)
    {
        return htmlStrip((value || '') + '');
    };

    var renderFilterEscapedText = function(value)
    {
        return htmlEscape(htmlStrip((value || '') + ''));
    };

    var renderObject = function(value)
    {
        return htmlEscape(value ? JSON.stringify(value) : '');
    };

    var renderGenObject = function(value)
    {return "htmlEscape(" + value + " ? JSON.stringify(" + value + ") : '')";};

    // Numeric

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

    var numberHelper = function(value, decimalPlaces, precisionStyle,
        prefix, suffix, humane, noCommas)
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
        else if (noCommas !== true && noCommas != 'true')
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

        if (prefix) { value = prefix + value; }
        if (suffix) { value += suffix; }

        return value;
    };

    var renderGenNumber = function(value, plain, column) {
        return "numberHelper(" + value + ", " +
            (column.format || {}).precision + ", '" +
            (column.format || {}).precisionStyle + "', null, null, false, " +
            column.format.noCommas + ")";
    };

    var renderNumber = function(value, column)
    {
        return numberHelper(value, column.format.precision,
            column.format.precisionStyle, null, null, false,
            column.format.noCommas);
    };

    var renderPercentBar = function(value)
    {
        if (!value) { return ""; }
        var cls;
        if (value > 0) { cls = 'blist-percent-bar-pos'; }
        else
        {
            cls = 'blist-percent-bar-neg';
            value *= -1;
        }
        if (value > 100) { value = 100; }
        return "<span class='blist-cell " + cls + "' style='width: " +
            value + "%'></span>";
    };

    var percentHelper = function(value, view, precision, precisionStyle, noCommas)
    {
        var renderText;
        var renderBar;
        switch (view)
        {
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
        var rv = '<span class="blist-percent">';
        if (renderBar)
        { rv += renderPercentBar(value); }
        if (renderText)
        {
            rv += '<span class="blist-cell blist-percent-num">' +
                numberHelper(value, precision, precisionStyle, null, '%', false,
                    noCommas) +
                '</span>';
        }
        rv += '</span>';
        return rv;
    };

    var renderGenPercent = function(value, plain, column)
    {
        if (plain)
        {
            return "numberHelper(" + value + ", " + column.format.precision +
                ", '" + column.format.precisionStyle + "', null, '%', false, " +
                column.format.noCommas + ")";
        }
        return "percentHelper(" + value + ", '" + column.format.view + "', " +
            column.format.precision + ", '" +
            column.format.precisionStyle + "', " + column.format.noCommas + ")";
    };

    var renderPercent = function(value, column, plain)
    {
        if (plain)
        {
            return numberHelper(value, column.format.precision,
                column.format.precisionStyle, null, '%', false,
                column.format.noCommas);
        }
        return percentHelper(value, column.format.view, column.format.precision,
            column.format.precisionStyle, column.format.noCommas);
    };

    var renderFilterPercent = function(value, column)
    {
        return numberHelper(value, column.format.precision,
            column.format.precisionStyle, null, '%', false,
            column.format.noCommas);
    };

    var renderGenMoney = function(value, plain, column) {
        var rv = "numberHelper({0}, {1}, {2}, '{3}', null, {4})".format(
            value,
            column.format.precision || 2,
            column.format.precisionStyle ? "'" + column.format.precisionStyle +
                "'" : 'undefined',
            blist.data.types.money.currencies[column.format.currency || 'USD'],
            column.format.humane || 'false');
        return rv;
    };

    var renderMoney = function(value, column)
    {
        return numberHelper(value, (column.format.precision || 2),
            column.format.precisionStyle,
            blist.data.types.money.currencies[column.format.currency || 'USD'],
            null,
            column.format.humane);
    };


    // Phone

    var phoneHelper = function(value, plain, skipURL, skipBlankType)
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
            "<span class='blist-phone-icon blist-phone-icon-" +
            typeStr + "'>" + typeStr + "</span>&nbsp;") + htmlEscape(label);

        return skipURL ? label :
            urlHelper([ "callto://" + num.replace(/[\-()\s]/g, ''), label ], true);
    };

    var renderGenPhone = function(value, plain)
    {
        return "phoneHelper(" + value + ", " + plain + ")";
    };

    var renderPhone = function(value, column)
    {
        return phoneHelper(value);
    };

    var renderFilterPhone = function(value, column, subType)
    {
        var args = {};
        args[subType] = value;
        return phoneHelper(args, false, true, true);
    };


    // Checkbox

    var checkboxHelper = function(value, includeTitle)
    {
        return "<span class='blist-cell blist-checkbox blist-checkbox-" +
                (value ? 'on' : 'off') + "'" + (includeTitle ? " title='" +
                (value ? 'True' : 'False') : '') + "'>" +
                (value ? 'True' : 'False') + "</span>";
    };

    var renderGenCheckbox = function(value, plain, column)
    {
        if (plain) { return value + " ? '&#10003;' : ''"; }
        return "checkboxHelper(" + value + ", true)";
    };

    var renderCheckbox = function(value)
    {
        return checkboxHelper(value, true);
    };

    var renderFilterCheckbox = function(value)
    {
        return checkboxHelper(value, false);
    };


    // Flag

    var renderGenFlag = function(value, plain)
    {
        if (plain) { return value + " || ''"; }
        return value + " && (\"<div class='blist-flag blist-flag-\" + " +
            value + " + \"' title='\" + " + value + " + \"'></div>\")";
    };

    var renderFlag = function(value, column)
    {
        return value && "<span class='blist-flag blist-flag-" + value +
            "'>" + value + "</span>";
    };


    // Date

    var dateHelper = function(value, format, stringParse)
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
        var type = column.renderType;
        var format = type.formats[column.format.view] || type.formats['date_time'];
        if (format == OPTIMIZE_FORMAT_DATETIME1)
        {
            return "renderDate_dateTime1(" + value + ", '" +
                (type.stringParse || '') + "')";
        }
        return "dateHelper(" + value + ", '" + format + "', '" +
            (type.stringParse || '') + "')";
    };

    var renderDate = function(value, column)
    {
        var type = column.renderType || blist.data.types.date;
        var format = type.formats[column.format.view] || type.formats['date_time'];
        return dateHelper(value, format, type.stringParse);
    };


    // Drop down list (& related)

    var generateDropDownLookup = function(column)
    {
        var valueLookup = {};
        _.each(column.dropDownList.values, function(opt)
        {
            if ($.isBlank(opt.id)) { return; }

            var icon = opt.icon;
            if (icon)
            {
                icon = "<img class='blist-table-option-icon' src='" +
                    icon + "' /> ";
            }
            else
            {
                icon = "";
            }
            valueLookup[opt.id.toLowerCase()] = {};
            valueLookup[opt.id.toLowerCase()].text =
                htmlStrip(opt.description || '');
            valueLookup[opt.id.toLowerCase()].html =
                icon + htmlStrip(opt.description || '');
        });
        return valueLookup;
    };

    var picklistHelper = function(valueLookupVariable, value, plain)
    {
        if (typeof value == 'string')
        {
            var v = valueLookupVariable[value.toLowerCase()];
            return (v && v[plain ? 'text' : 'html']) ||
                '<div class="blist-dataset-link-dangling">{0}</div>'.format(value);
        }

        return '';
    };

    var renderPicklist = function(value, column, plain)
    {
        if (column.dropDownList)
        {
            var valueLookup = generateDropDownLookup(column);
            var descVal = (valueLookup[(value || '').toLowerCase()] || {})
                    [plain ? 'text' : 'html'] || value || '';
            return plain ? descVal :
                "<span class='blist-picklist-wrapper'>" + descVal + "</span>";
        }
        return '?';
    };

    var renderGenPicklist = function(value, plain, column, context)
    {
        var valueLookupVariable = createUniqueName();
        if (column.dropDownList)
        {
            context[valueLookupVariable] = generateDropDownLookup(column);
            return "(picklistHelper(" + valueLookupVariable + "," + value + "," +
                plain + "))";
        }
        return "'?'";
    };


    // URL

    var urlHelper = function(value, captionIsHTML, plain, baseUrl)
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

        if (url && url != '' && !url.match(/^([a-z]+):/i))
        {
            if (!$.isBlank(baseUrl))
            { url = baseUrl + url; }
            else if (url.indexOf('/') != 0)
            { url = 'http://' + url; }
        }

        if (plain) { return url || ''; }

        if (!captionIsHTML) { caption = htmlEscape(caption); }
        return "<a target='blist-viewer' rel='external' href='" +
            htmlEscape(url) + "'>" + caption + "</a>";
    };

    var renderGenURL = function(value, plain, column)
    {
        return "urlHelper(" + value + ", false, " + plain + ", '" +
            (column.format || {}).baseUrl + "')";
    };

    var renderURL = function(value, column, plain)
    {
        return urlHelper(value, false, plain, (column.format || {}).baseUrl);
    };

    var renderFilterURL = function(value)
    {
        if (!value) { return ''; }

        // Do we get arrays anymore?
        if (_.isArray(value)) { return value[1] || value[0]; }
        // Probably have an object
        else if ($.isPlainObject(value)) { return value.description || value.url; }
        // Else, cast to a string & strip HTML
        return htmlStrip(value || '');
    };


    // Email

    var emailHelper = function(value)
    {
        return urlHelper(value && ['mailto:' + value , value]);
    };

    var renderGenEmail = function(value, plain)
    {
        if (plain) { return value; }
        return "emailHelper(" + value + ")";
    };

    var renderEmail = function(value, col, plain)
    {
        return plain ? value : emailHelper(value);
    };


    // Stars

    var starsHelper = function(value, range, canEdit)
    {
        if (value == null) { return ''; }
        if (range <= 0 || isNaN(range)) { range = 5; }
        range *= STAR_WIDTH;
        var on = Math.round(value * STAR_WIDTH);
        if (on <= 0) { return ''; }
        else if (on > range) { on = range; }
        var off = range - on;
        return "<span class='blist-tstars-render-wrapper' style='width:" +
            range + "px'>" +
            (canEdit ?  "<span class='blist-star-0'></span>" : "") +
            "<span class='blist-tstars' style='width: " + range +
            "px'><span class='blist-cell blist-tstar-on' style='width: " + on +
            "px'></span><span class='blist-cell blist-tstar-off' style='width: " +
            off + "px; background-position-x: " + -(on % STAR_WIDTH) +
            "px'></span></span></span>";
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
        var range = parseFloat(column.format.range);
        return "starsHelper(" + value + ", " + range + ", permissions.canEdit)";
    };

    var renderStars = function(value, column)
    {
        var range = parseFloat(column.format.range);
        return starsHelper(value, range);
    };

    var renderFilterStars = function(value, column)
    {
        var range = parseFloat(column.format.range);
        return "<div class='blist-tstars-wrapper'>" +
            starsHelper(value, range) + value + "</div>";
    };


    // Photo & Document

    var renderGenPhoto = function(value, plain, column)
    {
        var url = "'" + column.baseUrl() + "' + " + value;
        if (plain)
        {
            // TODO: I guess we might want something else for copy?
            return url;
        }
        return value + " && ('<img src=\"' + escape(" + url + ") + '\"></img>')";
    };

    var renderPhoto = function(value, column)
    {
        return '<img src="' + escape(column.baseUrl() + value) + '"></img>';
    };

    var documentHelper = function(value, base, plain)
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
                if(value.content_type) args.push('content_type=' +
                    escape(value.content_type));
                url += args.join('&');
                name = value.filename;
                size = value.size;
            }
        }
        else { url = value + ''; }

        if (!url) { return ''; }
        if (plain) { return name || ''; }

        var rv = urlHelper([ (base || '') + url, name || 'Document' ]);
        if (size != null)
        {
            size = Math.round(size / 1024);
            if (size == 0) { size = 1; }
            rv += "&nbsp;<span class='blist-document-size'>(" + size + "k)</span>";
        }
        return rv;
    };

    var renderGenDocument = function(value, plain, column)
    {
        return "documentHelper(" + value + ", " + "'" + column.baseUrl() +
            "'" + ", " + plain + ")";
    };

    var renderDocument = function(value, column)
    {
        return documentHelper(value, column.baseUrl());
    };


    // Location

    var locationHelper = function(value, plain, view)
    {
        if ($.isBlank(value)) { return ''; }

        if ($.isBlank(view)) { view = 'address_coords'; }

        var pieces = [];
        if (!$.isBlank(value.human_address) && view.startsWith('address'))
        {
            var a = JSON.parse(value.human_address);
            if (!$.isBlank(a.address) && a.address !== '')
            { pieces.push(a.address); }
            pieces.push(_.compact([_.compact([a.city, a.state]).join(', '),
                a.zip]).join(' '));
        }

        if (view.endsWith('coords') &&
            (!$.isBlank(value.latitude) || !$.isBlank(value.longitude)))
        {
            pieces.push('(' + (value.latitude || '') + (plain ? '' : '&deg;') +
                ', ' + (value.longitude || '') + (plain ? '' : '&deg;') + ')');
        }

        return pieces.join(plain ? ' \n' : '<br />');
    };

    var renderLocationAddress = function(value, plain)
    {
        return locationHelper(value, plain, 'address');
    };

    var renderGenLocation = function(value, plain, column)
    {
        return 'locationHelper(' + value + ', ' + plain + ', "' + column.format.view + '")';
    };

    var renderLocation = function(value, column, plain)
    {
        return locationHelper(value, plain, column.format.view);
    };

    var renderFilterLocation = function(value, column, subType)
    {
        if (subType == 'machine_address' || subType == 'needs_recoding')
        { return ''; }

        if (subType == 'human_address')
        { return renderLocationAddress({human_address: value}, true); }

        return renderFilterText(value);
    };

    // Geospatial

    var geospatialRendererInterval;
    var geospatialHelper = function(value, base_url, columnId)
    {
        if ($.isBlank(value)) { return ''; }

        var rv = '';
        if (!$.isBlank(value.geometry))
        {
            var width  = '60';
            var height = '150';
            var image_url = $.addAppToken(base_url+value.row_id+'?column='+columnId+
                '&width='+width+'&height='+height);
            if ($.browser.msie)
            { rv += '<v:vmlframe src="' + image_url + '&type=vml#shape01" ' +
                'style="width:' + width + 'px; height:' + height + 'px;"/>'; }
            else
            { rv += '<embed src="' + image_url + '" width="' + width +
                '" height="' + height + '"></embed>'; }
        }

        return rv;
    };

    var renderGenGeospatial = function(value, plain, column)
    {
        return 'geospatialHelper(' + value + ', "' + column.baseUrl() + '", ' +
            column.id + ')';
    };

    var renderGeospatial = function(value, column)
    {
        return geospatialHelper(value, column.baseUrl(), column.id);
    };

    /** FILTER FUNCTIONS ***/
    var valueFilterCheckbox = function(value)
    {
        return value ? 1 : 0;
    };

    /*** DATA TYPE DEFINITIONS ***/

    var shortTimeFormat = 'h:i A';
    var zShortTimeFormat = shortTimeFormat + ' O';
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
        'date_monthdy_time': 'F d, Y',
        'date_monthdy_shorttime': 'F d, Y',
        'date_shortmonthdy': 'M d, Y',
        'date_shortmonthdy_shorttime': 'M d, Y',
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
        else if (k.endsWith('_shorttime'))
        {
            dateTimeFormats[k] += ' ' + shortTimeFormat;
            zDateTimeFormats[k] += ' ' + zShortTimeFormat;
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

    // NOTE: New filter types also need an analogue template in
    // controls/maps/external-esri-map.js#transformFilterToLayerDefinition
    // -- michael.chui@socrata.com
    var filterConditions = {
        textual:    [ { value: "EQUALS", text: "equals" },
                      { value: "NOT_EQUALS", text: "does not equal" },
                      { value: "STARTS_WITH", text: "starts with" },
                      { value: "CONTAINS", text: "contains" },
                      { value: "NOT_CONTAINS", text: "does not contain" },
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
        {value: 'date_monthdy_shorttime', text: 'month day, year hour:minute'},
        {value: 'date_monthdy_time', text: 'month day, year hour:minute'},
        {value: 'date_shortmonthdy', text: 'month day, year'},
        {value: 'date_shortmonthdy_shorttime', text: 'month day, year hour:minute'},
        {value: 'date_dmonthy', text: 'day month year'},
        {value: 'date_ymonthd', text: 'year month day'}
    ];

    var numericConvertTypes = ['money', 'number', 'percent', 'stars'];

    /**
     * This is our main map of data types.
     */
    $.extend(blist.data.types, {
        invalid: {
            renderGen: renderGenEscapedText,
            renderer: renderText
        },

        text: {
            title: 'Plain Text',
            priority: 1,
            createable: true,
            renderGen: renderGenEscapedText,
            renderer: renderText,
            sortGen: sortGenText,
            filterRender: renderFilterEscapedText,
            filterText: true,
            inlineType: true,
            group: groupText,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['html', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        html: {
            title: 'Formatted Text',
            priority: 2,
            createable: true,
            renderGen: renderGenHtml,
            renderer: renderHtml,
            filterRender: renderFilterText,
            sortGen: sortGenText,
            filterText: true,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            convertableTypes: ['text', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
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
            renderer: renderNumber,
            filterRender: renderNumber,
            filterText: true,
            inlineType: true,
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
            renderer: renderDate,
            filterRender: renderDate,
            filterValue: function(v) { return v; },
            inlineType: true,
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
            renderer: renderDate,
            filterRender: renderDate,
            filterValue: function(v) { return v; },
            inlineType: true,
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
            // Giving an exact format to parse is quite a bit faster
            // than a general parse (at least in FF; not as much for IE)
            stringParse: 'yyyy-MM-ddTHH:mm:ss',
            stringFormat: 'yyyy-MM-ddTHH:mm:ss'
        },

        photo_obsolete: {
            title: 'Photo (Image, old)',
            renderGen: renderGenPhoto,
            renderer: renderPhoto,
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
            renderer: renderPhoto,
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
            renderer: renderMoney,
            filterRender: renderMoney,
            cls: 'money',
            filterText: true,
            inlineType: true,
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
                "USD": "$",
                "GBP": "£",
                "EUR": "€",
                "JPY": "¥",
                "AFN": "؋",
                "ALL": "Lek",
                "ANG": "ƒ",
                "ARS": "$",
                "AUD": "$",
                "AWG": "ƒ",
                "AZN": "ман",
                "BAM": "KM",
                "BBD": "$",
                "BGN": "лв",
                "BMD": "$",
                "BND": "$",
                "BOB": "$b",
                "BRL": "R$",
                "BSD": "$",
                "BWP": "P",
                "BYR": "p.",
                "BZD": "BZ$",
                "CAD": "$",
                "CHF": "CHF",
                "CLP": "$",
                "CNY": "¥",
                "COP": "$",
                "CRC": "₡",
                "CUP": "₱",
                "CZK": "Kč",
                "DKK": "kr",
                "DOP": "RD$",
                "EEK": "kr",
                "EGP": "£",
                "FJD": "$",
                "FKP": "£",
                "GGP": "£",
                "GHC": "¢",
                "GIP": "£",
                "GTQ": "Q",
                "GYD": "$",
                "HKD": "$",
                "HNL": "L",
                "HRK": "kn",
                "HUF": "Ft",
                "INR": "Rp",
                "ILS": "₪",
                "IMP": "£",
                "IRR": "﷼",
                "ISK": "kr",
                "JEP": "£",
                "JMD": "J$",
                "KGS": "лв",
                "KHR": "៛",
                "KPW": "₩",
                "KRW": "₩",
                "KYD": "$",
                "KZT": "лв",
                "LAK": "₭",
                "LBP": "£",
                "LKR": "₨",
                "LRD": "$",
                "LTL": "Lt",
                "LVL": "Ls",
                "MKD": "ден",
                "MNT": "₮",
                "MUR": "₨",
                "MXN": "$",
                "MYR": "RM",
                "MZN": "MT",
                "NAD": "$",
                "NGN": "₦",
                "NIO": "C$",
                "NOK": "kr",
                "NPR": "₨",
                "NZD": "$",
                "OMR": "﷼",
                "PAB": "B/.",
                "PEN": "S/.",
                "PHP": "Php",
                "PKR": "₨",
                "PLN": "zł",
                "PYG": "Gs",
                "QAR": "﷼",
                "RON": "lei",
                "RSD": "Дин.",
                "RUB": "руб",
                "SAR": "﷼",
                "SBD": "$",
                "SCR": "₨",
                "SEK": "kr",
                "SGD": "$",
                "SHP": "£",
                "SOS": "S",
                "SRD": "$",
                "SVC": "$",
                "SYP": "£",
                "THB": "฿",
                "TRL": "₤",
                "TRY": "TL",
                "TTD": "TT$",
                "TVD": "$",
                "TWD": "NT$",
                "UAH": "₴",
                "UYU": "$U",
                "UZS": "лв",
                "VEF": "Bs",
                "VND": "₫",
                "XCD": "$",
                "YER": "﷼",
                "ZAR": "R",
                "ZWD": "Z$"
            }
        },

        phone: {
            title: 'Phone',
            priority: 14,
            createable: true,
            cls: 'phone',
            renderGen: renderGenPhone,
            sortGen: sortGenText,
            renderer: renderPhone,
            filterRender: renderFilterPhone,
            filterText: true,
            sortable: true,
            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        checkbox: {
            title: 'Checkbox',
            priority: 11,
            createable: true,
            renderGen: renderGenCheckbox,
            sortGen: sortGenNumeric,
            renderer: renderCheckbox,
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
            renderer: renderFlag,
            filterRender: renderFlag,
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
            renderer: renderStars,
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
            renderer: renderPercent,
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
            renderer: renderURL,
            filterRender: renderFilterURL,
            filterText: true,
            inlineType: true,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'dataset_link'],
            filterable: true,
            filterConditions: filterConditions.textual,
            deleteable: true
        },

        document: {
            title: 'Document',
            priority: 17,
            createable: true,
            renderGen: renderGenDocument,
            renderer: renderDocument,
            inlineType: true,
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true
        },

        document_obsolete: {
            title: 'Document (old)',
            renderGen: renderGenDocument,
            renderer: renderDocument,
            inlineType: true,
            filterConditions: filterConditions.blob,
            aggregates: nonNumericAggs,
            deleteable: true
        },

        location: {
            title: 'Location',
            priority: 8,
            createable: true,
            renderGen: renderGenLocation,
            renderer: renderLocation,
            deleteable: true,
            alignment: alignment,
            viewTypes: [{value: 'address_coords', text: 'Address &amp; Coordinates' },
                { value: 'coords', text: 'Coordinates Only' },
                { value: 'address', text: 'Address Only' }],
            filterable: true,
            filterConditions: filterConditions.comparable,
            filterRender: renderFilterLocation
        },

        geospatial: {
            title: 'Geospatial',
            priority: 20,
            createable: false,
            renderGen: renderGenGeospatial,
            renderer: renderGeospatial,
            deleteable: false,
            alignment: alignment,
            filterable: false
        },

        tag: {
            title: 'Row Tag',
            priority: 19,
            renderGen: renderGenTags,
            renderer: renderTags,
            aggregates: nonNumericAggs,
            inlineType: true,
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
            renderer: renderEmail,
            filterRender: renderFilterText,
            filterText: true,
            inlineType: true,
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
            renderer: renderText,
            deleteable: true
        },

        picklist: {
            title: 'Multiple Choice',
            renderGen: renderGenPicklist,
            renderer: renderPicklist,
            filterRender: renderPicklist,
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
            renderer: renderPicklist,
            filterRender: renderPicklist,
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
            priority: 19,
            createable: true,
            renderGen: renderGenPicklist,
            renderer: renderPicklist,
            filterRender: renderPicklist,
            sortable: true,
            aggregates: nonNumericAggs,
            rollUpAggregates: nonNumericAggs,
            alignment: alignment,
            filterable: true,
            filterConditions: filterConditions.textual,
            convertableTypes: ['text'],
            deleteable: true
        },

        object: {
            title: 'Object',
            priority: 20,
            createable: false,
            renderGen: renderGenObject,
            renderer: renderObject,
            deleteable: false,
            alignment: alignment,
            filterable: false
        },

        list: {
            title: 'List',
            priority: 21,
            createable: false,
            renderGen: renderGenObject,
            renderer: renderObject,
            deleteable: false,
            alignment: alignment,
            filterable: false
        }
    });

    for (var name in blist.data.types) {
        var type = blist.data.types[name];
        if (typeof type == "object") {
            type.name = name;
        }
    }
})(jQuery);
