/* attribution edit widget
 * To be used with the attribution_edit partial. Handles form flow, validation,
 *  and submission for attribution editing.
 *
 * Params:
 *  triggerButton: The jQuery object representing the button that should show
 *      the attribution edit widget.
 *
 *  closeButton: The jQuery object representing the button that should hide the
 *      attribution edit widget.
 *
 *  attributionContainer: The jQuery object representing the element that the
 *      attribution edit widget should replace when shown.
 *
 *  licensingInfoSelector: The selector for the object that the updated licensing
 *      data should be inserted into upon a successful submit.  Not respected if a
 *      custom callback is used.
 *
 *  attributionInfoSelector: The selector for the object that the updated attribution
 *      data should be inserted into upon a successful submit.  Not respected if a
 *      custom callback is used.
 *
 * Author: clint.tseng@socrata.com
 */

(function($)
{
    $.fn.attributionEdit = function(options)
    {
        // build main options before element iteration
        var opts = $.extend({}, $.fn.attributionEdit.defaults, options);

        // Wire up each matched element
        return this.each(function()
        {
            var $this = $(this);
            var $form = $this.find('form');

            var $trigger = opts.triggerButton || $(opts.triggerButtonSelector);
            var $close = opts.closeButton || $(opts.closeButtonSelector);
            var $container = opts.attributionContainer || $(opts.attributionContainerSelector);

            // Open edit form on pressing trigger
            $trigger.click(function(event)
            {
                event.preventDefault();
                $this.slideDown("normal");
                $container.slideUp("normal");
            });

            // Close edit form on pressing cancel
            $close.click(function(event)
            {
                event.preventDefault();
                $this.slideUp("normal");
                $container.slideDown("normal");
            });

            // URL validation for form
            $form.validate({
                rules: {
                    "view[attributionLink]": "customUrl"
                },
                messages: {
                    "view[attributionLink]": "That does not appear to be a valid url."
                }
            });

            // Cascading dropdown behavior
            var updateCascadingDropdown = function()
            {
                if ($this.find("#view_licenseId").val() == "CC")
                {
                    // Creative commons option; expand cascade
                    $this.find('#license_cc_type').closest('dl').show();
                    $this.find('#view_attribution').closest('dl').children('dt').append(
                        $('<span>*</span>').addClass('required'));
                    $this.find("#view_attribution").rules("add", {
                        required: true,
                        messages: { required: " You must attribute the dataset."}
                    });

                    $this.find('#view_licenseId').attr('name', '');
                    $this.find('#license_cc_type').attr('name', 'view[licenseId]');
                }
                else
                {
                    // Not creative commons option; collapse cascade
                    $this.find('#license_cc_type').closest('dl').hide();
                    $this.find('#view_attribution').closest('dl').children('dt').children('.required').remove();
                    $this.find("#view_attribution").rules("remove");
                    $this.find('#view_licenseId').attr('name', 'view[licenseId]');
                    $this.find('#license_cc_type').attr('name', '');
                }
            };
            $this.find('#view_licenseId').change(updateCascadingDropdown);
            updateCascadingDropdown();

            // Form submit behavior
            $this.find('#attributionEditSubmitButton').click(function(event)
            {
                event.preventDefault();
                // Clear text prompt examples manually
                $form.find('input').blur();
                $form.find('.textPrompt.prompt')
                    .val('')
                    .removeClass('textPrompt')
                    .removeClass('prompt');

                if ($form.valid())
                {
                    $.ajax({
                        url: $form.attr("action"),
                        type: "PUT",
                        data: $form.find(":input"),
                        dataType: "json",
                        success: function(responseData) { opts.successCallback(responseData, opts) }
                    });
                }
            });
        });
    };

    $.fn.attributionEdit.defaults = {
        triggerButtonSelector: '.attributionSummary dl.actionList>*',
        attributionContainerSelector: '.attributionSummary',
        licensingInfoSelector: '.attributionSummary .infoLicensing',
        attributionInfoSelector: '.attributionSummary .infoAttribution',
        closeButtonSelector: '.closeAttributionLink',
        successCallback: function(responseData, opts)
        {
            if (responseData['error'] == 'Validation failed')
            {
                var $label = $('div.itemContent>div:has(#view_attributionLink) label');
                if ($label.length == 0)
                {
                    $label = $('<label/>').addClass("error");
                }
                $label
                    .text("That does not appear to be a valid url.")
                    .insertAfter($("#view_attributionLink"));

                return;
            }

            if (responseData['license'])
            {
                if (responseData['license']['logoUrl'])
                {
                    $(opts.licensingInfoSelector).empty().append(
                        $('<a/>').attr('href', responseData['license']['termsLink']).append(
                            $('<img/>')
                                .attr('src', '/' + responseData['license']['logoUrl'])
                                .attr('alt', responseData['license']['name'])));
                }
                else
                {
                    $(opts.licensingInfoSelector)
                        .empty()
                        .text(responseData['license']['name']);
                }
            }
            else
            {
                $(opts.licensingInfoSelector).empty().text('No License');
            }

            if (responseData['attribution'])
            {
                if (responseData['attributionLink'])
                {
                    $(opts.attributionInfoSelector).empty().append(
                        $('<a/>')
                            .attr('href', responseData['attributionLink'])
                            .text(responseData['attribution']));
                }
                else
                {
                    $(opts.attributionInfoSelector).text(responseData['attribution']);
                }
            }
            else
            {
                $(opts.attributionInfoSelector).empty();
            }

            $('.attributionEdit').slideUp("normal");
            $(opts.attributionContainerSelector).slideDown("normal");
        }
    };
})(jQuery);