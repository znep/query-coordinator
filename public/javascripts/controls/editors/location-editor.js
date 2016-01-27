(function($)
{
    var addressValue = function(editObj)
    {
        var addr = '{}';
        if (_.isString(editObj.originalValue))
        { addr = editObj.originalValue; }
        else if ($.subKeyDefined(editObj.originalValue, 'human_address'))
        { addr = editObj.originalValue.human_address; }

        try { return JSON.parse(addr); }
        catch(e) { }
        return '';
    };

    var streetValue = function(editObj)
    {
        return addressValue(editObj).address || '';
    };

    var cityStateZipValue = function(editObj)
    {
        var address = addressValue(editObj);
        return _.compact([_.compact([address.city, address.state]).join(', '),
            address.zip]).join(' ');
    };

    var latitudeValue = function(editObj)
    {
        // Handle invalid values
        if (typeof editObj.originalValue == 'string' && editObj.type.name == 'location')
        { return editObj.originalValue.split(',')[0].trim(); }
        else if (_.isArray(editObj.originalValue))
        { return editObj.originalValue[0] || ''; }

        return (editObj.originalValue || {}).latitude || '';
    };

    var longitudeValue = function(editObj)
    {
        // Handle invalid values
        if (typeof editObj.originalValue == 'string' && editObj.type.name == 'location')
        {
            var p = editObj.originalValue.split(',');
            return p.length > 1 ? p[1].trim() : '';
        }
        else if (_.isArray(editObj.originalValue))
        { return editObj.originalValue[1] || ''; }

        return (editObj.originalValue || {}).longitude || '';
    };

    $.blistEditor.addEditor('location', {
        editorAdded: function()
        {
            this._super.apply(this, arguments);

            var editObj = this;
            editObj.setFullSize();

            // Tab support
            editObj.$dom().find(':input.street, :input.city_state_zip, ' +
                ':input.latitude').keydown(function(e)
                {
                    // Tab key
                    if (e.keyCode == 9 && !e.shiftKey)
                    { e.stopPropagation(); }
                });

            // Shift-tab support
            editObj.$dom().find(':input.city_state_zip, :input.latitude, ' +
                ':input.longitude').keydown(function(e)
                {
                    // Tab key
                    if (e.keyCode == 9 && e.shiftKey)
                    { e.stopPropagation(); }
                });

            // Enter/down support
            editObj.$dom().find(':input.street, :input.city_state_zip')
                .keydown(function(e)
                {
                    // Enter or down
                    if (e.keyCode == 13 && !e.shiftKey || e.keyCode == 40)
                    {
                        e.stopPropagation();
                        $(e.currentTarget).nextAll(':input:first')
                            .focus().select();
                    }
                });

            // Shift-enter/up support
            editObj.$dom().find(':input.city_state_zip, :input.latitude')
                .keydown(function(e)
                {
                    // Shift-Enter or up
                    if (e.keyCode == 13 && e.shiftKey || e.keyCode == 38)
                    {
                        e.stopPropagation();
                        $(e.currentTarget).prevAll(':input:first')
                            .focus().select();
                    }
                });

            // Longitude skips latitude when going up
            editObj.$dom().find(':input.longitude').keydown(function(e)
                {
                    // Shift-Enter or up
                    if (e.keyCode == 13 && e.shiftKey || e.keyCode == 38)
                    {
                        e.stopPropagation();
                        $(e.currentTarget).prevAll(':input.city_state_zip')
                            .focus().select();
                    }
                });

            editObj.$dom().find(':text.lat_long').keypress(function(e)
                { setTimeout(function() { editObj.textModified(); }, 0); });
        },

        $editor: function()
        {
            var editObj = this;
            if (!editObj._$editor)
            {
                editObj._$editor = $('<div class="blist-table-editor' +
                    ' type-' + editObj.type.name + '">' +
                    '<div class="labels street">' +
                    '<span>Street</span>' +
                    '</div>' +
                    '<input type="text" class="street nonInvalid" value="' +
                    streetValue(editObj) + '" />' +
                    '<div class="labels city_state_zip">' +
                    '<span>City, State Zip</span>' +
                    '</div>' +
                    '<input type="text" class="city_state_zip nonInvalid" ' +
                    'value="' + cityStateZipValue(editObj) + '" />' +
                    '<div class="labels lat_long">' +
                    '<span class="latitude">Latitude</span>' +
                    '<span class="longitude">Longitude</span>' +
                    '</div>' +
                    '<input type="text" class="latitude lat_long" value="' +
                    latitudeValue(editObj) + '" />' +
                    '<input type="text" class="longitude lat_long" value="' +
                    longitudeValue(editObj) + '" />' +
                    '</div>');
            }
            return editObj._$editor;
        },

        textModified: function()
        {
            if (this.isValid()) { this.$dom().removeClass('invalid'); }
            else { this.$dom().addClass('invalid'); }
        },

        isValid: function()
        {
            var editObj = this;
            var latVal = editObj.$dom().find(':input.latitude').val().trim();
            var longVal = editObj.$dom().find(':input.longitude').val().trim();

            if (latVal === '' && longVal === '')
            { return true; }

            if (latVal === '' && longVal !== '' ||
                latVal !== '' && longVal === '')
            { return false; }

            latVal = parseFloat(latVal);
            longVal = parseFloat(longVal);
            return latVal > -90 && latVal < 90 &&
                longVal > -180 && longVal < 180;
        },

        currentValue: function()
        {
            var editObj = this;

            var newLat = editObj.$dom().find(':input.latitude').val().trim();
            var newLong = editObj.$dom().find(':input.longitude').val().trim();
            var latLongChanged = newLat !== latitudeValue(editObj) ||
                newLong !== longitudeValue(editObj);

            if (!editObj.isValid()) { return newLat + ', ' + newLong; }

            var newStreet = editObj.$dom().find(':input.street').val().trim();
            var newCSZ = editObj.$dom().find(':input.city_state_zip')
                .val().trim();
            var addressChanged = newStreet !== streetValue(editObj) ||
                newCSZ !== cityStateZipValue(editObj);

            if (!addressChanged && !latLongChanged)
            { return editObj.originalValue; }

            if (newStreet === '' && newCSZ === '' && newLat === '' &&
                newLong === '')
            { return null; }

            var obj = {};
            if (newLat !== '')
            { obj.latitude = parseFloat(newLat); }
            if (newLong !== '')
            { obj.longitude = parseFloat(newLong); }

            // Address didn't change, so get original
            if (!addressChanged)
            {
                obj.human_address = (editObj.originalValue || {})
                    .human_address || null;
                return obj;
            }

            // Address did change, so parse & submit that
            var address = {};

            // Perform HTML escapes to keep parity with the cell renderer!
            newStreet = $.htmlEscape(newStreet);
            newCSZ = $.htmlEscape(newCSZ);

            if (newStreet !== '') { address.address = newStreet; }

            var zipResult = newCSZ.match(/(?:^|\s+)(\d{5}(\-\d{4})?)\s*$/);
            if (!_.isNull(zipResult) && zipResult.length > 1)
            {
                address.zip = zipResult[1];
                newCSZ = newCSZ.slice(0, newCSZ.length - zipResult[0].length);
            }

            // First look for a comma followed by words & spaces
            var stateResult = newCSZ.match(/,(\s+)([\w.\s]+)$/);

            // If that failed, look for a two letters at the end
            if (_.isNull(stateResult) || stateResult.length < 3)
            { stateResult = newCSZ.match(/(\s+|^)(\w{2})$/); }

            // If one of those worked, then pull it out as the state
            if (!_.isNull(stateResult) && stateResult.length > 1)
            {
                address.state = stateResult[2].trim();
                newCSZ = newCSZ.slice(0, newCSZ.length - stateResult[0].length);
            }
            // Otherwise, break it on spaces; pull off the last one,
            // and handle a few special cases for second-to-last
            else
            {
                var parts = newCSZ.split(/\s+/);
                if (parts.length > 1)
                { address.state = parts.pop(); }
                if (parts.length > 1 && parts[parts.length - 1]
                    .match(/new|north|south|west|rhode/i))
                { address.state = parts.pop() + ' ' + address.state; }
                newCSZ = parts.join(' ');
            }

            if (newCSZ !== '')
            { address.city = newCSZ; }

            obj.human_address = JSON.stringify(address);
            if (editObj.type.name == 'location')
            { return obj; }
            else
            { return obj[editObj.type.name]; }
        },

        querySize: function()
        {
            return { width: Math.min(300, Math.max(160, streetValue(this)
                            .visualLength(this.$editor().css('font-size')),
                        cityStateZipValue(this)
                            .visualLength(this.$editor().css('font-size')))),
                height:
                    this.$editor().find('.labels.street').outerHeight(true) +
                    this.$editor().find(':input.street').outerHeight(true) +
                    this.$editor().find('.labels.city_state_zip')
                        .outerHeight(true) +
                    this.$editor().find(':input.city_state_zip')
                        .outerHeight(true) +
                    this.$editor().find('.labels.lat_long')
                        .outerHeight(true) +
                    this.$editor().find(':input.lat_long')
                        .outerHeight(true)
            };
        }
    });

})(jQuery);
