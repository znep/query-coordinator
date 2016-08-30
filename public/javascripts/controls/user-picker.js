(function($)
{
    $.fn.userPicker = function(options)
    {
        // Check if object was already created
        var userPicker = $(this[0]).data("userPicker");
        if (!userPicker)
        {
            userPicker = new userPickerObj(options, this[0]);
        }
        return userPicker;
    };

    var userPickerObj = function(options, dom)
    {
        this.settings = $.extend({}, userPickerObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(userPickerObj,
    {
        defaults:
        {
            chooseCallback: function(dataItem) {},
            filterCallback: function(user) { return true; },
            limit: 10,
            valueFunction: function(dataItem) { return dataItem.id; }
        },

        prototype:
        {
            init: function ()
            {
                var pickerObj = this;
                var $domObj = pickerObj.$dom();
                $domObj.data("userPicker", pickerObj);

                // Turn of default browser autocomplete
                $domObj.attr('autocomplete', 'off');
                $domObj.closest('form').attr('autocomplete', 'off');

                $domObj.awesomecomplete({
                    attachTo: pickerObj.settings.attachTo || $domObj.offsetParent(),
                    forcePosition: true,
                    suggestionListClass: 'autocomplete userPicker',
                    typingDelay: 500,
                    dataMethod: function(value, $item, callback)
                        { loadUsers(pickerObj, value, callback); },
                    renderFunction: doRender,
                    onComplete: function(dataItem)
                        { handleComplete(pickerObj, dataItem); },
                    valueFunction: pickerObj.settings.valueFunction
                });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

    var loadUsers = function(pickerObj, value, callback)
    {
        // Trim value, shortcut if blank
        value = $.trim(value);
        if ($.isBlank(value))
        {
            callback([]);
            return;
        }

        var m = value.match(/\w{4}-\w{4}$/);
        if (!$.isBlank(m))
        {
            User.createFromUserId(m[0], function(u)
            {
                callback([]);
                if (pickerObj.settings.filterCallback(u))
                { handleComplete(pickerObj, u); }
            },
            function()
            {
                callback([]);
            });
        }
        else
        {
            $.Tache.Get({url: '/api/search/users.json',
                data: {limit: pickerObj.settings.limit, q: value},
                success: function(results)
                {
                    callback(_.chain(results.results || [])
                        .map(function(u) { return new User(u); })
                        .select(pickerObj.settings.filterCallback)
                        .value());
                }});
        }
    };

    var doRender = function(dataItem, topMatch)
    {
        return '<p class="title">' + dataItem['displayName'] + '</p>' +
               '<p class="matchRow"><span class="matchedField">Email:</span> ' +
               dataItem['email'] + '</p>';
    };

    var handleComplete = function(pickerObj, dataItem)
    {
        pickerObj.settings.chooseCallback(dataItem);
    };

})(jQuery);
