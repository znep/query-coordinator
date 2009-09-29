var widgetNS = blist.namespace.fetch('blist.widget');

blist.widget.setUpMenu = function()
{
    // pullToTop here to account for Firefox 3.0.10 Windows bug
    $('#header ul.headerMenu')
        .dropdownMenu({
            triggerButton: $('#header').find('a.menuLink'),
            forcePosition: true,
            closeOnKeyup: true,
            linkCallback: widgetNS.headerMenuHandler,
            pullToTop: true});
};

blist.widget.setUpDialogs = function()
{
    $('#emailDialog').jqm({trigger: false});
    $('#emailDialog a.submit').click(widgetNS.submitEmail);
    $('#emailDialog form').submit(widgetNS.submitEmail);

    $('#publishDialog').jqm({trigger: false});
    $("#publishDialog textarea").live('click', function() { $(this).select(); });
};

blist.widget.headerMenuHandler = function (event)
{
    // Href that we care about starts with # and parts are separated with _
    // IE sticks the full thing, so slice everything up to #
    var href = $(event.currentTarget).attr('href');
    if (href.indexOf('#') < 0)
    {
        return;
    }

    var action = href.slice(href.indexOf('#') + 1);
    event.preventDefault();
    switch (action)
    {
        case 'email':
            $('#emailDialog').jqmShow().find('input').focus();
            break;
        case 'publish':
            $('#publishDialog').jqmShow();
            break;
    }
};

blist.widget.submitEmail = function (event)
{
    event.preventDefault();
    $('#emailDialog .error').text('');
    var email = $('#emailDialog input').val();
    if (!email || email == '')
    {
        $('#emailDialog .error').text('Please enter an email address');
        $('#emailDialog input').focus();
        return;
    }

    var $form = $('#emailDialog form');
    $.ajax({url: $form.attr('action'),
            data: $form.find(':input'),
            cache: false,
            error: function (xhr)
            {
                // Error responses have lots of extra space due to an IE issue
                // with iframes & file uploads.  Trying to parse that in jQuery
                // would hang; but stripping the extra off makes it work OK
                var $resp = $(xhr.responseText.replace(/\n/g, '')
                    .replace(/\s+/g, ' '));
                $('#emailDialog .error').text($resp.filter('p')
                    .text().replace(/\(.+\)/, ''));
                $('#emailDialog input').focus().select();
            },
            success: function (resp)
            {
                $('#emailDialog').jqmHide();
            }});
};

blist.widget.clearTempViewTab = function ()
{
    if (widgetNS.previousViewHeader)
    {
        $('#viewHeader').replaceWith(widgetNS.previousViewHeader.clone());
        $('#viewHeader').show();
        widgetNS.setUpViewHeader();
    }
    else
    {
        $('#viewHeader').hide();
    }
    
    widgetNS.sizeGrid();
};

blist.widget.setTempViewTab = function ()
{
    if (blist.currentUserId)
    {
        $('#viewHeader').replaceWith(widgetNS.storedViewHeader.clone());
        $('#viewHeader').show();
        widgetNS.setUpViewHeader();
        widgetNS.sizeGrid();
    }
};

blist.widget.newViewCreated = function($iEdit, responseData)
{
    $('#viewHeader .viewName span').attr('title', '');
    $('#viewHeader .inlineEdit').removeClass('inlineEdit');
    widgetNS.previousViewHeader = $('#viewHeader').clone();
    if (!blist.widgets.visualization.isVisualization)
    {
        $('#data-grid').datasetGrid().isTempView = false;
    }
    widgetNS.loadNewView(responseData.id);
};

blist.widget.loadNewView = function(newViewId)
{
    // Update View Fullscreen button
    $('.fullScreenButton a').attr('href',
        blist.util.navigation.getViewUrl(newViewId));

    // Load up a new widget menu & publish code
    var newPath = window.location.pathname.replace(widgetNS.originalViewId,
        newViewId) + '.data';
    $.ajax({ url: newPath, cache: false,
            success: widgetNS.widgetDataLoaded});

    // Replace form action in Email dialog
    var $emailForm = $('#emailDialog .mainContent form');
    $emailForm.attr('action', $emailForm.attr('action')
        .replace(widgetNS.viewId, newViewId));

    $.ajax({url: '/views/' + newViewId + '.json',
            data: {
              method: 'opening',
              accessType: 'WIDGET',
              referrer: document.referrer
            }
    });

    if (!blist.widgets.visualization.isVisualization)
    {
        $('#data-grid').datasetGrid().updateView(newViewId);
    }

    widgetNS.viewId = newViewId;
};

