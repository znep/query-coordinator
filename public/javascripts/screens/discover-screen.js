var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.tabs = ["search", "popular", "all" ];

blist.discover.historyChangeHandler = function (hash)
{
    // Tab/container names
    var tabs = {
        "search": "#tabSearch",
        "popular": "#tabPopular",
        "all": "#tabAll",
        "nominations": "#tabNominations"
    };
    var tabContainers = {
        "search": "#discoverTabSearchResults",
        "popular": "#discoverTabPopular",
        "all": "#discoverTabAll", 
        "nominations": "#discoverNominations"
    };

    // Special cases to handle default tab actions
    if (hash === "")
    {
        // only case we have no hash at all is default, nothing to do.
        return false;
    }
    var activeTab = $.urlParam("?" + hash, "type");
    // Track what tabs have been opened
    $.analytics.trackEvent('Discover Screen', activeTab + ' tab opened');

    // Find active tab
    var tabSelector = tabs[activeTab];
    var tabContainerSelector = tabContainers[activeTab];

    // Abort if we don't know what's going on
    if (hash == 'type=nominations')
    {
        $(".simpleTabs").simpleTabNavigate().activateTab('#tabNominations');
        return;
    }
    if (!_.include(blist.discover.tabs, activeTab))
    {
        return;
    }

    // Select active tab
    $(".simpleTabs").simpleTabNavigate().activateTab(tabSelector);
    $(tabSelector).find('a').attr("href", "#" + hash);

    // Add search tab if necessary
    if (activeTab == "search")
    {
        $(".simpleTabs li").removeClass("active");
        if ($("#tabSearch").length > 0)
        {
            $("#tabSearch").addClass("active");
        }
        else
        {
            $("#tabPopular").before("<li id='tabSearch' class='active'><div class='wrapper'><a href='#results'>Search Results</a></div></li>");
            $("form.search #search")
                .val(unescape($.urlParam("?" + hash, "search")))
                .removeClass("prompt");
        }
    }

    // Display loading message
    $(".tabContentContainer").removeClass("active");
    $(tabContainerSelector).addClass("active").html(
        "<div class=\"tabContentOuter\"><div class=\"tabContentTR\"></div>" +
        "  <div class=\"tabContent noresult\">" +
        "    <h2>Searching...</h2>" +
        "    <p class=\"clearBoth\">" +
        "        <img src=\"/stylesheets/images/common/BrandedSpinner.gif\" width=\"31\" height=\"31\" alt=\"Searching...\" />" +
        "    </p>" +
        "  </div>" +
        "<div class=\"tabContentB\"><div class=\"tabContentBL\"></div></div></div>" +
        "<div class=\"tabContentNavOuter\"><div class=\"tabContentNavT\"></div>" +
        "  <div class=\"tabContentNav\"></div>" +
        "<div class=\"tabContentNavB\"></div></div>"
    );

    // Fetch data
    $.Tache.Get({
        url: discoverNS.filterUrl + "?" + hash,
        success: function(data)
        {
            $(tabContainerSelector).html(data);
            $(".simpleTabsContainer")[0].scrollIntoView();
            $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);
            $("#tagCloud").jqmHide();
            $("#search").blur();

            // reinforce new links to JS rather than postback
            discoverNS.ajaxifyLinks();
        }
    });
};

blist.discover.sortSelectChangeHandler = function (event)
{
    event.preventDefault();

    var $sortSelect = $(this);
    var sortUrl = $sortSelect.closest("form").attr("action");

    var hash = window.location.href.match(/#/) ? window.location.href.replace(/^.*#/, '') : '';

    if (hash == "")
    {
        var searchTerm = $.urlParam(window.location.href, "search");
        if (searchTerm)
        {
            // we got here via a search
            hash = "type=search&search=" + searchTerm;
        }
        else
        {
            // default tab is popular
            hash = "type=popular";
        }
    }
    if (_.include(blist.discover.tabs, hash))
    {
        hash = "type=" + hash;
    }

    hash = hash.replace(/sort_by=[A-Z_]*/gi, '');
    hash += "&sort_by=" + $sortSelect.val();
    hash = hash.replace(/&&+/g, '&');
    $.historyLoad(hash);
};

blist.discover.tagModalShowHandler = function(hash)
{
    var $modal = hash.w;
    var $trigger = $(hash.t);

    $.Tache.Get({
        url: $trigger.attr("href"),
        success: function(data)
        {
            $modal.html(data).show();
            $(".tagCloudContainer a")
                .tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } })
                .each(function()
                {
                    $(this).attr('href', $(this).attr('href').replace(/\?/, '#'));
                });
            $('#tagCloud .closeContainer a').click(function(event)
            {
                event.preventDefault();
                $modal.jqmHide();
                event.stopPropagation();
            });
        }
    });
};

blist.discover.searchSubmitHandler = function(event)
{
    event.preventDefault();

    var query = $(this).find('#search').val();
    if (!$('form.search.large').valid() || query == '' )
    {
        return;
    }

    var hash = "type=search&search=" + escape(query);
    window.location.href = '#' + hash;
    $.historyLoad(hash);
    return false;
};

blist.discover.ajaxifyLinks = function()
{
    $('.filterList a, .tagList a.filterLink, .categoryList a, .simpleTabs a, .viewPager a').each(function()
    {
        $(this).attr('href', $(this).attr('href').replace(/\?/, '#'));
    });
};

