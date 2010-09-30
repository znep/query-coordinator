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

    var doBrowse = function(newOpts)
    {
        // Reset page
        delete newOpts.page;
        window.location = window.location.pathname + '?' +
            _.map(newOpts, function(v, k) { return k + '=' + v; }).join('&');
    };

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
            var newOpts = $.extend({}, opts);
            newOpts.sortBy = $sortType.val();
            if ($sortPeriod.is(':visible'))
            { newOpts.sortPeriod = $sortPeriod.val(); }
            else
            { delete newOpts.sortPeriod; }
            doBrowse(newOpts);
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
                '.permissions .permType': function(v)
                    { return v.context.isPublic() ? 'Private' : 'Public'; },
                '.permissions.button@class+': function(v)
                    { return v.context.hasRight('update_view') ? '' : 'hide'; },
                '.delete.button@class+': function(v)
                    { return v.context.hasRight('delete_view') ? '' : 'hide'; },
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
                }, true);

        $content.find('.datasetAverageRating')
            .stars({value: ds.averageRating, enabled: false});

        $content.find('.button.permissions:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            var isPublic = ds.isPublic();
            if (isPublic) { ds.makePrivate(); }
            else { ds.makePublic(); }
            $t.find('.permType').text(isPublic ? 'Public' : 'Private');
        });

        $content.find('.button.delete:not(.hide)').click(function(e)
        {
            e.preventDefault();
            var $t = $(this);
            if (confirm('Are you sure you want to delete ' + ds.name + '?'))
            {
                ds.remove(function() { $t.closest('tr.item').remove(); });
            }
        });
    };

    $browse.find('table tbody tr').expander({
        contentSelector: '.nameDesc .expandBlock',
        expandSelector: '.index .expander, .nameDesc .extraInfo .close',
        expanderCollapsedClass: 'collapsed',
        expanderExpandedClass: 'expanded',
        forceExpander: true,
        preExpandCallback: doExpansion
    });


    // Handle sidebar facets
    var $searchSect = $browse.find('.searchSection');
    if ($searchSect.length > 0)
    {
        var $search = $searchSect.find('.searchBox');
        var hookSearch = function(e)
        {
            e.preventDefault();
            _.defer(function()
            {
                var newOpts = $.extend({}, opts, {q: $search.val()});
                if ($.isBlank(newOpts.q)) { delete newOpts.q; }
                doBrowse(newOpts);
            });
        };

        $searchSect.submit(hookSearch).find('.icon').click(hookSearch);
    }

    $browse.find('.facetSection .moreLink').click(function(e)
    {
        e.preventDefault();
        var $dialog = $('.browseOptionsDialog');
        var $c = $dialog.find('.optionsContent');
        $c.empty();
        $c.append($(this).siblings('.moreOptions').children().clone());
        if ($c.find('[rel]').length > 0)
        { $c.find('a').tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } }); }
        $dialog.jqmShow();
    });
});