blist.widget.widgetDataLoaded = function (data)
{
    // Swap out the main menu with whatever was loaded
    $('#header ul.headerMenu').replaceWith($(data).filter('ul.headerMenu'));
    widgetNS.setUpMenu();

    // Swap out the embed code
    $('#publishCode').replaceWith($(data).filter('#publishCode'));
};

blist.widget.sizeGrid = function ()
{
    // Delay-load tab content when switching to it.
    var $outerContent = $(this.allPanelsSelector + '.' + this.activationClass);
    var $infoContent = $outerContent.find(this.expandableSelector);
    if ($outerContent.length > 0 && $infoContent.children().length === 0)
    {
        if ($outerContent.is('.singleInfoSummary'))
        {
            widgetNS.updateMetaTabHeader('summary');
        }
        else if($outerContent.is('.singleInfoFiltered'))
        {
            widgetNS.updateMetaTabHeader("filtered");
        }
        else if($outerContent.is('.singleInfoComments'))
        {
            widgetNS.updateMetaTabHeader("comments");
        }
        else if($outerContent.is('.singleInfoActivity'))
        {
            widgetNS.updateMetaTabHeader("activity");
        }
        else if($outerContent.is('.singleInfoPublishing'))
        {
            widgetNS.updateMetaTab("publishing");
        }
    }

    var $grid = $('#data-grid');
    var $container = $grid.closest(".gridOuter");
    var $innerContainer = $grid.closest(".gridInner");
    var $gridContainer = $grid.closest(".gridContainer");
    var $metaContainer = $("#widgetMeta");
    var $viewHeader = $("#viewHeader");
    
    var newContainerHeight = $container.next().offset().top - $container.offset().top;
    var newGridHeight = newContainerHeight - $metaContainer.height();
    if ($viewHeader.is(":visible"))
    {
        newGridHeight -= $viewHeader.outerHeight();
    }
    
    $innerContainer.height(newContainerHeight);
    $gridContainer.height(newGridHeight);
    $grid.height(newGridHeight);
    $grid.trigger('resize');
};

blist.widget.setUpViewHeader = function()
{
    var inlineEditArgs = {
        requestUrl: '/views.json',
        requestDataCallback: function($form, name)
        {
            // Get the view with columns
            var view = $('#data-grid').datasetGrid().getViewCopy(true);
            view.name = name;
            return $.json.serialize(view);
        },
        requestContentType: 'application/json',
        onceOnly: true,
        loginMessage: 'Creating a public filter requires you to have an account. ' +
            'Either sign in or sign up to save your public filter.',
        submitSuccessCallback: widgetNS.newViewCreated};
    $("#viewHeader .inlineEdit").inlineEdit(inlineEditArgs);

    $('#viewHeader .datasetLink').click(function(event)
    {
        event.preventDefault();
        widgetNS.previousViewHeader = null;
        var href = $(this).attr('href');
        widgetNS.loadNewView(href.slice(href.indexOf('#') + 1).split('_')[1]);
        $('#viewHeader').hide();
        widgetNS.sizeGrid();
    });
};

blist.widget.enableInterstitial = function()
{
    $('a:not([href^=#]):not(.noInterstitial)').live('click', widgetNS.showInterstitial);
};

blist.widget.disableInterstitial = function()
{
    $('a:not([href^=#]):not(.noInterstitial)').die('click', widgetNS.showInterstitial);
};

