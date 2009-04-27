(function($)
{
    $.fn.pagination = function(options)
    {
        // Check if pagination was already created
        var paginate = $(this[0]).data("paginate");
        if (!paginate)
        {
            paginate = new $.paginate(options, this[0]);
        }
        return paginate;
    };

    $.paginate = function(options, list)
    {
        this.settings = $.extend({}, $.paginate.defaults, options);
        this.currentList = list;
        this.init();
    };

    $.extend($.paginate,
    {
        defaults:
        {
            activeClass: 'active',
            hiddenClass: 'hidden',
            itemSelector: 'li',
            nextText: 'Next',
            numAdjacent: 4,
            pageSize: 10,
            paginationContainer: '.pagination',
            previousText: 'Previous'
        },

        prototype:
        {
            init: function ()
            {
                var paginate = this;
                var $pagedList = $(paginate.currentList);
                $pagedList.data("paginate", paginate);

                paginate.settings.paginationContainer =
                    $(paginate.settings.paginationContainer);
                paginate.settings._allItems =
                    $pagedList.find(paginate.settings.itemSelector);
                if (paginate.settings._allItems.length <=
                    paginate.settings.pageSize)
                {
                    paginate.settings.paginationContainer.hide();
                    return;
                }

                constructLinks(paginate);

                paginate.settings._totalCount = paginate.settings._allItems.length;
                displayPage(paginate, 0);
            },

            update: function ()
            {
                var paginate = this;
                var $pagedList = $(paginate.currentList);
                paginate.settings._allItems =
                    $pagedList.find(paginate.settings.itemSelector);
                if (paginate.settings._allItems.length <=
                    paginate.settings.pageSize)
                {
                    paginate.settings.paginationContainer.hide();
                    return;
                }

                if (Math.ceil(paginate.settings._allItems.length
                    / paginate.settings.pageSize) !=
                    paginate.settings.paginationContainer
                        .children('.pageLink').length)
                {
                    paginate.settings.paginationContainer.empty();
                    constructLinks(paginate);
                }

                paginate.settings._totalCount = paginate.settings._allItems.length;
                displayPage(paginate, 0);
            }
        }
    });

    //
    // private functions
    //
    function constructLinks(paginate)
    {
        var $prevLink = paginate.settings.paginationContainer
            .append("<a href='#prev_page' class='prevLink' "
                    + "title='Previous'>" + paginate.settings.previousText
                    + "</a>")
            .find('.prevLink');
        paginate.settings._prevLink = $prevLink;
        $prevLink.click(function (e) { prevClick(paginate, e); });

        var numPages = Math.ceil(paginate.settings._allItems.length
                / paginate.settings.pageSize);
        for (var i = 1; i <= numPages; i++)
        {
            var $pageLink = paginate.settings.paginationContainer
                .append("<a href='#page_" + i
                        + "' title='Page " + i + "' class='pageLink'>" + i
                        + "</a>")
                .find('.pageLink');
            $pageLink.click(function (e) { pageClick(paginate, e); });
        }
        paginate.settings._pageLinks = paginate.settings.paginationContainer
            .children('.pageLink');
        paginate.settings.paginationContainer.children('.pageLink:first')
            .after("<span class='ellipses'>...</span>");
        paginate.settings.paginationContainer.children('.pageLink:last')
            .before("<span class='ellipses'>...</span>");

        var $nextLink = paginate.settings.paginationContainer
            .append("<a href='#next_page' class='nextLink' "
                    + "title='Next'>" + paginate.settings.nextText + "</a>")
            .find('.nextLink');
        paginate.settings._nextLink = $nextLink;
        $nextLink.click(function (e) { nextClick(paginate, e); });
    };

    function prevClick(paginate, e)
    {
        e.preventDefault();

        if (0 > (paginate.settings._currentPage - 1) * paginate.settings.pageSize)
        {
            return;
        }

        displayPage(paginate, paginate.settings._currentPage - 1);
    };

    function nextClick(paginate, e)
    {
        e.preventDefault();

        if (paginate.settings._totalCount <=
            (paginate.settings._currentPage + 1) * paginate.settings.pageSize)
        {
            return;
        }

        displayPage(paginate, paginate.settings._currentPage + 1);
    };

    function pageClick(paginate, e)
    {
        e.preventDefault();

        var $curLink = $(e.currentTarget);
        var hrefMatches = $curLink.attr('href').split('_');
        displayPage(paginate, parseInt(hrefMatches[1]) - 1);
    };

    function displayPage(paginate, pageNum)
    {
        var pageStart = Math.max(0, pageNum * paginate.settings.pageSize);
        paginate.settings._allItems.addClass(paginate.settings.hiddenClass);
        paginate.settings._allItems
            .slice(pageStart, pageStart + paginate.settings.pageSize)
            .removeClass(paginate.settings.hiddenClass);
        paginate.settings._currentPage = pageNum;

        var lower = Math.max(0, pageNum - paginate.settings.numAdjacent);
        var upper = Math.min(paginate.settings._pageLinks.length,
            pageNum + paginate.settings.numAdjacent + 1);
        paginate.settings._pageLinks.addClass(paginate.settings.hiddenClass)
            .removeClass(paginate.settings.activeClass);

        paginate.settings._pageLinks.eq(pageNum)
            .addClass(paginate.settings.activeClass);
        paginate.settings._pageLinks.slice(lower, upper)
            .removeClass(paginate.settings.hiddenClass);
        paginate.settings._pageLinks.eq(0)
            .removeClass(paginate.settings.hiddenClass);
        paginate.settings._pageLinks.eq(paginate.settings._pageLinks.length - 1)
            .removeClass(paginate.settings.hiddenClass);

        if (pageNum == 0)
        {
            paginate.settings._prevLink.addClass(paginate.settings.hiddenClass);
        }
        else
        {
            paginate.settings._prevLink.removeClass(paginate.settings.hiddenClass);
        }
        if (pageNum == paginate.settings._pageLinks.length - 1)
        {
            paginate.settings._nextLink.addClass(paginate.settings.hiddenClass);
        }
        else
        {
            paginate.settings._nextLink.removeClass(paginate.settings.hiddenClass);
        }


        paginate.settings.paginationContainer.children('.ellipses').each(function ()
        {
            var $this = $(this);
            if ($this.prev().hasClass(paginate.settings.hiddenClass) ||
                $this.next().hasClass(paginate.settings.hiddenClass))
            {
                $this.removeClass(paginate.settings.hiddenClass);
            }
            else
            {
                $this.addClass(paginate.settings.hiddenClass);
            }
        });
    };

})(jQuery);
