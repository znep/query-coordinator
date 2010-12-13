(function($)
{
    var config =
    {
        name: 'about',
        priority: 6,
        title: 'About This Dataset',
        sections: [
            {
                customContent: {
                    template: 'aboutDataset',
                    directive: {},
                    data: {},
                    callback: function($sect)
                    {
                        // IE7/8 can't handle the slideToggle.  It also gets
                        // confused about the current state.
                        var toggleAction = ($.browser.msie &&
                            ($.browser.majorVersion <= 8)) ?
                            'toggle' : 'slideToggle';

                        $sect.find('.datasetAverageRating').each(function()
                        {
                            var $star = $(this);

                            $star.stars({
                                value: $star.attr('data-rating'),
                                enabled: true,
                                onChange: function(value)
                                {
                                    blist.util.doAuthedAction('rate this dataset', function()
                                    {
                                        blist.dataset.updateRating(
                                            {
                                                type: $star.attr('data-rating-type'),
                                                rating: (value * 20)
                                            },
                                            function(responseData)
                                            {
                                                // If the type is returned, that means it's newly created.
                                                // Update totals
                                                if (!_.isUndefined(responseData.type))
                                                {
                                                    $sect.find('.totalTimesRated').text(
                                                        parseInt($.trim($sect.find('.totalTimesRated').text())) + 1);
                                                }
                                                $star.attr('title', '');
                                            }
                                        );
                                    });
                                }
                            });
                        });

                        $.live('#gridSidebar_about .expander', 'click', function(event)
                        {
                            event.preventDefault();
                            var $this = $(this);

                            $this
                                .toggleClass('expanded')
                                .toggleClass('collapsed')
                                .siblings('.sectionContent')[toggleAction]
                                    ($this.hasClass('expanded'));
                        });

                        $sect.find('.showStatisticsLink').click(function(event)
                        {
                            event.preventDefault();
                            $('.statsPopupModal').jqmShow();
                        });

                        // Build the email subject for flag/message
                        var contactPurposeChange = function(event)
                        {
                            var $select = $sect.find('#contactPurpose');

                            var type = $select.val();
                            var subject = '';

                            if ($.isBlank(type)) { return; }

                            if (type == 'other')
                            {
                                subject = 'A visitor has sent you a message about your "' +
                                      blist.dataset.name + '" ' +
                                      blist.configuration.strings.company + ' dataset';
                            }
                            else
                            {
                                subject = 'Your dataset "' + blist.dataset.name + '" has been flagged ';
                                switch (type)
                                {
                                    case 'copyright_violation':
                                        subject += 'for copyright violation';
                                        break;
                                    case 'offensive_content':
                                        subject += 'for offensive content';
                                        break;
                                    case 'spam':
                                        subject += 'as potential spam';
                                        break;
                                    case 'personal_information':
                                        subject += 'for containing personal information';
                                        break;
                                }
                            }
                            $sect.find('#contactSubject').val(subject);
                            $sect.find('#contactBody').focus();
                        };

                        // Swap out links for form and back, show 'required' hint
                        var toggleContactActions = function()
                        {
                            $sect.find('.contactOwnerForm')[toggleAction]()
                                .find('#contactBody')
                                    .focus().end().end()
                                .find('.contactOwnerLinks')
                                    [toggleAction]().end();
                        };

                        $.live('#gridSidebar_about .contactButton',
                            'click', function(event)
                        {
                            event.preventDefault();
                            var $this = $(this);

                            $sect.find('.flash')
                                .removeClass('notice')
                                .text('').fadeOut();

                            // Grab the form from its template
                            if ($sect.find('.contactOwnerForm').length === 0)
                            {
                                $this.closest('.formSection').after($.renderTemplate('aboutDataset_contact'));
                                var $form = $sect.find('.contactOwnerForm');

                                $form.validate({
                                    rules: {
                                        'type'   : 'required',
                                        'subject': 'required',
                                        'message': 'required',
                                        'from_address': {'required': true, 'email': true}
                                    },
                                    messages: {
                                        'type'   : 'You must select a purpose for this message.',
                                        'subject': 'You must choose a subject for this message.',
                                        'message': 'The message must have a body.',
                                        'from_address': {
                                            required: 'Your email address is required.'
                                        }
                                    },
                                    errorPlacement: function($error, $element)
                                    { $error.appendTo($element.closest('.lined')); }
                                });

                                $sect.find('#contactPurpose')
                                    .change(contactPurposeChange)
                                    .uniform();

                                $form.submit(function(event)
                                {
                                    event.preventDefault();

                                    if ($form.valid())
                                    {
                                        $.ajax({
                                            url: $form.attr('action'),
                                            data: $form.serialize(),
                                            type: 'POST', dataType: 'json',
                                            error: function(request, textStatus, errorThrown) {
                                                $sect.find('.flash:not(.math_message)')
                                                  .removeClass('notice').addClass('error')
                                                  .text('There was an error sending feedback for this dataset. Please retry later.').show();
                                            },
                                            success: function(response) {
                                                if(response['success'] == true) {
                                                    _.defer(function() {
                                                        $sect.find('.flash:not(.math_message)')
                                                            .removeClass('error').addClass('notice')
                                                            .text('The dataset owner has been notified.').show();
                                                        toggleContactActions();
                                                    });

                                                    $sect.find('.math_message')
                                                        .removeClass('error').fadeOut();
                                                } else if (response['success'] == false) {
                                                    $sect.find('.math_message')
                                                        .removeClass('notice').addClass('error')
                                                        .text('Incorrect answer, please try again.').fadeIn();
                                                }
                                            }
                                        });
                                    }
                                });

                                $('#gridSidebar_about .sendContactButton').click(function(event)
                                {
                                    event.preventDefault();
                                    $form.submit();
                                });
                            }

                            var form = $sect.find('.contactOwnerForm');
                            form[0].reset();
                            form.validate().resetForm();

                            toggleContactActions();

                            // Pre-populate message subject
                            if (!_.isUndefined($this.attr('data-select')))
                            {
                               var $sel = $sect.find('#contactPurpose');
                               $sel.val($this.attr('data-select'));
                               contactPurposeChange();
                               $.uniform.update($sel);
                            }
                        });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
