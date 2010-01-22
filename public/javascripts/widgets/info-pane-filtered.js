(function($)
{
    $.fn.infoPaneFiltered = function(options)
    {
        // Check if object was already created
        var infoPaneFiltered = $(this[0]).data("infoPaneFiltered");
        if (!infoPaneFiltered)
        {
            infoPaneFiltered = new infoPaneFilterObj(options, this[0]);
        }
        return infoPaneFiltered;
    };

    var infoPaneFilterObj = function(options, dom)
    {
        this.settings = $.extend({}, infoPaneFilterObj.defaults, options);
        this.currentDom = dom;
        this.init();
    };

    $.extend(infoPaneFilterObj,
    {
        defaults:
        {
            deleteSelector: '.gridList .handle .deleteLink'
        },

        prototype:
        {
            init: function ()
            {
                var currentObj = this;
                var $domObj = currentObj.$dom();
                $domObj.data("infoPaneFiltered", currentObj);

                $domObj.find(currentObj.settings.deleteSelector).click(function(e)
                { deleteView(currentObj, e); });
            },

            $dom: function()
            {
                if (!this._$dom)
                { this._$dom = $(this.currentDom); }
                return this._$dom;
            }
        }
    });

    var deleteView = function (filterObj, event)
    {
        event.preventDefault();

        if (!confirm('This view will be deleted permanently.'))
        { return false; }

        var $target = $(event.currentTarget);
        var href = $target.attr('href');
        var s = href.slice(href.indexOf('#') + 1).split('_');

        $target.addClass('inProcess');

        $.ajax({
            url: '/datasets/' + s[1],
            type: "DELETE",
            data: " ",
            contentType: "application/json",
            success: function(responseText, textStatus)
            {
                // Update count of filtered views
                var $headerTitle = $target.closest('.singleInfoFiltered')
                    .find('.infoContentHeader h2');
                var textParts = $headerTitle.text().trim().split(' ');

                textParts[0] = parseInt(textParts[0]) - 1;
                if (textParts[0] == 1 && textParts[2].endsWith('s'))
                { textParts[2] = textParts[2].slice(0, -1); }
                else if (textParts[0] == 0 && !textParts[2].endsWith('s'))
                { textParts[2] = textParts[2] + 's'; }

                $headerTitle.text(textParts.join(' '));

                $target.closest('tr').remove();

                if (s.length > 2)
                { window.location = blist.util.navigation.getViewUrl(s[2]); }
                // Reload menu for More Views under FVM
                else
                { $(document).trigger(blist.events.COLUMNS_CHANGED); }
            }
        });
    };

})(jQuery);
