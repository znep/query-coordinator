;$(function()
{
    // set basics ordering #
    $('.videoList li').each(function(i)
    {
        $(this).data('basicsOrdering', i);
    });

    // save off a copy of the original list
    var $videoListClone = $('.videoList').clone();

    // wire up sorts and filters
    $.live('.filterBox ul a', 'click', function(event)
    {
        event.preventDefault();

        var $this = $(this);
        if ($this.hasClass('selected'))
        {
            return;
        }

        // mark as selected
        $this.closest('ul').find('a').removeClass('selected');
        $this.addClass('selected');

        var $data = $videoListClone.find('li');

        // filter
        var filterCriteria = $('.filterCriteria').find('a.selected').attr('data-filter');
        if (filterCriteria != 'all')
        {
            $data = $data.filter('[data-type=' + filterCriteria + ']');
        }

        // sort
        var sortValueFunction;
        var sortCriteria = $('.sortCriteria').find('a.selected').attr('data-sort');
        if (sortCriteria == 'basics')
        {
            sortValueFunction = function($item)
            {
                return $item.data('basicsOrdering');
            };
        }
        else if (sortCriteria == 'alphabetical')
        {
            sortValueFunction = function($item)
            {
                return $item.find('h2').text();
            };
        }
        else if (sortCriteria == 'date')
        {
            sortValueFunction = function($item)
            {
                return new Date($item.attr('data-added'));
            };
        }
        var data = $data.get();
        data.sort(function(a, b)
        {
            return (sortValueFunction($(a)) > sortValueFunction($(b))) ? 1 : -1;
        });

        // magic
        $('.videoList').quicksand($(data), {
            adjustHeight: 'dynamic', // having this on causes problems with the floats
            attribute: 'data-id',
            duration: 600,
            easing: 'easeInOutQuad',
            useScaling: false // I think the fade is cooler anyway.
        });
    });

    $.live('.videoList a', 'click', function(event)
    {
        // do NOT prevent default!
        var $item = $(this).closest('li');

        // process the templates
        var embedCode = $('#embedTemplate').text()
            .replace(/%flashvideoid%/g, $item.attr('data-wistiaflashvideoid'))
            .replace(/%html5videoid%/g, $item.attr('data-wistiahtml5videoid'))
            .replace(/%stillid%/g, $item.attr('data-wistiastillid'))
            .replace(/%productionid%/g, $item.attr('data-wistiaproductionid'));

        // apply the code and pop the window
        $('.videoPopupModal')
            .find('.videoContainer')
                .html(embedCode)
                .end()
            .jqmShow();
    });

    $('.videoPopupModal .close').click(function(event)
    {
        // do NOT prevent default!
        var $modal = $('.videoPopupModal');
        $modal.jqmHide();

        setTimeout(function()
        {
            $modal.find('.videoContainer').empty();
        }, 1000);
    })


    // detect if we have a hash at the end of the url; if
    // so locate and load that video straight away
    var hash = window.location.hash;
    if (!$.isBlank(hash))
    {
        hash = hash.replace('#', '');
        $('.videoList li[data-id=' + hash + '] a').click();
    }
});