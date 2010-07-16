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
                        var $stars = $sect.find('.datasetAverageRating');
                        $stars.stars({
                            value: $stars.attr('data-rating'),
                            enabled: false
                        });

                        $.live('#gridSidebar_about .expander', 'click', function(event)
                        {
                            event.preventDefault();
                            var $this = $(this);

                            $this
                                .toggleClass('expanded')
                                .toggleClass('collapsed')
                                .siblings('.sectionContent')
                                // IE8 can't handle the slideToggle.
                                // It also gets confused about the current state.
                                    [($.browser.msie && ($.browser.majorVersion == 8)) ?
                                        'toggle' : 'slideToggle']($this.hasClass('expanded'));
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
                                      blist.display.view.name + '" ' +
                                      blist.configuration.strings.company + ' dataset';
                            }
                            else
                            {
                                subject = 'Your dataset "' + blist.display.view.name + '" has been flagged ';
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
                            $sect.find('.contactOwnerForm').slideToggle()
                                .find('#contactBody')
                                    .focus().end().end()
                                .find('.contactOwnerLinks')
                                    .slideToggle().end();
                            $('#gridSidebar_about .scrollContent > div.required').toggleClass('hide');
                        };

                        $.live('#gridSidebar_about .contactButton',
                            'click', function(event)
                        {
                            var $this = $(this);

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
                                            required: 'Your email address is required.',
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
                                            error: function(request, textStatus, errorThrown) {
                                                $sect.find('.flash')
                                                  .removeClass('notice').addClass('error')
                                                  .text('There was an error sending feedback for this dataset. Please retry later.').fadeIn();
                                            },
                                            success: function(response) {
                                                _.defer(function() {
                                                    $sect.find('.flash')
                                                      .removeClass('error').addClass('notice')
                                                      .text('The dataset owner has been notified.').fadeIn();
                                                    toggleContactActions();
                                                });
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
                               $('#contactPurpose').val($this.attr('data-select'));
                               contactPurposeChange();
                               $.uniform.update();
                            }
                        });
                    }
                }
            }
        ]
    };

    $.gridSidebar.registerConfig(config);

})(jQuery);