blist.widget.showInterstitial = function (e)
{
    var $link = $(this);
    var href = $link.attr('href');
    // IE sticks the full URL in the href, so we didn't filter out local URLs
    if (href.indexOf(location) == 0)
    {
        return;
    }

    e.preventDefault();
    if (href.slice(0, 1) == '/')
    {
        href = location.host + href;
    }
    if (!href.match(/^(f|ht)tps?:\/\//))
    {
        href = "http://" + href;
    }
	$('.interstitial .exitBox').width($(window).width() - 125);
    $('.interstitial .exitBox .externalLink')
        .attr('href', href)
        .text(href)
        .attr('target', $link.attr('target'));
    var $inter = $('.interstitial');
    $inter
        .show()
        .css('left', ($(window).width() - $inter.outerWidth(true)) / 2)
        .css('top', ($(window).height() - $inter.outerHeight(true)) / 2);
};

blist.widget.metaTabHeaderMap = {
    "comments": ".singleInfoComments .infoContentHeader",
    "summary": ".singleInfoSummary .infoContentHeader",
    "filtered": ".singleInfoFiltered .infoContentHeader",
    "activity": ".singleInfoActivity .infoContentHeader"
};
blist.widget.updateMetaTabHeader = function(tabKey)
{
    if (widgetNS.metaTabHeaderMap[tabKey] != undefined)
    {
        $.Tache.Get({ url: '/widgets_meta/' + widgetNS.viewId + '/meta_tab_header?tab=' + tabKey,
            success: function(data)
            {
                $(widgetNS.metaTabHeaderMap[tabKey]).html(data);
            }
        });
        widgetNS.updateMetaTab(tabKey);
    }
};

blist.widget.metaTabMap = {
    "summary": ".singleInfoSummary .infoContent",
    "comments": ".singleInfoComments .infoContent",
    "filtered": ".singleInfoFiltered .infoContent",
    "activity": ".singleInfoActivity .infoContent",
    "publishing": ".singleInfoPublishing .infoContent"
};
blist.widget.updateMetaTab = function(tabKey)
{
    $.Tache.Get({ url: '/widgets_meta/' + widgetNS.viewId + '/meta_tab?tab=' + tabKey +
                       '&customization_id=' + widgetNS.customizationId,
        success: function(data)
        {
            $(widgetNS.metaTabMap[tabKey]).html(data);
            
            if (tabKey == "comments")
            {
                // Set up reply expanders in comments tab.
                var $commentPane = $("#widgetMeta .singleInfoComments");
                $commentPane.find(".expander")
                    .click(function (e) { 
                        widgetNS.commentExpanderClick($commentPane, e); });
            }
            
            if (tabKey == "publishing")
            {
                $("#widgetMeta .singleInfoPublishing").infoPanePublish();
            }

            if (tabKey == "filtered")
            {
                var $filteredGrid = $('.singleInfoFiltered .infoContent table');
                var length = $filteredGrid.find('tbody tr').length;
                $('.filteredViewCount').text(length);
                $("#filteredViewsPanel").toggleClass('plural', length !== 1);
            }
        }
    });
};


blist.widget.commentExpanderClick = function($commentPane, e)
{
    e.preventDefault();
    $(e.currentTarget).toggleClass("expanded")
        .siblings(".childContainer")
        .toggleClass("collapsed");
    widgetNS.sizeGrid();
};

$(function ()
{
    widgetNS.sizeGrid();
    $(window).resize(function() { widgetNS.sizeGrid(); });

    // Make all links with rel="external" open in a new window.
    $("a[rel$='external']").live("mouseover",
        function(){ this.target = "_blank"; });

    widgetNS.setUpMenu();
    widgetNS.setUpDialogs();

    $('#header form').submit(function (event) { event.preventDefault(); });

    if (!blist.widgets.visualization.isVisualization)
    {
        $('#data-grid').datasetGrid({viewId: widgetNS.viewId,
            accessType: 'WIDGET',
            showRowNumbers: widgetNS.theme['grid']['row_numbers'],
            showRowHandle: widgetNS.theme['grid']['row_numbers'],
            editEnabled: false, manualResize: true,
            filterItem: '#header form :text',
            clearFilterItem: '#header form .clearSearch',
            clearTempViewCallback: widgetNS.clearTempViewTab,
            setTempViewCallback: widgetNS.setTempViewTab
            });
    }
    else
    {
        $('#data-grid').visualization();
    }

    widgetNS.storedViewHeader = $('#viewHeader').clone();
    widgetNS.originalViewId = widgetNS.viewId;

    $.ajax({url: '/views/' + widgetNS.viewId + '.json',
            data: {
              method: 'opening',
              accessType: 'WIDGET',
              referrer: document.referrer
            }
    });
    
    // Wire up interstitials
    if (widgetNS.theme['behavior']['interstitial'])
    {
        blist.widget.enableInterstitial();
    }

    $('.interstitial a.closeLink').click(function (e)
    {
        e.preventDefault();
        $('.interstitial').hide();
    });

    $(document).keyup(function (e)
    {
        // 27 is ESC
        if (e.keyCode == 27 && $('.interstitial:visible').length > 0)
        {
            $('.interstitial').hide();
        }
    });
    
    if ($("#widgetMeta").length > 0)
    {
        var tabMap = {
            "tabSummary": ".singleInfoSummary",
            "tabFiltered": ".singleInfoFiltered",
            "tabComments": ".singleInfoComments",
            "tabActivity": ".singleInfoActivity",
            "tabPublishing": ".singleInfoPublishing"
        };
        $('#widgetMeta ' + tabMap[$('#widgetMeta .summaryTabs li:first-child').attr('id')]).addClass('active');
        // Set up the info pane tab switching.
        $("#widgetMeta .summaryTabs").infoPaneNavigate({
            tabSelector: "li:not('.scrollArrow')",
            tabMap: tabMap,
            containerSelector: "#widgetMeta",
            allPanelsSelector : ".infoContentOuter",
            expandableSelector: ".infoContent",
            isWidget: true,
            switchCompleteCallback: widgetNS.sizeGrid,
            scrollToTabOnActivate: false
        });

        // Make tabs scrollable.
        $("#widgetMeta .summaryTabs").scrollTabs();
    }
});

blist.widget.ready = true;
