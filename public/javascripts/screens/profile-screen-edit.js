;$(function()
{
    var $basicPane   = $('.editBasicInfoForm'),
        $imagePane   = $('.editImageForm'),
        $accountPane = $('.editAccountForm'),
        $currentPane = $('.editProfile .editForm').first(),
        $form        = $('#editProfileForm'),
        $accountForm = $('#editAccountForm');

    // Dynamic pane switching

    $('.editProfileNav li a').click(function(event)
    {
        event.preventDefault();
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
        else
        { $newPane = null; }

        if (!_.isNull($newPane) && $newPane[0] != $currentPane[0])
        {
            $currentPane.animate({opacity: 0}, function()
            {
                $currentPane.hide();
                $newPane
                    .css('opacity', 0)
                    .show()
                    .animate({opacity: 1});
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

    // Don't create the ajax uploader unless the button is present
    if ($imageChange.length > 0)
    {
        var uploader = new AjaxUpload($imageChange, {
            action: $imageChange.attr('href'),
            autoSubmit: true,
            name: 'profileImageInput',
            responseType: 'json',
            onSubmit: function (file, ext)
            {
                if (!(ext && /^(jpg|png|jpeg|gif|tif|tiff)$/.test(ext)))
                {
                    $errorMessage
                        .show();
                    return false;
                }
                $errorMessage
                    .hide();
                $throbber.show();
            },
            onComplete: function (file, response)
            {
                $throbber.hide();
                $profileImage.animate({opacity: 0}, {complete: function()
                    {
                        $('<img/>')
                            .attr('src', response.large + '?_=' + new Date().getTime())
                            .load(function() {
                                $profileImage
                                    .empty()
                                    .append($(this))
                                    .animate({opacity: 1});
                            });
                    }
                });
            }
        });

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
                            return !($(element).hasClass('noPassword'));
                        }
                        return false;
                    }
                }
            },
            "user[password_new]": {
                minlength: 6,
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
});

