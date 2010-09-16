$(function()
{
    var opts = {};
    if (!$.isBlank(window.location.search))
    {
        _.each(window.location.search.slice(1).split('&'), function(p)
        {
            var s = p.split('=');
            opts[s[0]] = s[1];
        });
    }

    var $browse = $('.browseSection');
    $browse.find('select').uniform();
    $browse.find('select.hide').each(function()
    {
        var $t = $(this);
        $t.removeClass('hide');
        $t.closest('.uniform').addClass('hide');
    });

    var $sortType = $browse.find('select.sortType');
    var $sortPeriod = $browse.find('select.sortPeriod');
    var showHideSortPeriod = function()
    {
        _.defer(function()
        {
            $sortPeriod.closest('.uniform').toggleClass('hide',
                !$sortType.find('option:selected').hasClass('timePeriod'));
        });
    };
    $sortType.change(showHideSortPeriod)
        .keypress(showHideSortPeriod).click(showHideSortPeriod);

    var doSort = function()
    {
        _.defer(function()
        {
            opts.sortBy = $sortType.val();
            if ($sortPeriod.is(':visible'))
            { opts.sortPeriod = $sortPeriod.val(); }
            else
            { delete opts.sortPeriod; }
            // Reset page
            delete opts.page;
            window.location = window.location.pathname + '?' +
                _.map(opts, function(v, k) { return k + '=' + v; }).join('&');
        });
    };
    $sortType.add($sortPeriod).change(doSort);
});
