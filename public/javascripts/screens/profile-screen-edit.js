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
        $throbber      = $form.find('.uploadIndicator'),
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
    var $imageChange = $('.uploadNewImage').click(function(event)
    { event.preventDefault(); });


    var createImageUploader = function($link, $imageDiv, $errorDiv,
        uploaderName, urlFunction, loading, success)
    {
        new AjaxUpload($link, {
            action: $link.attr('href'),
            autoSubmit: true,
            name: uploaderName,
            responseType: 'json',
            onSubmit: function (file, ext)
            {
                if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
                {
                    $errorDiv
                        .show();
                    return false;
                }
                $errorDiv
                    .hide();
                loading();
            },
            onComplete: function (file, response)
            {
                success();

                $imageDiv.animate({opacity: 0}, {complete: function()
                    {
                        $('<img/>')
                            .attr('src', urlFunction(response))
                            .load(function() {
                                $imageDiv
                                    .empty()
                                    .append($(this))
                                    .animate({opacity: 1});
                            });
                    }
                });
            }
        });
    };

    // Don't create the ajax uploader unless the button is present
    if ($imageChange.length > 0)
    {
        createImageUploader($imageChange, $profileImage, $errorMessage,
            'profileImageInput', function(response) {
                return response.large + '?_=' + new Date().getTime();
        }, function() { $throbber.show(); }, function() { $throbber.hide(); });
    }

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
        $cancelButton = $('.cancelButton');

    $newTokenForm
        .find('input:checkbox').uniform()
            .end()
        .validate(validationHash);

    var $showFormButton = $.tag({
        tagName: 'a',
        'class': 'button add showCreateTokenButton',
        contents: 'Create New Application'
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
        if (!confirm('Are you sure you want to delete this application? ' +
                     'The corresponding app_token will no longer be valid'))
        {
            event.preventDefault();
        }
    });

    var $appTokenImages = $('.uploadAppTokenImage').click(function(event)
    {
        event.preventDefault();
    });

    $appTokenImages.each(function(index, element)
    {
        var $link      = $(element),
            $line      = $link.closest('.appTokenDisplay'),
            $indicator = $line.find('.uploadIndicator'),
            $thumbArea = $line.find('.thumbnailArea'),
            $error     = $line.find('.error'),
            name       = 'appTokenAjax' + index;

        createImageUploader($link, $thumbArea, $error, name, function(response) {
            return "/api/file_data/" + response.thumbnailSha + "?size=thumb&_=" + new Date().getTime();
        }, function() {
            $line.addClass('working');
        }, function() {
            $line.removeClass('working');
            $thumbArea
                .removeClass('noThumbnail')
                .addClass('thumbnail');
        });
    });

    $('.existingTokens .showSecretLink').click(function(e)
    {
        e.preventDefault();
        var $a = $(this);
        $.ajax({url: '/api/users/' + $a.data('userId') + '/app_tokens/' +
            $a.data('appTokenId'), data: {method: 'getSecret'},
            type: 'GET', dataType: 'json', contentType: 'application/json',
            success: function(secretToken)
            {
                $a.siblings('.appTokenText').text(secretToken);
                $a.hide();
            }
        });
    });
});

