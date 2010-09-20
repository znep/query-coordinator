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

    var doExpansion = function($row)
    {
        var $content = $row.find('.nameDesc .extraInfo .infoContent:empty');
        if ($content.length < 1) { return; }

        var i = $row.closest('tbody').find('tr').index($row);
        if (!(blist.browse.datasets[i] instanceof Dataset))
        { blist.browse.datasets[i] = new Dataset(blist.browse.datasets[i]); }
        var ds = blist.browse.datasets[i];
        $content.append($.renderTemplate('expandedInfo', ds,
            {
                '.comments .value': 'numberOfComments'
            }));

        blist.datasetControls.hookUpShareMenu(ds, $content.find('.share.menu'),
                {
                    menuButtonContents: $.tag([
                        {tagName: 'span', 'class': 'shareIcon'},
                        {tagName: 'span', 'class': 'shareText', contents: 'Share'}
                    ], true),
                    onOpen: function()
                    {
                        $.analytics.trackEvent('browse ' + window.location.pathname,
                            'share menu opened', ds.id);
                    }
                });

        $content.find('.datasetAverageRating')
            .stars({value: ds.averageRating, enabled: false});
    };

    $browse.find('table tbody tr').expander({
        contentSelector: '.nameDesc .expandBlock',
        expandSelector: '.index .expander, .nameDesc .extraInfo .close',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded',
        forceExpander: true,
        preExpandCallback: doExpansion
    });
});
