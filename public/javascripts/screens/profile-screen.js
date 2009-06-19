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
        $(".userLocation h5").text(user.displayLocation);
        $(".userCompany h5").text(user.company);
        $(".userTitle h5").text(user.title);
        $(".userTags h5 .tagContent").text(user.tags.join(', '));
        $('#switchUsernameLink').text('Display ' +
                (user.privacyControl == "login" ?
                 "Full Name" : "Username"));
        $('#switchUsernameLink').attr('href', '#show_' +
                (user.privacyControl == "login" ?
                 "fullName" : "login"));

        $form.find('.errorMessage').text('');
        $form.closest(".sectionEdit").slideUp("fast");
        $form.closest(".sectionContainer")
            .find(".sectionShow").slideDown("fast");
    }
};

blist.profile.updateLinkSubmit = function(event)
{
    event.preventDefault();
    var $form = $(this);
    var requestData = $.param($form.find(":input"));
    var link_id = $.urlParam("link_id", $form.attr("action"));
    $.ajax({
        url: $form.attr("action"),
        type: "PUT",
        data: requestData,
        success: function(data) { profileNS.updateLinkSuccess(data, link_id); }
    });
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
        $(".linksContent .userLinkActions").removeClass("initialHide").append($li);
    }
    
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
            $(".infoContent").blistStretchWindow();
            cachedWindowHeight = $(window).height();
        }
    });
    $(".infoContent").blistStretchWindow();

    $(".showListBoxLink").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionShow").slideUp("fast");
        $(this).closest(".sectionContainer").find(".sectionEdit").slideDown("fast");
    });

    $(".formListBoxClose a").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionEdit").slideUp("fast");
        $(this).closest(".sectionContainer").find(".sectionShow").slideDown("fast");
    });

    // Form validation.
    $.validator.setDefaults({
        submitHandler: function(form)
        {
            var $form = $(form);

            var requestData = $.param(
                $form.find(":input:not(:radio), :radio[checked=true]"));
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                dataType: "json",
                data: requestData,
                success: function(responseData)
                {
                    profileNS.updateInfo(responseData, $form);
                }
            });
        }
    });

    // Profile form.
    $(".profileContent form").validate({
        rules: {
            'user[firstName]': "required",
            'user[lastName]': "required",
            'user[login]': "required"
        }
    });

    $("#user_country").change(function() { profileNS.updateStateCombo($(this)); });
    profileNS.updateStateCombo($('#user_country'));

    $(".descriptionContent form").submit(function(event)
    {
        event.preventDefault();
        var $form = $(this);
        var requestData = $.param($form.find(":input"));
        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            dataType: "json",
            data: requestData,
            success: function(responseData)
            {
                if (responseData.error)
                {
                    $form.find('.errorMessage').text(responseData.error);
                }
                else
                {
                    $(".descriptionText").html(responseData.user.htmlDescription);

                    $form.find('.errorMessage').text('');
                    $form.closest(".sectionEdit").slideUp("fast");
                    $form.closest(".sectionContainer")
                        .find(".sectionShow").slideDown("fast");
                }
            }
        });
    });
    
    $(".interestsContent form").submit(function(event)
    {
        event.preventDefault();
        var $form = $(this);
        var requestData = $.param($form.find(":input"));
        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            dataType: "json",
            data: requestData,
            success: function(responseData)
            {
                if (responseData.error)
                {
                    $form.find('.errorMessage').text(responseData.error);
                }
                else
                {
                    $(".interestsText").html(responseData.user.interests);

                    $form.find('.errorMessage').text('');
                    $form.closest(".sectionEdit").slideUp("fast");
                    $form.closest(".sectionContainer")
                        .find(".sectionShow").slideDown("fast");
                }
            }
        });
    });
    
    // ADD
    $(".editLinksContainer form").submit(function(event)
    {
        event.preventDefault();
        var $form = $(this);
        var requestData = $.param($form.find(":input"));
        $.ajax({
            url: $form.attr("action"),
            type: "POST",
            data: requestData,
            success: function(data) { profileNS.updateLinkSuccess(data, 0); }
        });
    });
    
    
    // DELETE
    $(".linksTableContainer td.edit_handle a").live("click", function(event)
    {
        event.preventDefault();
        if (confirm("Are you sure you want to delete this link?"))
        {
            var $link = $(this);
            $.ajax({
                url: $link.attr("href"),
                type: "DELETE",
                dataType: "json",
                success: function(data) { 
                    $("#link_row_" + data.link_id).remove();
                    $("#link_list_item_" + data.link_id).remove();
                }
            });
        }
    });
    
    // EDIT
    $(".linksTableContainer td.edit_action a").live("click", function(event)
    {
        event.preventDefault();
        var $link = $(this);
        var $row = $link.closest("tr");
        var $cell = $("<td colspan='5' class='linkFormContainer'>");
        
        var $formTable = $(".editLinksContainer form table").clone();
        var $formAuth = $(".editLinksContainer form input[type='hidden']").clone();

        var $form = $("<form action=\"" + $link.attr("href") + "\" method=\"post\" class=\"clearfix\"></form>");
        $form.append($formAuth);

        $formTable
            .find("select").val($row.find("td.edit_type p span").text()).end()
            .find(".edit_label input").val($row.find("td.edit_label p").text())
                .removeClass("textPrompt prompt").end()
            .find(".edit_url input").val($row.find("td.edit_url p").text())
                .removeClass("textPrompt prompt").end()
            .find(".edit_action input").attr("src", "/images/button_update.png");
        $form.append($formTable);
        $form.submit( profileNS.updateLinkSubmit );
        
        $row.empty().append($cell);
        $cell.append($form);
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

    $('.sectionEdit form input').keypress(function (e)
    {
        $(e.currentTarget).closest('form').find('.errorMessage').text('');
    });

    $('#switchUsernameLink').click(function (e)
    {
        e.preventDefault();
        var requestData = {"user[privacyControl]":
            $(e.currentTarget).attr('href').split('_')[1]};
        var $form = $('.userInfo .sectionEdit form');
        var $authInput = $form.find(':input[name=authenticity_token]');
        requestData[$authInput.attr('name')] = $authInput.val();

        $.ajax({
            url: $form.attr("action"),
            type: "PUT",
            dataType: "json",
            data: requestData,
            success: function(responseData)
            {
                profileNS.updateInfo(responseData, $form);
            }
        });
    });

    var $imageChange = $("#changeProfileImage")
        .click(function (e) { e.preventDefault(); });
    
    if ($("#changeProfileImage").length > 0)
    {
        new AjaxUpload($imageChange, {
            action: $imageChange.attr('href'),
            autoSubmit: true,
            name: 'profileImageInput', 
            responseType: 'json',
            onSubmit: function (file, ext)
            {
                if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
                {
                    $('.profilePicture .errorMessage')
                        .text('Please choose an image file (jpg, gif, png or tiff)');
                    return false;
                }
                $('.profilePicture .errorMessage').text('');
                $('.profilePicture #profileImageContent').animate({ opacity: 0 });
            },
            onComplete: function (file, response)
            {
                $('<img/>')
                    .attr('src', response.medium + '?rand=' + new Date().getTime())
                    .load(function(){
                        $('.profilePicture #profileImageContent')
                            .empty()
                            .append($(this))
                            .animate({ opacity: 1 });
                    });
            }
        });
    }
    
    $(".publicProfileContentActions .actionButtons a").live("click", profileNS.addFriendClick);
});