$(function ()
{
    discoverNS.ajaxifyLinks();

    $("#featuredCarousel").jcarousel({
        visible: 2,
        wrap: 'both',
        initCallback: function()
        {
            $(".jcarousel-skin-discover").hide().css("visibility", "visible").fadeIn("slow");
        }
    });

    $(".simpleTabs").simpleTabNavigate({
        tabMap: {
            "tabSearch" : "#discoverTabSearchResults",
            "tabPopular" : "#discoverTabPopular",
            "tabAll" : "#discoverTabAll",
            "tabNominations" : "#discoverNominations"
        },
        preventDefault: false
    });
    
    $.live(".simpleTabs li#tabSearch a", "click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabSearch");
    });
    $.live(".tabLink.popular", "click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabPopular");
    });
    $.live(".tabLink.all", "click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabAll");
    });

    $.historyInit(discoverNS.historyChangeHandler);
    $('a:not(.noHistory)').live('click', function(event)
    {
        if ($(this).attr('href').match(/#/))
        {
            var hash = this.href;
            hash = hash.replace(/^.*#/, '');
            $.historyLoad(hash);
        }
    });
    $(".contentSort select").bind("change", discoverNS.sortSelectChangeHandler);

    $("#tagCloud").jqm({
        trigger: false,
        onShow: discoverNS.tagModalShowHandler
    });
    $.live(".moreTagsLink", "click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmShow($(this));
    });
    $.live(".closeContainer a", "click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmHide();
    });
    $.live(".tagCloudContainer a", "click", function(event)
    {
        $("#tagCloud").jqmHide();
    });

    $("#discover form").submit(discoverNS.searchSubmitHandler)
        .validate(
        {
            rules:
            {
                search:
                {
                    minlength: 3
                }
            },
            messages: {search: "Your search was too short. Please search for a term at least three letters long."},
            errorElement: "div",
            wrapper: "div",
            errorPlacement: function(error, element)
            {
                offset = element.offset();
                error.insertBefore(element)
                error.addClass('errorMessage');
                error.css('position', 'absolute');
                error.css('left', offset.left);
                error.css('top', offset.top + element.outerHeight());
            }
        });

    $(".clearSearch")
        .click(function(event)
        {
            event.preventDefault();
            $("#tabSearch").remove();
            window.location.hash = 'type=popular'; // only webkit/ie understand this, but only they need to
            $.historyLoad('type=popular');
        });
    
    $("#splashModal").jqm({
        trigger: false,
        onShow: function(hash)
        {
            var $modal = hash.w;
            var modalUrl = typeof(isOldIE) !== "undefined" ? "/data/noie" : "/data/splash";
            
            $.Tache.Get({ 
                url: modalUrl,
                success: function(data)
                {
                    $modal.html(data).show();
                    if (modalUrl == "/data/splash")
                    {
                        $.cookies.set('show_splash', 'false', {hoursToLive: 87600});
                    }
                }
            });
        }
    });
    
    $.live("#splashModal .closeContainer a", "click", function(event)
    {
        event.preventDefault();
        $("#splashModal").jqmHide();
    });
    $.live("#splashModal .splashActionDiscover", "click", function(event)
    {
        event.preventDefault();
        $("#splashModal").jqmHide();
        $("#discover .pageBlockSearch form #search").focus();
    });
    $.live("#splashModal .splashActionBox", "click", function(event)
    {
        var $this = $(this);
        var $target = $(event.target);
        if (!$target.is("a"))
        {
            event.preventDefault();
            event.stopPropagation();
            var $a = $this.find(".splashActionButton a");
            if ($a.closest(".splashActionButton").hasClass("splashActionDiscover"))
            {
                $a.click();
            }
            else
            {
                window.location = $a.attr("href");
            }
        }
    });
    
    $("#redirectedModal").jqm({
        trigger: false,
        onShow: function(hash)
        {
            var $modal = hash.w;
            $.Tache.Get({ 
                url: "/data/redirected",
                success: function(data)
                {
                    $modal.html(data).show();
                    $.cookies.set('show_splash', 'false', {hoursToLive: 87600});
                }
            });
        }
    });
    $.live("#redirectedModal .closeContainer a", "click", function(event)
    {
        event.preventDefault();
        $("#redirectedModal").jqmHide();
    });
    
    // Check to see if we were referred from a blist.com domain
    var show_redirect = false;
    var ref_re = /^(?:f|ht)tp(?:s)?\:\/\/([^\/]+)/im;
    
    if (document.referrer.match(ref_re) &&
           document.referrer.match(ref_re)[1] &&
           document.referrer.match(ref_re)[1].toString().indexOf("blist") !== -1)
    {
        show_redirect = true;
    }

    // Check to see if we have a referrer URL
    // var query_ref_re = new RegExp('(?:?|&)ref=(.+)(?:&|$)');
    var query_ref_re = new RegExp('ref=(.+)(?:&|$)');
    if (document.URL.match(query_ref_re) &&
           document.URL.match(query_ref_re)[1] &&
           document.URL.match(query_ref_re)[1].toString().indexOf("blist") !== -1)
    {
        show_redirect = true;
    }

    // Default to the normal splash
    // HACK: Only show splash if we're on the default Socrata theme
    if($.cookies.get('show_splash') != "false" && $('body').hasClass('socrata'))
    {
        if (show_redirect)
        {
            $("#redirectedModal").jqmShow();
        }
        else
        {
            $("#splashModal").jqmShow();
        }
    }

    // Track what tabs have been opened
    $.analytics.trackEvent('Discover Screen', 'popular tab opened (default)');
});
