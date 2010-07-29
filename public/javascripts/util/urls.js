(function($) {
    $.generateProfileUrl = function(user)
    {
        return "/profile/" + $.urlSafe(user.displayName) + "/" + user.id;
    };

    $.generateViewUrl = function(view)
    {
        var base = '';

        // federated dataset has nonblank domain cname
        if (!$.isBlank(view.domainCName))
        {
            var loc = document.location;
            base = loc.protocol + '//' + view.domainCName;
            if (loc.port != 80)
            {
                base += ':' + loc.port;
            }
        }

        return base + "/" + $.urlSafe(view.category || "dataset") +
               "/" + $.urlSafe(view.name) +
               "/" + view.id
    };

    $.generateViewRel = function(view)
    {
        return $.isBlank(view.domainCName) ? '' : ' rel="external" ';
    };
})(jQuery);