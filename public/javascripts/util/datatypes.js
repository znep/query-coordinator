blist.namespace.fetch('blist.datatypes');

(function($) {

    /*** RENDERERS ***/

    /* Textual types */

    // Text & base textual
    var renderText = function(value)
    { return $.htmlEscape(value); };

    var renderFilterText = function(value)
    { return $.htmlStrip((value || '') + ''); };

    var renderFilterEscapedText = function(value)
    { return $.htmlEscape($.htmlStrip((value || '') + '')); };

    // HTML
    var renderHtml = function(value, col, plain)
    {
        if ($.isBlank(value)) { return ''; }
        if (plain) { return $.htmlStrip(value); }
        // Add an extra wrapper so we can tweak the display to something
        // reasoanble
        return '<span class="blist-html">' + value + '</span>';
    };


    /* Numeric types */

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

    // Number & base numeric
    var numberHelper = function(value, decimalPlaces, precisionStyle,
        prefix, suffix, humane, noCommas, mask)
    {
        if (value == null) { return ''; }

        if (_.isString(mask) && (mask !== ''))
        {
            origValue = value.toString();
            value = '';

            while (origValue.length && mask.length)
            {
                // decimals are weird things to have in a masked number,
                // so we'll just deal with it by unilaterally dumping them
                // as soon as the value gets there
                if (origValue.charAt(0) === '.')
                {
                    value += '.';
                    origValue = origValue.slice(1);
                }

                if (mask.charAt(0) === '#')
                {
                    value += origValue.charAt(0);
                    origValue = origValue.slice(1);
                }
                else
                { value += mask.charAt(0); }

                mask = mask.slice(1);
            }

            // if the mask had run out of numbers, put the rest of
            // whatever might have been left in the output
            if (mask.indexOf('#') === -1)
            { value += mask; }

            // if the original value is longer than the mask, just
            // append whatever's left at the very end here
            value += origValue;
        }
        else
        {
            if (!_.isNumber(value))
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
            { value = blist.util.toHumaneNumber(value, 2); }
            else if (noCommas !== true && noCommas != 'true')
            {
                value = value + '';
                var pos = value.indexOf('.');
                if (pos == -1) { pos = value.length; }
                pos -= 3;
                while (pos > 0 && DIGITS[value.charAt(pos - 1)])
                {
                    value = value.substring(0, pos) + "," + value.substring(pos);
                    pos -= 3;
                }
            }
        }

        if (prefix) { value = prefix + value; }
        if (suffix) { value += suffix; }

        return value;
    };

    var renderNumber = function(value, column)
    {
        return numberHelper(value, column.format.precision,
            column.format.precisionStyle, null, null, false,
            column.format.noCommas, column.format.mask);
    };

    // Money
    var renderMoney = function(value, column)
    {
        return numberHelper(value, (column.format.precision || 2),
            column.format.precisionStyle,
            blist.datatypes.money.currencies[column.format.currency || 'USD'],
            null,
            column.format.humane);
    };

    // Percent
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


    /* Date/time types */

    // Date & base date renderer
    var dateHelper = function(value, format, stringParse)
    {
        if (value == null) { return ''; }
        var d;
        if (_.isNumber(value)) { d = new Date(value * 1000); }
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
        if (_.isNumber(value)) { d = new Date(value * 1000); }
        else if (!$.isBlank(stringParse))
        { d = Date.parseExact(value, stringParse); }
        else { d = Date.parse(value); }

        if (!d) { return ''; }
        var hour = d.getHours();
        if (hour > 11)
        {
            hour -= 12;
            var meridian = ' PM';
        }
        else { meridian = ' AM'; }
        if (!hour) { hour = 12; }
        if (hour < 10) { hour = "0" + hour; }

        var minute = d.getMinutes();
        if (minute < 10) { minute = "0" + minute; }

        var second = d.getSeconds();
        if (second < 10) { second = "0" + second; }

        var day = d.getDate();
        if (day < 10) { day = "0" + day; }
        var month = d.getMonth() + 1;
        if (month < 10) { month = "0" + month; }

        return month + "/" + day + "/" + d.getFullYear() + " " +
            hour + ":" + minute + ":" + second + meridian + " " + d.getUTCOffset();
    }

    var renderDate = function(value, column)
    {
        var type = column.renderType || blist.datatypes.date;
        var format = type.formats[column.format.view] || type.formats['date_time'];
        if (format == OPTIMIZE_FORMAT_DATETIME1)
        { return renderDate_dateTime1(value, type.stringParse); }
        return dateHelper(value, format, type.stringParse);
    };


    /* URI types */

    // Base URI
    var uriHelper = function(value, captionIsHTML, plain, baseUrl)
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

        if (!captionIsHTML) { caption = $.htmlEscape(caption); }
        return "<a target='blist-viewer' rel='external' href='" +
            $.htmlEscape(url) + "'>" + caption + "</a>";
    };

    // Email
    var emailHelper = function(value)
    { return uriHelper(value && ['mailto:' + value , value]); };

    var renderEmail = function(value, col, plain)
    { return plain ? value : emailHelper(value); };

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
        { label = label.substring(0, 3) + "-" + label.substring(3, 7); }

        var typeStr = type ? type.toLowerCase() : 'unknown';

        if (plain)
        {
            if (type) { label += " (" + typeStr + ")"; }
            return label;
        }

        label = (skipBlankType && !type ? '' :
            "<span class='blist-phone-icon blist-phone-icon-" +
            typeStr + "'>" + typeStr + "</span>&nbsp;") + $.htmlEscape(label);

        return skipURL ? label :
            uriHelper([ "callto://" + num.replace(/[\-()\s]/g, ''), label ], true);
    };

    var renderPhone = function(value, column, plain)
    { return phoneHelper(value, plain); };

    var renderFilterPhone = function(value, column, subType)
    {
        var args = {};
        args[subType] = value;
        return phoneHelper(args, false, true, true);
    };

    // URL
    var renderURL = function(value, column, plain)
    { return uriHelper(value, false, plain, (column.format || {}).baseUrl); };

    var renderFilterURL = function(value)
    {
        if (!value) { return ''; }

        // Do we get arrays anymore?
        if (_.isArray(value)) { return value[1] || value[0]; }
        // Probably have an object
        else if ($.isPlainObject(value)) { return value.description || value.url; }
        // Else, cast to a string & strip HTML
        return $.htmlStrip(value || '');
    };


    /* Graphical types */

    // Checkbox
    var checkboxHelper = function(value, includeTitle)
    {
        return "<span class='blist-cell blist-checkbox blist-checkbox-" +
                (value ? 'on' : 'off') + "'" + (includeTitle ? " title='" +
                (value ? 'True' : 'False') : '') + "'>" +
                (value ? 'True' : 'False') + "</span>";
    };

    var renderCheckbox = function(value, column, plain)
    {
        if (plain) { return value ? '&#10003;' : ''; }
        return checkboxHelper(value, true);
    };

    var renderFilterCheckbox = function(value)
    { return checkboxHelper(value, false); };


    // Flag
    var renderFlag = function(value, column, plain)
    {
        if (plain) { return value || ''; }
        return value && "<span class='blist-flag blist-flag-" + value +
            "' title='value'>" + value + "</span>";
    };

    // Stars
    STAR_WIDTH = 16;
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

    var renderStars = function(value, column, plain, context)
    {
        if (plain) { return renderTextStars(value); }
        var range = parseFloat(column.format.range);
        return starsHelper(value, range, (context || {permissions: {}}).permissions.canEdit);
    };

    var renderFilterStars = function(value, column)
    {
        var range = parseFloat(column.format.range);
        return "<div class='blist-tstars-wrapper'>" +
            starsHelper(value, range) + value + "</div>";
    };



    /* Geographic types */

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

    var renderLocation = function(value, column, plain)
    { return locationHelper(value, plain, column.format.view); };

    var renderFilterLocation = function(value, column, subType)
    {
        if (subType == 'machine_address' || subType == 'needs_recoding')
        { return ''; }

        if (subType == 'human_address')
        { return locationHelper({human_address: value}, true, 'address'); }

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

    var renderGeospatial = function(value, column)
    { return geospatialHelper(value, column.baseUrl(), column.id); };


    /* Blobby types */

    // Photo
    var renderPhoto = function(value, column, plain, context)
    {
        var url = column.baseUrl() + value;
        if (plain) { return url; }

        var img = '<img src="' + escape(url) + '"></img>';
        if ((context || {permissions: {}}).permissions.canEdit)
        { return img; }

        return uriHelper({url: value, description: img}, true, false, column.baseUrl());
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
            {
                // old-style document
                url = value.id;
                name = value.filename;
                size = value.size;
            }
            else
            {
                // new-style document
                url = value.file_id + '?';
                var args = [];
                if (value.filename)
                { args.push('filename=' + escape(value.filename)); }
                if (value.content_type)
                { args.push('content_type=' + escape(value.content_type)); }
                url += args.join('&');
                name = value.filename;
                size = value.size;
            }
        }
        else { url = value + ''; }

        if (!url) { return ''; }
        if (plain) { return name || ''; }

        var rv = uriHelper([ (base || '') + url, name || 'Document' ]);
        if (!$.isBlank(size))
        {
            size = Math.round(size / 1024);
            if (size == 0) { size = 1; }
            rv += "&nbsp;<span class='blist-document-size'>(" + size + "k)</span>";
        }
        return rv;
    };

    var renderDocument = function(value, column, plain)
    { return documentHelper(value, column.baseUrl(), plain); };


    /* Linking/customization types */

    // Drop-down lists, and other link types
    var renderDropDownList = function(value, column, plain)
    {
        if (!_.isString(value) || $.isBlank(value)) { return ''; }

        var matchVal;
        if (column.dropDownList)
        {
            var lcVal = value.toLowerCase();
            for (var i = 0; i < column.dropDownList.values.length; i++)
            {
                var v = column.dropDownList.values[i];
                if ((v.id || '').toLowerCase() == lcVal)
                {
                    matchVal = v;
                    break;
                }
            }
        }

        if ($.isBlank(matchVal))
        { return '<div class="blist-dataset-link-dangling">' + value + '</div>'; }

        var result = [];
        if (!plain)
        {
            result.push('<span class="blist-dropdownlist-wrapper">');
            if (!$.isBlank(matchVal.icon))
            {
                result.push('<img class="blist-table-option-icon" src="',
                    matchVal.icon, '" />');
            }
        }
        result.push($.htmlStrip(matchVal.description || ''));
        if (!plain)
        { result.push('</span>'); }
        return result.join('');
    };


    /* Generic types */

    // Object
    var renderObject = function(value)
    { return $.htmlEscape(value ? JSON.stringify(value) : ''); };


    /* Special system types */

    // Tags
    var renderTags = function(value)
    {
        var v = $.htmlEscape((value || []).join(', '));
        if ($.isBlank(v)) { return ''; }
        return '<div class="blist-tag" title="' + v + '">' + v + '</div>';
    };


    /** FILTER FUNCTIONS ***/

    var valueFilterCheckbox = function(value)
    { return value ? 1 : 0; };


    /*** DATA TYPE DEFINITIONS ***/

    // Aggregates
    var aggs = [
        {text: 'Average', value: 'average'},
        {text: 'Count', value: 'count'},
        {text: 'Sum', value: 'sum'},
        {text: 'Maximum', value: 'maximum'},
        {text: 'Minimum', value: 'minimum'}
    ];

    var nonNumericAggs = _.select(aggs, function(a)
    { return 'count' == a.value; });


    // Alignment
    var alignLeft = {text: 'Left', value: 'left'};
    var alignCenter = {text: 'Center', value: 'center'};
    var alignRight ={text: 'Right', value: 'right'};

    var alignment = [alignLeft, alignCenter, alignRight];
    var numericAlignment = [alignRight, alignLeft, alignCenter];


    // Common convertable types
    var numericConvertTypes = ['money', 'number', 'percent', 'stars'];


    // Filtering
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
                      { value: "IS_NOT_BLANK", text: "exists" } ]
    };


    // Date-time formatting and views
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


    /**
     * This is our main map of data types.
     */
    $.extend(blist.datatypes,
    {
        // Invalid type is special, not a real type
        invalid: {
            renderer: renderText
        },


        // Textual types
        text: {
            title: 'Plain Text',

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['html', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterEscapedText,
            filterText: true,

            inlineType: true,
            priority: 1,

            renderer: renderText,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        html: {
            title: 'Formatted Text',

            aggregates: nonNumericAggs,
            convertableTypes: ['text', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterText,
            filterText: true,

            priority: 2,

            renderer: renderHtml,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },


        // Numeric types
        number: {
            title: 'Number',

            aggregates: aggs,
            alignment: numericAlignment,
            cls: 'number',
            convertableTypes: _.without(numericConvertTypes, 'number')
                .concat('text').concat('dataset_link'),
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderNumber,
            filterText: true,

            inlineType: true,
            precisionStyle: [{text: 'Standard (1,020.4)', value: 'standard'},
                {text: 'Scientific (1.0204e+3)', value: 'scientific'}],
            priority: 3,

            renderer: renderNumber,
            rollUpAggregates: aggs,
            sortable: true
        },

        money: {
            title: 'Money',

            aggregates: aggs,
            alignment: numericAlignment,
            cls: 'money',
            convertableTypes: _.without(numericConvertTypes, 'money').concat('text'),
            createable: true,
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
            },
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderMoney,
            filterText: true,

            inlineType: true,
            priority: 4,

            renderer: renderMoney,
            rollUpAggregates: aggs,
            sortable: true
        },

        percent: {
            title: 'Percent',

            aggregates: aggs,
            alignment: numericAlignment,
            cls: 'percent',
            convertableTypes: _.without(numericConvertTypes, 'percent').concat('text'),
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderFilterPercent,
            filterText: true,

            priority: 5,

            renderer: renderPercent,
            rollUpAggregates: aggs,
            sortable: true,
            viewTypes: [{value: 'percent_bar_and_text', text: 'Bar &amp; Text' },
                { value: 'percent_bar', text: 'Bar Only' },
                { value: 'percent_text', text: 'Text Only' }]
        },


        // Date/time types
        date: {
            title: 'Date & Time (with timezone)',

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'date',
            convertableTypes: ['text', 'calendar_date'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.date,
            filterRender: renderDate,
            filterValue: function(v) { return v; },

            formats: zDateTimeFormats,
            inlineType: true,
            priority: 7,

            renderer: renderDate,
            rollUpAggregates: nonNumericAggs,
            sortable: true,
            viewTypes: dateViews
        },

        calendar_date: {
            title: 'Date & Time',

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'date',
            convertableTypes: ['text', 'date'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.date,
            filterRender: renderDate,
            filterValue: function(v) { return v; },

            formats: dateTimeFormats,
            inlineType: true,
            priority: 6,

            renderer: renderDate,
            rollUpAggregates: nonNumericAggs,
            sortable: true,
            // Giving an exact format to parse is quite a bit faster
            // than a general parse (at least in FF; not as much for IE)
            stringParse: 'yyyy-MM-ddTHH:mm:ss',
            stringFormat: 'yyyy-MM-ddTHH:mm:ss',
            viewTypes: dateViews
        },


        // URI types
        email: {
            title: 'Email',

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterText,
            filterText: true,

            inlineType: true,
            priority: 10,

            renderer: renderEmail,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        phone: {
            title: 'Phone',

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'phone',
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterPhone,
            filterText: true,

            priority: 14,

            renderer: renderPhone,
            sortable: true
        },

        url: {
            title: 'Website URL',

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'dataset_link'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterURL,
            filterText: true,

            inlineType: true,
            priority: 9,

            renderer: renderURL,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },


        // Graphical types
        checkbox: {
            title: 'Checkbox',

            aggregates: nonNumericAggs,
            alignment: [alignCenter, alignLeft, alignRight],
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.comparable,
            filterRender: renderFilterCheckbox,
            filterValue: valueFilterCheckbox,

            isInlineEdit: true,
            priority: 11,

            renderer: renderCheckbox,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        flag: {
            title: 'Flag',

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.comparable,
            filterRender: renderFlag,

            priority: 12,

            renderer: renderFlag,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        stars: {
            title: 'Star',

            aggregates: _.reject(aggs, function(a) { return a.value == 'sum'; }),
            alignment: alignment,
            cls: 'stars',
            convertableTypes: _.without(numericConvertTypes, 'stars').concat('text'),
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderFilterStars,
            filterText: true,

            isInlineEdit: true,
            priority: 13,

            renderer: renderStars,
            rollUpAggregates: _.reject(aggs, function(a) { return a.value == 'sum'; }),
            sortable: true
        },


        // Geographic types
        location: {
            title: 'Location',

            alignment: alignment,
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.comparable,
            filterRender: renderFilterLocation,

            priority: 8,

            renderer: renderLocation,
            viewTypes: [{value: 'address_coords', text: 'Address &amp; Coordinates' },
                { value: 'coords', text: 'Coordinates Only' },
                { value: 'address', text: 'Address Only' }]
        },

        geospatial: {
            title: 'Geospatial',

            alignment: alignment,
            createable: false,
            deleteable: false,
            filterable: false,
            priority: 20,

            renderer: renderGeospatial
        },


        // Blobby types
        document: {
            title: 'Document',

            aggregates: nonNumericAggs,
            createable: true,
            deleteable: true,

            filterConditions: filterConditions.blob,

            inlineType: true,
            priority: 17,

            renderer: renderDocument
        },

        document_obsolete: {
            title: 'Document (old)',

            aggregates: nonNumericAggs,
            deleteable: true,

            filterConditions: filterConditions.blob,

            inlineType: true,

            renderer: renderDocument
        },

        photo: {
            title: 'Photo (Image)',

            aggregates: nonNumericAggs,
            cls: 'photo',
            createable: true,
            deleteable: true,

            filterConditions: filterConditions.blob,

            priority: 16,

            renderer: renderPhoto
        },

        photo_obsolete: {
            title: 'Photo (Image, old)',

            aggregates: nonNumericAggs,
            cls: 'photo',
            deleteable: true,

            filterConditions: filterConditions.blob,

            renderer: renderPhoto
        },


        // Linking/customization types
        drop_down_list: {
            title: 'Multiple Choice',

            aggregates: nonNumericAggs,
            alignment: alignment,
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderDropDownList,

            priority: 15,

            renderer: renderDropDownList,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        dataset_link: {
            title: 'Dataset Link',

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderDropDownList,

            priority: 19,

            renderer: renderDropDownList,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        picklist: {
            title: 'Multiple Choice',

            deleteable: true,

            filterable: true,
            filterConditions: filterConditions.numeric,
            filterRender: renderDropDownList,

            renderer: renderDropDownList,
            sortable: true
        },


        // Generic types
        object: {
            title: 'Object',

            alignment: alignment,
            createable: false,
            deleteable: false,
            filterable: false,
            priority: 20,

            renderer: renderObject
        },

        list: {
            title: 'List',

            createable: false,
            deleteable: false,
            alignment: alignment,
            filterable: false,
            priority: 21,

            renderer: renderObject
        },


        // Special system types
        tag: {
            title: 'Row Tag',

            aggregates: nonNumericAggs,

            filterable: true,
            filterConditions: filterConditions.textual,
            filterRender: renderFilterText,
            filterText: true,

            inlineType: true,
            priority: 19,

            renderer: renderTags
        },

        nested_table: {
            title: 'Nested Table',

            createable: true,
            deleteable: true,
            excludeInNestedTable: true,
            priority: 18,

            renderer: renderText
        }
    });

    _.each(blist.datatypes, function(type, name)
    {
        if ($.isPlainObject(type)) { type.name = name; }
    });

})(jQuery);
