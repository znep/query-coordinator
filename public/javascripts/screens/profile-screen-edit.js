;$(function()
{
    var $basicPane   = $('.editBasicInfoForm'),
        $imagePane   = $('.editProfileImageForm'),
        $accountPane = $('.editAccountInfoForm'),
        $tokensPane  = $('.editAppTokensForm'),
        $currentPane = $('.editProfile .editForm').first(),
        $form        = $('#editProfileForm'),
        $accountForm = $('#editAccountForm');

    // Dynamic pane switching

    $('.editProfileNav li a').click(function(event)
    {
        if ($('html').hasClass('ie') || $tokensPane.is(':visible'))
        {
            return;
        }
        // Hide all Flashes, since it only applied to the first page
        $('.flash').hide();

        var $link = $(event.target).closest('li'),
            $newPane;

        if ($link.is('.basicInfo'))
        { $newPane = $basicPane; }
        else if ($link.is('.profileImage'))
        { $newPane = $imagePane; }
        else if ($link.is('.accountSettings'))
        { $newPane = $accountPane; }
        else if ($link.is('.appTokens'))
        { return; }
        else
        { $newPane = null; }

        event.preventDefault();

        if (!_.isNull($newPane) && $newPane[0] != $currentPane[0])
        {
            $currentPane.fadeOut(300, function()
            {
                $newPane.fadeIn();
                $currentPane = $newPane;
            });
        }
    });

    var $profileImage  = $form.find('#profileImage'),
        $errorMessage  = $form.find('.imageErrorLine'),
        validationHash = {
            ignoreTitle: true,
            showErrors: function(errorMap, errorList) {
                var $submit = $(this.currentForm).find('input[type="submit"]');
                if (errorList.length === 0)
                { $submit.removeClass('disabled'); }
                else
                { $submit.addClass('disabled'); }
                this.defaultShowErrors();
            }
        };


    $form.validate($.extend({}, validationHash, {
        rules: {
            "user[screenName]": { required: true }
        }
    }));

    // Upload new profile image
    var $newImage = $('.uploadNewImage');
    $newImage.siblings('input[type=submit]').remove();

    $newImage.imageUploader({
        $error: $('.imageError'),
        $image: $('#profileImage'),
        name: 'profileImageInput',
        urlProcessor: function(response) {
            return response.large;
        }
    });

    // Only show the State selection if they're in the US
    var $countrySelect = $('#user_country'),
        $stateLine     = $('.stateLine'),
    showHideStateSelect = function(event)
    {
        if ($countrySelect.val() == 'US')
        { $stateLine.slideDown(); }
        else
        { $stateLine.hide(); }
    };

    $('#user_country, #user_state').uniform();
    $countrySelect.change(showHideStateSelect);
    // Only hide it via JS so accessible version can always see it
    showHideStateSelect();

    var isPresent = function(selector){
            return !$.isBlank($(selector).val());
        },
        hasOpenId = $accountForm.hasClass('hasOpenId');

    // Account modifications. Who doesn't love complicated validation rules ??
    $accountForm.validate($.extend({}, validationHash, {
        rules: {
            "user[email]": "email",
            "user[email_confirm]": {
                email: true,
                equalTo: '#user_email'
            },
            "user[email_password]": {
                required: {
                    depends: function(element) {
                        return isPresent('#user_email');
                    }
                }
            },
            "user[password_old]": {
                required: {
                    depends: function(element) {
                        // Password is required if the email us there
                        if (isPresent('#user_password_new')) {
                            return !($(element).closest('.line').hasClass('noPassword'));
                        }
                        return false;
                    }
                }
            },
            "user[password_new]": {
                minlength: 8,
                required: {
                    depends: function(element) {
                        // They can't set a blank password
                        return isPresent('#user_password_old');
                    }
                }
            },
            "user[password_confirm]": {
                equalTo: '#user_password_new'
            }
        }
    }));

    // Time for the checbox to put on its sexy uniform
    $accountForm.find('input:checkbox').uniform();


    // App tokens
    var $newTokenArea = $('.createNewToken'),
        $newTokenForm = $('.createNewTokenForm'),
        $cancelButton = $('.editAppTokensForm .cancelButton');

    $newTokenForm
        .find('input:checkbox').uniform()
            .end()
        .validate(validationHash);

    var $showFormButton = $.tag({
        tagName: 'a',
        'class': 'button add showCreateTokenButton',
        contents: $.t('screens.profile.edit.app_tokens.new_app_button')
    });

    var openFunction = $('html').hasClass('ie7') ? 'toggle' : 'slideToggle';

    $showFormButton.click(function(){
        $newTokenArea.hide()
            .removeClass('hide')
            [openFunction]();
        $showFormButton.addClass('disabled');
    });

    $cancelButton.click(function(event){
        event.preventDefault();
        $newTokenArea[openFunction]();
        $showFormButton.removeClass('disabled');
    });

    if ($('.existingTokens').hasClass('noTokensYet'))
    {
        $newTokenArea.removeClass('hide');
    }
    else
    {
        $newTokenArea
            .before($showFormButton);
    }

    $('.deleteTokenButton').click(function(event)
    {
        if (!confirm($.t('screens.profile.edit.app_tokens.delete_confirm')))
        {
            event.preventDefault();
        }
    });

    $('.uploadAppTokenImage').imageUploader({
        name: 'appTokenUploader',
        $error: $('.thumbnailError'),
        $image: $('.thumbnailArea'),
        success: function($container, $image) {
            $image.removeClass('noThumbnail').addClass('thumbnail');
        },
        urlProcessor: function(response) {
             return "/api/file_data/" + response.thumbnailSha + "?size=thumb";
        }
    });

    $('.existingTokens .showSecretLink').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        $.ajax({url: '/api/users/' + $a.data('userid') + '/app_tokens/' +
            $a.data('apptokenid'), data: {method: 'getSecret'}, cache: false,
            type: 'GET', dataType: 'json', contentType: 'application/json',
            success: function(secretToken)
            {
                $a.siblings('.appTokenText').text(secretToken);
                $a.hide();
            }
        });
    });

    var $content = $('<div/>').append($.t('account.common.form.password_requirements_html'));

    $('.passwordHint').socrataTip({ content: $content });
});

