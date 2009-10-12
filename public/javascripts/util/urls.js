(function($) {
    var stringToUrl = function(str)
    {
        str = str.replace(/\s+/ig, '-').replace(/[^a-zA-Z0-9_\-]/ig, '-').replace(/\-+/ig, '-');
        if (str.length === 0)
        {
            return '-';
        }
        return str.slice(0, 50);
    };

    $.generateProfileUrl = function(user)
    {
        return "/profile/" + stringToUrl(user.displayName) + "/" + user.id;
    };

    $.generateViewUrl = function(view)
    {
        return "/" + stringToUrl(view.category || "dataset") + 
               "/" + stringToUrl(view.name) +
               "/" + view.id
    };
})(jQuery);