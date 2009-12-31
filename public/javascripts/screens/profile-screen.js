var profileNS = blist.namespace.fetch('blist.profile');

blist.profile.updateStateCombo = function($countryCombo)
{
    if ($countryCombo.val() != "US")
    {
        $("label[for='user_state'], #user_state").hide();
    }
    else
    {
        $("label[for='user_state']:not(:visible), #user_state:not(:visible)")
            .show();
    }
};

blist.profile.updateInfo = function(responseData, $form)
{
    if (responseData.error)
    {
        $form.find('.errorMessage').text(responseData.error);
    }
    else
    {
        var user = responseData.user;
        
        $(".userName h1").text(user.displayName);

        $(".userLocation h5 span").text(user.displayLocation || '');
        $(".userLocation h5 a").toggleClass("initialHide", user.displayLocation !== undefined && user.displayLocation.length > 0);
        
        $(".userCompany h5 span").text(user.company || '');
        $(".userCompany h5 a").toggleClass("initialHide", user.company !== undefined && user.company.length > 0);
        
        $(".userTitle h5 span").text(user.title || '');
        $(".userTitle h5 a").toggleClass("initialHide", user.title !== undefined && user.title.length > 0);
        
        var $userTags = $(".userTags h5 span");
        if (user.tags && user.tags != "")
        {
            $userTags.text(user.tags.join(', '));
        }
        else
        {
            $userTags.empty();
        }
        $(".userTags h5 a").toggleClass("initialHide", user.tags !== undefined && user.tags.length > 0);
        
        $('#switchUsernameLink').text('Display ' +
                (user.privacyControl == "login" ?
                 "Full Name" : "Username"));
        $('#switchUsernameLink').attr('href', '#show_' +
                (user.privacyControl == "login" ?
                 "fullName" : "login"));

        $form.find('.errorMessage').text('');
        $form.closest(".sectionContainer").showEdit("displayShowSection");
    }
};

blist.profile.updateLinkSuccess = function(data, link_id)
{
    var $data = $(data);
    var $row = $data.find("tr");
    var $li = $data.find("li");
    
    var $currentLinkRow = $(".linksTableContainer tr#link_row_" + link_id);
    if ($currentLinkRow.length > 0)
    {
        $currentLinkRow.replaceWith($row);
    }
    else
    {
        $(".linksTableContainer")
            .removeClass("initialHide")
            .find("table tbody")
                .append($row);
    }
    
    $currentLinkItem = $(".linksContent .userLinkActions li#link_list_item_" + link_id);
    if ($currentLinkItem.length > 0)
    {
        $currentLinkItem.replaceWith($li);
    }
    else
    {
        $(".linksContent .userLinkActions").append($li);
    }
    $('#linksEmpty').toggleClass('initialHide', $(".linksContent .userLinkActions").children().length > 0);
    
    $(".updateLinksContainer form").each(function(f) { this.reset(); });
};

blist.profile.addFriendClick = function(event)
{
    event.preventDefault();
    var $link = $(this);
    var origHref = $link.attr("href");
    $.ajax({
        url: origHref,
        type: "GET",
        success: function(responseText)
        {
            var isCreate = responseText == "created";
            
            // Update the text of the link.
            var linkText = isCreate ? "Remove as Friend" : "Add as Friend";
            $link.text(linkText);
            $link.attr("title", linkText);
            
            // Update the link.
            var newHref = isCreate ?
                origHref.replace("create", "delete") :
                origHref.replace("delete", "create");

            $link.attr("href", newHref);
        }
    });
};

/* Initial start-up calls, and setting up bindings */

$(function ()
{
    var cachedWindowHeight = 0;
    $(window).resize(function()
    {
        if ($(window).height() != cachedWindowHeight)
        {
            $(".outerContent").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".outerContent").blistStretchWindow();

    $("#welcome .welcome-titlebar a").click(function(event)
    {
        event.preventDefault();
        $("#welcome").slideUp("fast");
    });


    $('#profile .publicBlists table.gridList').combinationList({
        headerContainerSelector: '#profile .publicBlists .gridListContainer',
        hoverOnly: true,
        initialSort: [[2, 1]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: {1: {sorter: "text"}, 2: {sorter: 'digit'},
            3: {sorter: 'digit'}, 4: {sorter: false}}
    });

    
    $.live(".publicProfileContentActions .actionButtons a", "click", profileNS.addFriendClick);
});
