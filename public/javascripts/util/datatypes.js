blist.namespace.fetch('blist.datatypes');

(function($) {

    /*** RENDERERS ***/

    /* Textual types */

    // Text & base textual
    var renderText = function(value, column, plainText, inMenu, context, skipEscape)
    {
        var v = inMenu ? $.htmlStrip(value) : ($.isBlank(value) ? '' : value);
        // Can we get rid of htmlEscape here?
        return skipEscape ? v : $.htmlEscape(v);
    };

    // HTML
    var renderHtml = function(value, col, plainText, inMenu)
    {
        if ($.isBlank(value)) { return ''; }
        if (plainText || inMenu) { return $.htmlStrip(value); }
        // Add an extra wrapper so we can tweak the display to something
        // reasonable
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
        if ($.isBlank(value)) { return ''; }

        var origValue = value.toString();
        if (_.isString(mask) && (mask !== ''))
        {
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
                if (_.isString(value)) { value = value.replace(/[^0-9\.\+\-]/g, ''); }
                value = parseFloat(value);
                if (_.isNaN(value)) { return origValue; }
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
        if (_.isString(value))
        { value = value.replace(/[^0-9\.\-\+]/g, ''); }

        return numberHelper(value, (column.format.precision || 2),
            column.format.precisionStyle,
            blist.datatypes.money.currencies[column.format.currency || 'USD'],
            null,
            column.format.humane);
    };

    // Percent
    var renderPercent = function(value, column, plainText, inMenu)
    {
        if (plainText || inMenu)
        {
            return numberHelper(value, column.format.precision,
                column.format.precisionStyle, null, '%', false,
                column.format.noCommas);
        }

        var renderText;
        var renderBar;
        switch (column.format.view)
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

        var rv = ['<span class="blist-percent">'];

        if (renderBar && !!value)
        {
            var cls;
            var v = value;
            if (value > 0) { cls = 'blist-percent-bar-pos'; }
            else
            {
                cls = 'blist-percent-bar-neg';
                v *= -1;
            }
            if (v > 100) { v = 100; }
            rv.push('<span class="blist-cell ', cls, '" style="width: ', v, '%"></span>');
        }

        if (renderText)
        {
            rv.push('<span class="blist-cell blist-percent-num">',
                numberHelper(value, column.format.precision, column.format.precisionStyle,
                    null, '%', false, column.format.noCommas), '</span>');
        }

        rv.push('</span>');
        return rv.join('');
    };


    /* Date/time types */

    // Date & base date renderer

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
        if ($.isBlank(value)) { return ''; }

        var type = column.renderType || blist.datatypes.date;
        var format = type.formats[column.format.view] || type.formats['date_time'];
        if (format == OPTIMIZE_FORMAT_DATETIME1)
        { return renderDate_dateTime1(value, type.stringParse); }

        var d;
        if (_.isNumber(value)) { d = new Date(value * 1000); }
        else if (!$.isBlank(type.stringParse))
        { d = Date.parseExact(value, type.stringParse); }
        else { d = Date.parse(value); }
        return d ? d.format(format) : '';
    };


    /* URI types */

    // Base URI
    var uriHelper = function(value, captionIsHTML, plainText, baseUrl)
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

        if (!captionIsHTML) { caption = $.htmlEscape(caption); }

        if (plainText) { return url || caption || ''; }

        return "<a target='blist-viewer' rel='external' href='" +
            $.htmlEscape(url) + "'>" + caption + "</a>";
    };

    // Email
    var renderEmail = function(value, col, plainText, inMenu)
    { return plainText || inMenu ? value : uriHelper(value && ['mailto:' + value , value]); };

    // Phone
    var renderPhone = function(value, column, plainText, inMenu)
    {
        var v = value;

        if (!value) { return ''; }

        var num;
        var type;
        if (_.isArray(value))
        {
            num = value[0] || '';
            type = value[1];
        }
        else if ($.isPlainObject(value))
        {
            num = value.phone_number || '';
            type = value.phone_type;
        }
        else { num = value + ''; }

        var label = num + '';
        if (label.match(/^\d{10}$/))
        {
            label = '(' + label.substring(0, 3) + ') ' +
                label.substring(3, 6) + '-' + label.substring(6, 10);
        }
        else if (label.match(/^\d{7}$/))
        { label = label.substring(0, 3) + '-' + label.substring(3, 7); }

        var typeStr = type ? type.toLowerCase() : 'unknown';

        if (plainText)
        {
            if (type) { label += ' (' + typeStr + ')'; }
            return label;
        }

        label = (inMenu && !type ? '' :
            '<span class="blist-phone-icon blist-phone-icon-' +
            typeStr + '">' + typeStr + '</span>&nbsp;') + $.htmlEscape(label);

        return inMenu ? label :
            uriHelper([ 'tel:' + num.replace(/[\-()\s]/g, ''), label ], true);
    };

    // URL
    var renderURL = function(value, column, plainText, inMenu)
    {
        var v = value;
        if (inMenu)
        {
            v = $.keyValueToObject('description', value.description || v[1]);
            if ($.isBlank(v.description))
            { v.url = value.url || v[0]; }
        }
        return uriHelper(value, false, plainText || inMenu, (column.format || {}).baseUrl);
    };


    /* Graphical types */

    // Checkbox
    var renderCheckbox = function(value, column, plainText, inMenu)
    {
        if (plainText) { return value ? '&#10003;' : ''; }
        return ['<span class="blist-cell blist-checkbox blist-checkbox-',
                (value ? 'on' : 'off'), '"',
                (!inMenu ? (' title="' + (value ? 'True' : 'False')) : ''), '">',
                (value ? 'True' : 'False'), '</span>'].join('');
    };


    // Stars
    STAR_WIDTH = 16;
    var renderStars = function(value, column, plainText, inMenu, context)
    {
        if ($.isBlank(value) || value <= 0) { return ''; }

        var rv = [];
        if (plainText)
        {
            for (var i = 0; i < value; i++) { rv.push('*'); }
            return rv.join('');
        }

        var range = parseFloat(column.format.range);
        if (range <= 0 || isNaN(range)) { range = 5; }
        range *= STAR_WIDTH;

        if (inMenu)
        { rv.push('<div class="blist-tstars-wrapper">'); }

        var on = Math.min(range, Math.round(value * STAR_WIDTH));
        var off = range - on;
        rv.push('<span class="blist-tstars-render-wrapper" style="width:', range, 'px">');
        if ((context || {permissions: {}}).permissions.canEdit)
        { rv.push('<span class="blist-star-0"></span>'); }
        rv.push('<span class="blist-tstars" style="width: ', range,
                'px"><span class="blist-cell blist-tstar-on" style="width: ', on,
                'px"></span><span class="blist-cell blist-tstar-off" style="width: ',
                off, 'px; background-position-x: ', -(on % STAR_WIDTH),
                'px"></span></span></span>');

        if (inMenu)
        { rv.push(value, '</div>'); }
        return rv.join('');
    };


    /* Geographic types */

    // Location
    var renderLocation = function(value, column, plainText, inMenu)
    {
        if ($.isBlank(value)) { return ''; }

        var v = value;
        var view = column.format.view;
        if (this.name != 'location')
        {
            view = 'address_coords';
            v = $.keyValueToObject(this.name, v);
        }
        if ($.isBlank(view)) { view = 'address_coords'; }

        var pieces = [];
        if (!$.isBlank(v.human_address) && view.startsWith('address'))
        {
            var a = JSON.parse(v.human_address);
            if (!$.isBlank(a.address) && a.address !== '')
            { pieces.push(a.address); }
            pieces.push(_.compact([_.compact([a.city, a.state]).join(', '), a.zip]).join(' '));
        }

        if (view.endsWith('coords') &&
            (!$.isBlank(v.latitude) || !$.isBlank(v.longitude)))
        {
            pieces.push('(' + (v.latitude || '') + (plainText ? '' : '&deg;') +
                ', ' + (v.longitude || '') + (plainText ? '' : '&deg;') + ')');
        }

        return pieces.join(plainText || inMenu ? ' \n' : '<br />');
    };

    // Geospatial
    var renderGeospatial = function(value, column)
    {
        if ($.isBlank(value)) { return ''; }

        var rv = [];
        if (!$.isBlank(value.geometry))
        {
            var width  = '60';
            var height = '150';
            var imageUrl = $.addAppToken(column.baseUrl() + value.row_id + '?column=' + column.id +
                '&width=' + width + '&height=' + height);
            if ($.browser.msie)
            {
                rv.push('<v:vmlframe src="', imageUrl, '&type=vml#shape01" ',
                        'style="width:', width, 'px; height:', height, 'px;"/>');
            }
            else
            { rv.push('<embed src="', imageUrl, '" width="', width, '" height="', height, '"></embed>'); }
        }

        return rv.join('');
    };


    /* Blobby types */

    // Photo
    var renderPhoto = function(value, column, plainText, inMenu, context)
    {
        if ($.isBlank(value)) { return ''; }

        var url = column.baseUrl() + value;
        if (plainText) { return url; }

        var img = '<img src="' + escape(url) + '"></img>';
        if ((context || {permissions: {}}).permissions.canEdit)
        { return img; }

        return uriHelper({url: value, description: img}, true, false, column.baseUrl());
    };

    var renderDocument = function(value, column, plainText)
    {
        var url, name, size;
        if (!value) { return ''; }
        else if (_.isArray(value))
        {
            url = value[2];
            name = value[1];
            size = value[3];
        }
        else if ($.isPlainObject(value))
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
        if (plainText) { return name || ''; }

        var rv = uriHelper([ (column.baseUrl() || '') + url, name || 'Document' ]);
        if (!$.isBlank(size))
        {
            size = Math.round(size / 1024);
            if (size == 0) { size = 1; }
            rv += '&nbsp;<span class="blist-document-size">(' + size + 'k)</span>';
        }
        return rv;
    };


    /* Linking/customization types */

    // Drop-down lists, and other link types
    var renderLookupList = function(value, column, plainText)
    {
        if (!_.isString(value) || $.isBlank(value)) { return ''; }

        var matchVal;
        var ddl = column.dropDownList || this.dropDownList;
        if (ddl)
        {
            var lcVal = value.toLowerCase();
            for (var i = 0; i < ddl.values.length; i++)
            {
                var v = ddl.values[i];
                if ((v.id || '').toLowerCase() == lcVal)
                {
                    matchVal = v;
                    break;
                }
            }
        }

        if ($.isBlank(matchVal))
        { return '<div class="blist-dataset-link-dangling">' + value + '</div>'; }

        var view = column.format.view || (this.format || {}).view || 'icon_text';
        var result = [];
        if (!plainText)
        {
            result.push('<span class="blist-dropdownlist-wrapper blist-' + (this.cls || this.name) + '">');
            if (!$.isBlank(matchVal.icon) && view.startsWith('icon'))
            {
                result.push('<img class="blist-table-option-icon" src="', matchVal.icon,
                        '" title="', $.htmlStrip(matchVal.description || ''), '" />');
            }
        }
        if (plainText || view.endsWith('text'))
        { result.push($.htmlStrip(matchVal.description || '')); }
        if (!plainText)
        { result.push('</span>'); }
        return result.join('');
    };


    /* Generic types */

    // Object
    var renderObject = function(value)
    { return $.htmlEscape(value ? JSON.stringify(value) : ''); };



    /** FILTER FUNCTIONS ***/

    var valueFilterCheckbox = function(value)
    { return value ? 1 : 0; };


    /*** DATA TYPE DEFINITIONS ***/

    // Aggregates
    var aggs = [
        {text: 'Average', value: 'average', calculate: function(values)
            {
                var count = 0;
                var sum = _.reduce(values,
                        function(memo, v)
                        {
                            if ($.isBlank(v)) { return memo; }
                            count++;
                            return memo + parseFloat(v);
                        }, 0);
                return sum / (count || 1);
            }},

        {text: 'Count', value: 'count', calculate: function(values)
            { return _.reduce(values, function(memo, v) { return memo + ($.isBlank(v) ? 0 : 1); }, 0); }},

        {text: 'Sum', value: 'sum', calculate: function(values)
            {
                return _.reduce(values, function(memo, v)
                        { return memo + ($.isBlank(v) ? 0 : parseFloat(v)); }, 0);
            }},

        {text: 'Maximum', value: 'maximum',
            calculate: function(values)
            {
                return _.reduce(values, function(memo, v)
                        {
                            return $.isBlank(memo) ? v :
                                ($.isBlank(v) ? memo : Math.max(memo, parseFloat(v)));
                        }, null);
            }},

        {text: 'Minimum', value: 'minimum',
            calculate: function(values)
            {
                return _.reduce(values, function(memo, v)
                        {
                            return $.isBlank(memo) ? v :
                                ($.isBlank(v) ? memo : Math.min(memo, parseFloat(v)));
                        }, null);
            }}
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


    blist.datatypes.interfaceTypes = {
        checkbox: { renderer: renderCheckbox },

        date: { renderer: renderDate },

        document: { renderer: renderDocument },

        email: { renderer: renderEmail },

        geospatial: { renderer: renderGeospatial },

        html: { renderer: renderHtml },

        location: { renderer: renderLocation },

        lookupList: { renderer: renderLookupList },

        money: { renderer: renderMoney },

        number: { renderer: renderNumber },

        object: { renderer: renderObject },

        percent: { renderer: renderPercent },

        phone: { renderer: renderPhone },

        photo: { renderer: renderPhoto },

        stars: { renderer: renderStars },

        text: { renderer: renderText },

        url: { renderer: renderURL }
    };

    /**
     * This is our main map of data types.
     */
    $.extend(blist.datatypes,
    {
        // Invalid type is special, not a real type
        invalid: {
            interfaceType: blist.datatypes.interfaceTypes.text
        },

        // Textual types
        text: {
            title: 'Plain Text',
            interfaceType: blist.datatypes.interfaceTypes.text,

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['html', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.textual,
            inlineType: true,
            matchValue: function(v)
            {
                if (_.isString(v)) { v = v.toLowerCase(); }
                return v;
            },
            priority: 1,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        html: {
            title: 'Formatted Text',
            interfaceType: blist.datatypes.interfaceTypes.html,

            aggregates: nonNumericAggs,
            convertableTypes: ['text', 'calendar_date', 'date', 'phone',
                'email', 'url', 'checkbox', 'flag', 'dataset_link']
                .concat(numericConvertTypes),
            createable: true,
            deleteable: true,
            filterConditions: $.extend(true,
                {details: {
                    'EQUALS': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'NOT_EQUALS': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'STARTS_WITH': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'NOT_CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text}
                }}, blist.filter.groups.textual),
            priority: 2,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },


        // Numeric types
        number: {
            title: 'Number',
            interfaceType: blist.datatypes.interfaceTypes.number,

            aggregates: aggs,
            alignment: numericAlignment,
            cls: 'number',
            convertableTypes: _.without(numericConvertTypes, 'number')
                .concat('text').concat('dataset_link'),
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.numeric,
            inlineType: true,
            matchValue: function(v) { return parseFloat(v); },
            precisionStyle: [{text: 'Standard (1,020.4)', value: 'standard'},
                {text: 'Scientific (1.0204e+3)', value: 'scientific'}],
            priority: 3,
            rollUpAggregates: aggs,
            sortable: true
        },

        money: {
            title: 'Money',
            interfaceType: blist.datatypes.interfaceTypes.money,

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
            filterConditions: blist.filter.groups.numeric,
            inlineType: true,
            matchValue: function(v) { return parseFloat(v); },
            priority: 4,
            rollUpAggregates: aggs,
            sortable: true
        },

        percent: {
            title: 'Percent',
            interfaceType: blist.datatypes.interfaceTypes.percent,

            aggregates: aggs,
            alignment: numericAlignment,
            cls: 'percent',
            convertableTypes: _.without(numericConvertTypes, 'percent').concat('text'),
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.numeric,
            matchValue: function(v) { return parseFloat(v); },
            priority: 5,
            rollUpAggregates: aggs,
            sortable: true,
            viewTypes: [{value: 'percent_bar_and_text', text: 'Bar &amp; Text' },
                { value: 'percent_bar', text: 'Bar Only' },
                { value: 'percent_text', text: 'Text Only' }]
        },


        // Date/time types
        date: {
            title: 'Date & Time (with timezone)',
            interfaceType: blist.datatypes.interfaceTypes.date,

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'date',
            convertableTypes: ['text', 'calendar_date'],
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.date,
            filterValue: function(v)
            {
                var d = v;
                if (_.isNumber(v)) { d = new Date(v * 1000); }
                else { d = Date.parse(v); }
                return $.isBlank(d) ? '' : d.format('m/d/Y');
            },
            formats: zDateTimeFormats,
            inlineType: true,
            matchValue: function(v)
            {
                var d = v;
                if (_.isString(v))
                {
                    d = Date.parse(v);
                    if (!$.isBlank(d)) { d = d.getTime() / 1000; }
                }
                return d;
            },
            priority: 7,
            rollUpAggregates: nonNumericAggs,
            sortable: true,
            viewTypes: dateViews
        },

        calendar_date: {
            title: 'Date & Time',
            interfaceType: blist.datatypes.interfaceTypes.date,

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'date',
            convertableTypes: ['text', 'date'],
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.date,
            filterValue: function(v) { return v; },
            formats: dateTimeFormats,
            inlineType: true,
            priority: 6,
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
            interfaceType: blist.datatypes.interfaceTypes.email,

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,
            filterConditions: $.extend(true,
                {details: {
                    'STARTS_WITH': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'NOT_CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text}
                }}, blist.filter.groups.textual),
            inlineType: true,
            priority: 10,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        phone: {
            title: 'Phone',
            interfaceType: blist.datatypes.interfaceTypes.phone,

            aggregates: nonNumericAggs,
            alignment: alignment,
            cls: 'phone',
            convertableTypes: ['text'],
            createable: true,
            defaultFilterSubColumn: 'phone_type',
            deleteable: true,
            priority: 14,
            sortable: true,
            subColumns: {
                phone_number: {
                    title: 'Number',
                    interfaceType: blist.datatypes.interfaceTypes.text,

                    filterConditions: blist.filter.groups.textual
                },
                phone_type: {
                    title: 'Type',
                    interfaceType: blist.datatypes.interfaceTypes.lookupList,

                    dropDownList: {
                        values: [
                                { id: 'Cell', description: 'Cell',
                                    icon: '/stylesheets/images/content/table/phones/cell.png'},
                                { id: 'Home', description: 'Home',
                                    icon: '/stylesheets/images/content/table/phones/home.png'},
                                { id: 'Work', description: 'Work',
                                    icon: '/stylesheets/images/content/table/phones/work.png'},
                                { id: 'Fax', description: 'Fax',
                                    icon: '/stylesheets/images/content/table/phones/fax.png'},
                                { id: 'Other', description: 'Other',
                                    icon: '/stylesheets/images/content/table/phones/other.png'}
                        ]
                    },
                    filterConditions: blist.filter.groups.comparable
                }
            }
        },

        url: {
            title: 'Website URL',
            interfaceType: blist.datatypes.interfaceTypes.url,

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text', 'dataset_link'],
            createable: true,
            defaultFilterSubColumn: 'description',
            deleteable: true,
            inlineType: true,
            priority: 9,
            rollUpAggregates: nonNumericAggs,
            sortable: true,
            subColumns: {
                url: {
                    title: 'URL',
                    interfaceType: blist.datatypes.interfaceTypes.url,

                    cls: 'url_sub',
                    filterConditions: $.extend(true,
                        {details: {
                          'STARTS_WITH': {interfaceType: blist.datatypes.interfaceTypes.text},
                          'CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text},
                          'NOT_CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text}
                        }}, blist.filter.groups.textual)
                },
                description: {
                    title: 'Description',
                    interfaceType: blist.datatypes.interfaceTypes.text,

                    filterConditions: blist.filter.groups.textual
                }
            }
        },


        // Graphical types
        checkbox: {
            title: 'Checkbox',
            interfaceType: blist.datatypes.interfaceTypes.checkbox,

            aggregates: nonNumericAggs,
            alignment: [alignCenter, alignLeft, alignRight],
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.check,
            filterValue: valueFilterCheckbox,
            isInlineEdit: true,
            priority: 11,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        flag: {
            title: 'Flag',
            interfaceType: blist.datatypes.interfaceTypes.lookupList,

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,
            dropDownList: { values: [
                { id: 'red', description: 'Red',
                    icon: '/stylesheets/images/content/table/flags/red.png'},
                { id: 'blue', description: 'Blue',
                    icon: '/stylesheets/images/content/table/flags/blue.png'},
                { id: 'green', description: 'Green',
                    icon: '/stylesheets/images/content/table/flags/green.png'},
                { id: 'yellow', description: 'Yellow',
                    icon: '/stylesheets/images/content/table/flags/yellow.png'},
                { id: 'orange', description: 'Orange',
                    icon: '/stylesheets/images/content/table/flags/orange.png'},
                { id: 'purple', description: 'Purple',
                    icon: '/stylesheets/images/content/table/flags/purple.png'}
            ] },
            filterConditions: blist.filter.groups.comparable,
            format: { view: 'icon' },
            priority: 12,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        stars: {
            title: 'Star',
            interfaceType: blist.datatypes.interfaceTypes.stars,

            aggregates: _.reject(aggs, function(a) { return a.value == 'sum'; }),
            alignment: alignment,
            cls: 'stars',
            convertableTypes: _.without(numericConvertTypes, 'stars').concat('text'),
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.numeric,
            isInlineEdit: true,
            priority: 13,
            rollUpAggregates: _.reject(aggs, function(a) { return a.value == 'sum'; }),
            sortable: true
        },


        // Geographic types
        location: {
            title: 'Location',
            interfaceType: blist.datatypes.interfaceTypes.location,

            alignment: alignment,
            createable: true,
            defaultFilterSubColumn: 'human_address',
            deleteable: true,
            priority: 8,
            matchValue: function(v)
            {
                // human_address in a location column is a JSON string; but we really want to compare
                // the objects, without any of the blank keys. So munge it
                if (_.isString((v || {}).human_address))
                {
                    v = $.extend({}, v, {human_address: $.deepCompact(JSON.parse(v.human_address))});
                    _.each(_.keys(v.human_address), function(k)
                        { v.human_address[k] = v.human_address[k].toLowerCase(); });
                }
                return v;
            },
            subColumns: {
                human_address: {
                    title: 'Address',
                    interfaceType: blist.datatypes.interfaceTypes.location,
                    matchValue: function(v)
                    {
                        // human_address in a location column is a JSON string;
                        // but we really want to compare the objects, without
                        // any of the blank keys. So munge it
                        if (_.isString(v))
                        {
                            v = $.deepCompact(JSON.parse(v));
                            _.each(_.keys(v), function(k)
                                { v[k] = (v[k] || '').toLowerCase() || null; });
                        }
                        return v;
                    },


                    filterConditions: blist.filter.groups.textObject
                },
                latitude: {
                    title: 'Latitude',
                    interfaceType: blist.datatypes.interfaceTypes.number,

                    filterConditions: blist.filter.groups.numeric,
                    matchValue: function(v) { return parseFloat(v); }
                },
                longitude: {
                    title: 'Longitude',
                    interfaceType: blist.datatypes.interfaceTypes.number,

                    filterConditions: blist.filter.groups.numeric,
                    matchValue: function(v) { return parseFloat(v); }
                }
            },
            viewTypes: [{value: 'address_coords', text: 'Address &amp; Coordinates' },
                { value: 'coords', text: 'Coordinates Only' },
                { value: 'address', text: 'Address Only' }]
        },

        geospatial: {
            title: 'Geospatial',
            interfaceType: blist.datatypes.interfaceTypes.geospatial,

            alignment: alignment,
            createable: false,
            deleteable: false,
            priority: 20
        },


        // Blobby types
        document: {
            title: 'Document',
            interfaceType: blist.datatypes.interfaceTypes.document,

            aggregates: nonNumericAggs,
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.blob,
            inlineType: true,
            priority: 17
        },

        document_obsolete: {
            title: 'Document (old)',
            interfaceType: blist.datatypes.interfaceTypes.document,

            aggregates: nonNumericAggs,
            deleteable: true,
            filterConditions: blist.filter.groups.blob,
            inlineType: true
        },

        photo: {
            title: 'Photo (Image)',
            interfaceType: blist.datatypes.interfaceTypes.photo,

            aggregates: nonNumericAggs,
            cls: 'photo',
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.blob,
            priority: 16
        },

        photo_obsolete: {
            title: 'Photo (Image, old)',
            interfaceType: blist.datatypes.interfaceTypes.photo,

            aggregates: nonNumericAggs,
            cls: 'photo',
            deleteable: true,
            filterConditions: blist.filter.groups.blob
        },


        // Linking/customization types
        drop_down_list: {
            title: 'Multiple Choice',
            interfaceType: blist.datatypes.interfaceTypes.lookupList,

            aggregates: nonNumericAggs,
            alignment: alignment,
            createable: true,
            deleteable: true,
            filterConditions: blist.filter.groups.numeric,
            matchValue: function(v, col)
            {
                // This is a numeric comparison, so use indices
                _.any(col.dropDownList.values, function(ddv, i)
                {
                    if (ddv.id == v)
                    {
                        v = i;
                        return true;
                    }
                    return false;
                });
                return v;
            },
            priority: 15,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        dataset_link: {
            title: 'Dataset Link',
            interfaceType: blist.datatypes.interfaceTypes.lookupList,

            aggregates: nonNumericAggs,
            alignment: alignment,
            convertableTypes: ['text'],
            createable: true,
            deleteable: true,
            filterConditions: $.extend(true,
                {details: {
                    'STARTS_WITH': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text},
                    'NOT_CONTAINS': {interfaceType: blist.datatypes.interfaceTypes.text}
                }}, blist.filter.groups.textual),
            matchValue: function(v, col)
            {
                if (!$.isBlank(col.dropDownList))
                {
                    _.any(col.dropDownList.values, function(ddv)
                    {
                        if (ddv.id == v)
                        {
                            v = ddv.description;
                            return true;
                        }
                        return false;
                    });
                }
                return v;
            },
            priority: 19,
            rollUpAggregates: nonNumericAggs,
            sortable: true
        },

        picklist: {
            title: 'Multiple Choice',
            interfaceType: blist.datatypes.interfaceTypes.lookupList,

            deleteable: true,
            filterConditions: blist.filter.groups.numeric,
            sortable: true
        },


        // Generic types
        object: {
            title: 'Object',
            interfaceType: blist.datatypes.interfaceTypes.object,

            alignment: alignment,
            createable: false,
            deleteable: false,
            priority: 20
        },

        list: {
            title: 'List',
            interfaceType: blist.datatypes.interfaceTypes.object,

            createable: false,
            deleteable: false,
            alignment: alignment,
            priority: 21
        },


        // Special system types
        nested_table: {
            title: 'Nested Table',

            createable: true,
            deleteable: true,
            excludeInNestedTable: true,
            priority: 18
        }
    });

    var setUpType = function(type, name)
    {
        type.name = type.name || name;
        type.renderer = function()
        {
            if ($.subKeyDefined(type, 'interfaceType.renderer'))
            { return type.interfaceType.renderer.apply(type, arguments); }
            return '';
        };

        type.matches = function(op, col) // v, cv, etc
        {
            op = op.toUpperCase();
            if (!$.subKeyDefined(type, 'filterConditions.details.' + op)) { return false; }
            var vals = _.map(_.flatten(_.toArray(arguments).slice(2)), function(v)
            {
                // Transform
                if (_.isFunction(type.matchValue)) { v = type.matchValue(v, col); }
                return v;
            });

            return type.filterConditions.details[op].matches.apply(type, vals);
        };
    };

    _.each(blist.datatypes, function(type, name)
    {
        setUpType(type, name);
        _.each(type.subColumns || {}, function(sc, sn) { setUpType(sc, sn); });
    });

})(jQuery);
