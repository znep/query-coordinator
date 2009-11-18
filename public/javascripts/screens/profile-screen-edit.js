
$(function ()
{
    $(".sectionContainer").showEdit();
    $(".showListBoxLink, .profileEdit").click(function(event)
    {
        event.preventDefault();
        $(this).closest(".sectionContainer").showEdit("displayEditSection");
    });

    // Profile form.
    $(".profileContent form").validate({
        rules: {
            'user[login]': "required"
        },
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
    $("#user_firstName, #user_lastName").keyup(function() {
       if($("#user_firstName").val() === '' &&
          $("#user_lastName").val() === '')
       {
           $('#user_privacyControl_login').attr('checked', 'checked');
       }
       else
       {
           $("#user_privacyControl_fullname").attr('checked', 'checked');
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
                    var text = responseData.user.htmlDescription;
                    $(".descriptionText").html(text || "");
                    $("#descriptionEmpty").toggleClass('initialHide', text !== undefined && text.length > 0);

                    $form.find('.errorMessage').text('');
                    $form.closest(".sectionContainer").showEdit("displayShowSection");
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
                    var text = responseData.user.interests;
                    $(".interestsText").html(text || "");
                    $("#interestsEmpty").toggleClass('initialHide', text !== undefined && text.length > 0);

                    $form.find('.errorMessage').text('');
                    $form.closest(".sectionContainer").showEdit("displayShowSection");
                }
            }
        });
    });

    // ADD
    $(".editLinksContainer form").validate(
    {
        rules: {
            'link[linkType]': "required",
            'link[url]': {
                required: true,
                url: true
            }
        },
        messages: {
            'link[url]': {
                required: "Please enter a full URL.",
                url: "Please enter a full URL (including 'http://')."
            }
        },
        submitHandler: function(form)
        {
            var $form = $(form);

            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "POST",
                data: requestData,
                success: function(data) { profileNS.updateLinkSuccess(data, 0); }
            });
        }
    });


    // DELETE
    $.live(".linksTableContainer td.edit_handle a", "click", function(event)
    {
        event.preventDefault();
        if (confirm("Are you sure you want to delete this link?"))
        {
            var $link = $(this);
            $.ajax({
                url: $link.attr("href"),
                type: "DELETE",
                dataType: "json",
                data: " ",
                contentType: "application/json",
                success: function(data) {
                    $("#link_row_" + data.link_id).remove();
                    $("#link_list_item_" + data.link_id).remove();
                    $('#linksEmpty').toggleClass('initialHide', $(".linksContent .userLinkActions").children().length > 0);
                }
            });
        }
    });

    // EDIT
    $.live(".linksTableContainer td.edit_action a", "click", function(event)
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
            .find("label.error").html("").end()
            .find("select").val($row.find("td.edit_type p span").text()).end()
            .find(".edit_label input").val($row.find("td.edit_label p").text())
                .removeClass("textPrompt prompt").end()
            .find(".edit_url input").val($row.find("td.edit_url p").text())
                .removeClass("textPrompt prompt error").end()
            .find(".edit_action input").attr("src", "/images/button_update.png");
        $form.append($formTable);

        $form.validate({
            rules: {
                'link[linkType]': "required",
                'link[url]': {
                    required: true,
                    url: true
                }
            },
            messages: {
                'link[url]': {
                    required: "Please enter a full URL.",
                    url: "Please enter a full URL (including 'http://')."
                }
            },
            submitHandler: function(form)
            {
                var $form = $(form);
                var requestData = $.param($form.find(":input"));
                var link_id = $.urlParam("link_id", $form.attr("action"));
                $.ajax({
                    url: $form.attr("action"),
                    type: "PUT",
                    data: requestData,
                    success: function(data) { profileNS.updateLinkSuccess(data, link_id); }
                });
            }
        });

        $row.empty().append($cell);
        $cell.append($form);
    });

    $('.sectionEdit form input').keypress(function (e)
    {
        $(e.currentTarget).closest('form').find('.errorMessage').text('');
    });

    $('#switchUsernameLink').click(function (e)
    {
        e.preventDefault();
        e.stopPropagation();
        var requestData = {"user[privacyControl]":
            $(e.currentTarget).attr('href').split('_')[1]};
        var $form = $('.userInfo .sectionEdit form');

        if($form.find('#user_firstName').val() === "" &&
           $form.find('#user_lastName').val() === "")
        {
            $(this).closest(".sectionContainer").showEdit("displayEditSection");
            return;
        }

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
        var uploader =
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
});
