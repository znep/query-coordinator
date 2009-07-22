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
                    callback(false);
                }).end()
            .find('a.signupLink').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $('#login').hide();
                    $('#signup').show().find(':text:first').focus();
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $('#login').jqmHide();
                        callback(false);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    $.ajax({
                        url: blist.blistGrid.secureUrl + '/login.json',
                        data: $form.find(':input'),
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
                                callback(true);
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
                    $('#login').jqmHide();
                    $('#signup').hide();
                    callback(false);
                }).end()
            .find('a.loginLink').unbind('click.inlineLogin')
                .bind('click.inlineLogin', function (event)
                {
                    event.preventDefault();
                    $('#signup').hide();
                    $('#login').show().find(':text:first').focus();
                }).end()
            .find('form').unbind('keyup.inlineLogin')
                .bind('keyup.inlineLogin', function (event)
                {
                    if (event.keyCode == 27)
                    {
                        $('#login').jqmHide();
                        $('#signup').hide();
                        callback(false);
                    }
                })
                .unbind('submit.inlineLogin')
                .bind('submit.inlineLogin', function (event)
                {
                    event.preventDefault();
                    var $form = $(this);
                    $.ajax({
                        url: $form.attr('action'),
                        type: "POST",
                        data: $form.find(':input'),
                        dataType: "json",
                        success: signupSuccess
                    });
                });

        var doProfileSubmit = false;
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

                if (doProfileSubmit && profileUpload)
                {
                    profileUpload._settings.action = '/users/' +
                        blist.currentUserId + '/profile_images';
                    doProfileSubmit = false;
                    profileUpload.submit();
                    return;
                }

                $('#signup').hide();
                $('#login').jqmHide();
                $('#header .userNav').addClass('loggedInNav');
                callback(true);
            }
        };

        if ($("#signup #profile_image").length > 0)
        {
            var profileUpload = new AjaxUpload($('#signup #profile_image'), {
                autoSubmit: false,
                name: 'signup_profileImageUpload',
                responseType: 'json',
                onChange: function (file, ext)
                {
                    if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
                    {
                        $('#signup .flash').text('Please choose an image file \
                            (jpg, gif, png or tiff)');
                        return false;
                    }
                    $('#signup .flash').text('');
                    $("#signup .fileInputContainer :text").val(file);
                    doProfileSubmit = true;
                },
                onComplete: function (file, response)
                {
                    signupSuccess();
                }
            });
        }
    }
    else
    {
        callback(true);
    }
};


$(function ()
{
    $('#login').jqm({trigger: false});
});
