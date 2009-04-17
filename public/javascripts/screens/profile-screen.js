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
            $form = $(form);

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
                        var user = responseData.user;
                        $(".userName h1").text(user.displayName);
                        $(".userLocation h5").text(user.displayLocation);
                        $(".userTitle h5").text(user.title);
                        $(".userTags h5").text(user.tags.join(', '));

                        $form.find('.errorMessage').text('');
                        $form.closest(".sectionEdit").slideUp("fast");
                        $form.closest(".sectionContainer")
                            .find(".sectionShow").slideDown("fast");
                    }
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
});
