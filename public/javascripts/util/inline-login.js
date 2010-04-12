blist.namespace.fetch('blist.util.inlineLogin');

blist.util.inlineLogin.verifyUser = function(callback, msg)
{
    if (!blist.currentUserId)
    {
        $('#login').jqmShow().find('.flash').text(msg).end()
            .find('a.close').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $('#login').jqmHide();
                    callback(false, true);
                }).end()
            .find('a.signupLink').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $('#login').jqmHide();
                    // Defer this until after the current event loop.
                    setTimeout(function()
                    {
                        // Show and reset form
                        $('#signup').jqmShow()
                            .find(':text:first').focus().end()
                            .find(':input')
                                .val('').end()
                            .find(':checked').attr('checked', false).end()
                            .find('form').validate().resetForm();
                    }, 0);
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $('#login').jqmHide();
                        callback(false, true);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    $.ajax({
                        url: blist.blistGrid.secureUrl + '/login.json',
                        data: $form.find('input[name=authenticity_token], input#user_session_login, input#user_session_password, input#user_session_remember_me:checked'),
                        dataType: "jsonp",
                        success: function(responseData)
                        {
                            if (responseData.error)
                            {
                                $('#login .flash').text(responseData.error);
                                $('#login :text:first').focus().select();
                            }
                            else
                            {
                                blist.currentUserId = responseData.user_id;
                                $('#login').jqmHide();
                                $('#header .userNav').addClass('loggedInNav');
                                callback(true, true);
                            }
                        }
                    });
                })
                .find(':text:first').focus();

        $('#signup')
            .find('a.close').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $('#signup').jqmHide();
                    callback(false, true);
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $('#signup').jqmHide();
                        callback(false, true);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    if ($form.valid() && $form.find(".flash").text().length == 0)
                    {
                        $.ajax({
                            url: blist.blistGrid.secureUrl + '/signup.json',
                            data: $form.find(':input'),
                            dataType: "jsonp",
                            success: signupSuccess
                        });
                    }
                });

        var signupSuccess = function(responseData)
        {
            if (responseData && responseData.error)
            {
                if (responseData.promptLogin)
                {
                    $('#signup').hide();
                    $('#login').show()
                        .find('.flash').text(responseData.error)
                        .end()
                        .find(':text:first').focus();
                }
                else
                {
                    $('#signup .flash').text(responseData.error);
                    $('#signup :text:first').focus().select();
                }
            }
            else
            {
                if (responseData && responseData.user_id)
                {
                    blist.currentUserId = responseData.user_id;
                }

                $('#signup').hide();
                $('#login').jqmHide();
                $('#header .userNav').addClass('loggedInNav');
                callback(true, true);
            }
        };
    }
    else
    {
        callback(true, false);
    }
};


$(function ()
{
    $('#login').jqm({trigger: false});
    $('#signup').jqm({trigger: false});
});
