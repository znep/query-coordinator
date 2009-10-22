(function($) {
    $.generateProfileUrl = function(user)
    {
        return "/profile/" + $.urlSafe(user.displayName) + "/" + user.id;
    };

    $.generateViewUrl = function(view)
    {
        return "/" + $.urlSafe(view.category || "dataset") + 
               "/" + $.urlSafe(view.name) +
               "/" + view.id
    };
})(jQuery);