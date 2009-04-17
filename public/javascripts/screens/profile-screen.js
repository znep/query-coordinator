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
        $form = $(this);
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

    $('#profile .publicBlists table.gridList').combinationList({
        hoverOnly: true,
        initialSort: [[[2, 1]]],
        scrollableBody: false,
        selectable: false,
        sortGrouping: false,
        sortHeaders: {1: {sorter: "text"}, 4: {sorter: false}}
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
    new AjaxUpload($imageChange, {
        action: $imageChange.attr('href'),
        autoSubmit: true,
        name: 'profileImageInput',
        onSubmit: function (file, ext)
        {
            if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
            {
                $('.profilePicture .errorMessage')
                    .text('Please choose an image file (jpg, gif, png or tiff)');
                return false;
            }
            $('.profilePicture .errorMessage').text('');
            var $img = $('.profilePicture img');
            $img.attr('src', '');
        },
        onComplete: function (file, response)
        {
            // Response is plain text that gets converted to an HTML doc with
            //  <pre> tags
            response = $.json.deserialize(response.slice(5, -6));
            var $img = $('.profilePicture img');
            $img.attr('src', response.medium + '?rand=' + Date.now());
        }
    });
});
