;(function($)
{
    $.fn.wizard = function(options)
    {
        var opts = $.extend({}, $.fn.wizard.defaults, options);

        return this.each(function()
        {
            var $wizard = $(this);
            var $paneContainer = $wizard.children('ul');
            var $panes = $paneContainer.children('li');
            var numPanes = $panes.length;

            var $currentPane = $panes.first();
            var currentPaneIndex = 0;
            var currentPaneConfig = opts.paneConfig[$currentPane.attr('data-wizardPaneName')] || {};

            // reshow panes
            $panes.show();

            // positioning
            var animateState = function()
            {
                $paneContainer.animate({ marginLeft: $wizard.outerWidth(false) * currentPaneIndex * -1 });
                $wizard.animate({ height: $currentPane.outerHeight(true) });

                // prevent people from tabbing to the next page
                $wizard.find(':input,a').attr('tabindex', -1);
                $currentPane.find(':input,a').attr('tabindex', '');
            };

            var updateButtonState = function()
            {
                $prevButton.removeClass('disabled');
                $nextButton.removeClass('disabled');

                if ($currentPane.is(':first-child'))
                {
                    $prevButton.addClass('disabled');
                }

                if ($currentPane.is(':last-child'))
                {
                    $nextButton
                        .addClass('default')
                        .text(opts.finishText);
                }
                else
                {
                    $nextButton
                        .removeClass('default')
                        .text(opts.nextText);
                }

                var buttonLookup = {
                    'prev': $prevButton,
                    'next': $nextButton
                }
                _.each(currentPaneConfig.disableButtons || [], function(disable)
                {
                    buttonLookup[disable].addClass('disabled');
                });
            };
            var prevPane = function()
            {
                $currentPane = $currentPane.prev();
                currentPaneIndex--;
                currentPaneConfig = opts.paneConfig[$currentPane.attr('data-wizardPaneName')] || {};

                animateState();
                updateButtonState();
            };
            var nextPane = function()
            {
                $currentPane = $currentPane.next();
                currentPaneIndex++;
                currentPaneConfig = opts.paneConfig[$currentPane.attr('data-wizardPaneName')] || {};

                animateState();
                updateButtonState();
            };

            // append control row
            var $wizardButtons = $.tag({ tagName: 'ul', 'class': 'wizardButtons clearfix', contents: [
                { tagName: 'li', 'class': 'cancel', contents: { tagName: 'a', 'class': 'button cancelButton',
                    contents: opts.cancelText, href: opts.cancelPath } },
                { tagName: 'li', 'class': 'next', contents: { tagName: 'a', 'class': 'button nextButton',
                    contents: opts.nextText, href: '#' } },
                { tagName: 'li', 'class': 'prev', contents: { tagName: 'a', 'class': 'button prevButton',
                    contents: opts.prevText, href: '#' } }
            ] });
            $wizard.after($wizardButtons);

            var $prevButton = $wizardButtons.find('.prevButton');
            var $nextButton = $wizardButtons.find('.nextButton');

            $prevButton.click(function(event)
            {
                event.preventDefault();
                if ($prevButton.is('.disabled')) { return; }

                prevPane();
                $currentPane.trigger('wizard-paneActivated');
            });

            $nextButton.click(function(event)
            {
                event.preventDefault();
                if ($nextButton.is('.disabled')) { return; }

                // I think this is a filed bug:
                // http://plugins.jquery.com/content/valid-and-single-optional-elements
                // but the issue is that the Contact Email field is failing
                // validation even when not filled in. So we need to manually select
                // everything that is non-empty or required
                var $vizItems = $currentPane.find(':input:visible');
                if ((currentPaneConfig.skipValidation !== true) &&
                    !$vizItems.filter(':not(.prompt)')
                        .add($vizItems.filter('.required')).valid())
                {
                    return;
                }

                if ($currentPane.is(':last-child'))
                {
                    opts.finishCallback();
                    return;
                }

                nextPane();
                $currentPane.trigger('wizard-paneActivated');
            });

            $wizard.bind('wizard-prev', function() { prevPane(); });
            $wizard.bind('wizard-next', function() { nextPane(); });

            // sizing
            var adjustSize = function()
            {
                var targetWidth = $wizard.outerWidth(false);
                $panes.width(targetWidth);

                $paneContainer.width(targetWidth * numPanes);

                animateState();
            };
            $(document).resize(adjustSize);
            adjustSize();

            // track the height of the current pane
            setInterval(animateState, 2000);

            // default state
            updateButtonState();
        });
    };

    $.fn.wizard.defaults = {
        cancelPath: '#cancel',
        cancelText: 'Cancel',
        finishCallback: function() {},
        finishText: 'Finish',
        nextText: 'Next',
        paneConfig: {},
        // keys are values of data-wizardPaneName elems that correlate; subkeys are:
        //   * disableButtons: [ 'prev', 'next' ]
        //   * noValidation: true/false
        prevText: 'Previous'
    };
})(jQuery);
