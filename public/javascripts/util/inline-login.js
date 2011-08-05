blist.namespace.fetch('blist.util.inlineLogin');

blist.util.inlineLogin.verifyUser = function(callback, msg)
{
    if (!blist.currentUserId)
    {
        var $login = $('#login');
        var $signup = $('#signup');
        if ($login.length < 1 || $signup.length < 1)
        { throw 'Trying to use inline login, but #login or #signup is missing!'; }

        $login.jqmShow()
            .find('.flash').text(msg).addClass('notice').end()
            .find('a.close').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $login.jqmHide();
                    callback(false, true);
                }).end()
            .find('a.signupLink').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $login.jqmHide();
                    // Defer this until after the current event loop.
                    setTimeout(function()
                    {
                        // Show and reset form
                        $signup.jqmShow()
                            .find(':text:first').focus().end()
                            .find(':input')
                                .val('').end()
                            .find(':checked').attr('checked', false).end()
                            .find('form').validate().resetForm();
                    }, 0);
                }).end()
            .find('a.loginButton').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $(this).closest('form').trigger('submit.inlineLogin');
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $login.jqmHide();
                        callback(false, true);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    $.ajax({
                        url: blist.secureUrl + '/login.json',
                        data: $form.find('input[name=authenticity_token], input#user_session_login, input#user_session_password, input#user_session_remember_me:checked'),
                        dataType: "jsonp",
                        success: function(responseData)
                        {
                            if (responseData.error)
                            {
                                $login.find('.flash').text(responseData.error);
                                $login.find(':text:first').focus().select();
                            }
                            else
                            {
                                blist.currentUserId = responseData.user_id;
                                $login.jqmHide();
                                $('#header .userNav, #siteHeader .siteUserNav')
                                    .addClass('loggedInNav')
                                    .find('.signOutLink').removeClass('hide');
                                callback(true, true);
                            }
                        }
                    });
                })
                .find(':text:first').focus();

        $signup
            .find('a.close').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $signup.jqmHide();
                    callback(false, true);
                }).end()
            .find('a#signup_submit').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function(event)
                {
                    event.preventDefault();
                    $(this).closest('form').trigger('submit.inlineLogin');
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $signup.jqmHide();
                        callback(false, true);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    if ($form.valid())
                    {
                        var data = {};
                        $form.find(':input').each(function()
                        {
                            var $f = $(this);
                            if ($f.is(':checkbox'))
                            { data[$f.attr('name')] = $f.value(); }
                            else { data[$f.attr('name')] = $f.val(); }
                        });
                        $.ajax({
                            url: blist.secureUrl + '/signup.json',
                            data: data,
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
                    $signup.jqmHide();
                    _.defer(function()
                    {
                        $login.jqmShow()
                            .find('.flash')
                                .text(responseData.error)
                                .addClass('error')
                            .end()
                            .find(':text:first').focus();
                    });
                }
                else
                {
                    $signup.find('.flash').text(responseData.error).addClass('error');
                    $signup.find(':text:first').focus().select();
                }
            }
            else
            {
                if (responseData && responseData.user_id)
                {
                    blist.currentUserId = responseData.user_id;
                }

                $signup.jqmHide();
                $login.jqmHide();
                $('#header .userNav, #siteHeader .siteUserNav')
                    .addClass('loggedInNav')
                    .find('.signOutLink').removeClass('hide');
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
