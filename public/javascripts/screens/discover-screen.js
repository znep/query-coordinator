var discoverNS = blist.namespace.fetch('blist.discover');

blist.discover.isTabDirty = {
    "SEARCH": false,
    "POPULAR": false,
    "ALL": false
};
blist.discover.historyChangeHandler = function (hash)
{
    // Tab/container names
    var tabs = {
        "SEARCH": "#tabSearch",
        "POPULAR": "#tabPopular",
        "ALL": "#tabAll"
    };
    var tabContainers = {
        "SEARCH": "#discoverTabSearchResults",
        "POPULAR": "#discoverTabPopular",
        "ALL": "#discoverTabAll"
    };

    // Special cases to handle default tab actions
    if (hash == "")
    {
        var searchTerm = $.urlParam("search", window.location.href);
        if (searchTerm)
        {
            // we got here via search, so default tab is search
            hash = "type=SEARCH&search=" + searchTerm;
        }
        else
        {
            // default tab is popular
            hash = "POPULAR";
        }
    }
    if (blist.discover.isTabDirty[hash] === false)
    {
        $(".simpleTabs").simpleTabNavigate().activateTab(tabs[hash]);
        return;
    }
    else if (blist.discover.isTabDirty[hash] === true)
    {
        hash = "type=" + hash;
    }

    // Find active tab
    var activeTab = $.urlParam("type", "?" + hash);
    var tabSelector = tabs[activeTab];
    var tabContainerSelector = tabContainers[activeTab];

    // Abort if we don't know what's going on
    if (activeTab == 0)
    {
        return;
    }

    // Select active tab
    $(".simpleTabs").simpleTabNavigate().activateTab(tabSelector);
    $(tabSelector).find('a').attr("href", "#" + hash);
    blist.discover.isTabDirty[activeTab] = true;

    // Add search tab if necessary
    if (activeTab == "SEARCH")
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
                .val($.urlParam("search", "?" + hash))
                .removeClass("prompt");
        }
    }

    // Display loading message
    $(".tabContentContainer").removeClass("active");
    $(tabContainerSelector).addClass("active").html(
        "<div class=\"tabContentOuter\"><div class=\"tabContentTL\"><div class=\"tabContentBL\">" +
        "  <div class=\"tabContent noresult\">" +
        "    <h2>Searching...</h2>" +
        "    <p class=\"clearBoth\">" +
        "        <img src=\"/stylesheets/images/common/BrandedSpinner.gif\" width=\"31\" height=\"31\" alt=\"Searching...\" />" +
        "    </p>" +
        "  </div>" +
        "</div></div></div>" +
        "<div class=\"tabContentNavTR\"><div class=\"tabContentNavBR\">" +
        "  <div class=\"tabContentNav\"></div>" +
        "</div></div>"
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
        var searchTerm = $.urlParam("search", window.location.href);
        if (searchTerm)
        {
            // we got here via a search
            hash = "type=SEARCH&search=" + searchTerm;
        }
        else
        {
            // default tab is popular
            hash = "type=POPULAR";
        }
    }
    if (blist.discover.isTabDirty[hash] !== undefined)
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
            $(".tagCloudContainer a").tagcloud({ size: { start: 1.2, end: 2.8, unit: "em" } });
        }
    });
};

blist.discover.searchSubmitHandler = function(event)
{
    event.preventDefault();

    var query = $(this).find('#search').val();
    if (query == "")
    {
        return;
    }

    var hash = "type=SEARCH&search=" + query;
    window.location.href = '#' + hash;
    $.historyLoad(hash);
    return false;
};


$(function ()
{
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
            "tabAll" : "#discoverTabAll"
        },
        preventDefault: false
    });
    
    $(".simpleTabs li#tabSearch a").live("click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabSearch");
    });
    $(".tabLink.popular").live("click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabPopular");
    });
    $(".tabLink.all").live("click", function(event){
        $(".simpleTabs").simpleTabNavigate().activateTab("#tabAll");
    });

    $.historyInit(discoverNS.historyChangeHandler);
    $('a').live('click', function(event)
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
    $(".moreTagsLink").live("click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmShow($(this));
    });
    $(".closeContainer a").live("click", function(event)
    {
        event.preventDefault();
        $("#tagCloud").jqmHide();
    });
    $(".tagCloudContainer a").live("click", function(event)
    {
        $("#tagCloud").jqmHide();
    });

    $("#discover .pageBlockSearch form").submit(discoverNS.searchSubmitHandler);
    $("#search").focus(function(){ $(this).select(); });
    $("#search").keyup(function()
    {
        var $searchField = $(this);
        if (!$searchField.hasClass("prompt") && ($searchField.val() != ""))
        {
            $searchField.parent().find(".clearSearch").show();
        }
        else
        {
            $searchField.parent().find(".clearSearch").hide();
        }
    });
    $(".clearSearch")
        .click(function(event)
        {
            event.preventDefault();
            var $link = $(this);
            $link.closest(".searchContainer").find("input[type='text']").val("").focus();
            $link.hide();
        });
    if ($.urlParam("search", window.location.href) === 0)
    {
        $(".clearSearch").hide();
    }
    
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
    
    $("#splashModal .closeContainer a").live("click", function(event)
    {
        event.preventDefault();
        $("#splashModal").jqmHide();
    });
    $("#splashModal .splashActionDiscover").live("click", function(event)
    {
        event.preventDefault();
        $("#splashModal").jqmHide();
        $("#discover .pageBlockSearch form #search").focus();
    });
    $("#splashModal .splashActionBox").live("click", function(event)
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
    $("#redirectedModal .closeContainer a").live("click", function(event)
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
    if($.cookies.get('show_splash') != "false")
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
});
