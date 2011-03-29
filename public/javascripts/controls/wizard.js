;(function($)
{
    $.fn.wizard = function(options)
    {
        var opts = $.extend({}, $.fn.wizard.defaults, options);

        return this.each(function()
        {
            var $wizard = $(this);
            var $paneContainer = $wizard.children('ul');
            var $panes = $paneContainer.children('li').detach();

            var $currentPane = $panes.first();
            var currentPaneConfig = opts.paneConfig[$currentPane.attr('data-wizardPaneName')] || {};

            var currentState = opts.state || {};

        // states
            var paneStack = [$currentPane];
            var stateStack = [currentState];

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
            var $cancelButton = $wizardButtons.find('.cancelButton');
            var buttonLookup = {
                cancel: $cancelButton,
                prev: $prevButton,
                next: $nextButton
            }

        // positioning
            var animateHoriz = function()
            {
                $paneContainer.animate({ marginLeft: -1 * $currentPane.position().left }, function()
                {
                    // animation is done; hide the gone-pane
                    $currentPane.siblings().detach();
                    $paneContainer.css('marginLeft', 0);
                });
                animateVert();
            };
            var animateVert = function()
            {
                $wizard.animate({ height: $currentPane.outerHeight(true) });
            };

        // flow
            // NOTE: prevPane and nextPane are also exposed as extern controller points
            var prevPane = function(prevAttr)
            {
                // figure out where we're going
                var $prevPane;

                if (_.isFunction(prevAttr))
                    prevAttr = prevAttr($currentPane, currentState);
                if ($.isBlank(prevAttr))
                    prevAttr = 1;
                if (prevAttr == 'beginning')
                    prevAttr = paneStack.length - 1;

                if (_.isNumber(prevAttr))
                {
                    paneStack.splice(paneStack.length - prevAttr);
                    stateStack.splice(stateStack.length - prevAttr);
                }
                else
                {
                    return; // not really sure what we were told to do.
                }

                // grab new currents
                var $prevPane = _.last(paneStack);
                var prevState = _.last(stateStack);

                // go there
                $currentPane.before($prevPane);
                $prevPane.show();
                $paneContainer.css('marginLeft', -1 * $prevPane.outerWidth());
                activatePane($prevPane, prevState);
                animateHoriz();
            };

            var nextPane = function(nextAttr)
            {
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

                // figure out where we're going
                var $nextPane;

                if (_.isFunction(nextAttr))
                {
                    nextAttr = nextAttr($currentPane, currentState);
                }
                if (_.isString(nextAttr))
                {
                    $nextPane = $panes.filter('[data-wizardPaneName="' + nextAttr + '"]:first');
                }
                else if (_.isUndefined(nextAttr))
                {
                    $nextPane = $currentPane.next();
                }

                if ($.isBlank($nextPane) || _.isUndefined($nextPane.jquery))
                    return; // whatever we ended up with, it's not a $pane

                // clone fresh copies
                var nextState = $.extend({}, currentState);
                $nextPane = $nextPane.clone(true);

                // update stacks
                stateStack.push(nextState);
                paneStack.push($nextPane);

                // go there
                $currentPane.after($nextPane);
                $nextPane.show();
                activatePane($nextPane, nextState);
                animateHoriz();
            };

            // takes a pane and readies it for being shown, including all callbacks
            // the plugin consumer expects, and readying the general UI state.
            var activatePane = function($pane, state)
            {
                var paneConfig = opts.paneConfig[$pane.attr('data-wizardPaneName')] || {};

                // init command obj for consumers to trigger pane actions
                var commandObj = {
                    prev: prevPane,
                    next: nextPane
                };

                // fire events people are expecting
                if (!$pane.data('wizard-initialized'))
                {
                    if (_.isFunction(paneConfig.onInitialize))
                        paneConfig.onInitialize($pane, paneConfig, state, commandObj);

                    if (paneConfig.uniform === true)
                        $pane.find(':radio, :checkbox, select').uniform();

                    $pane.data('wizard-initialized', true);
                }

                if (_.isFunction(paneConfig.onActivate))
                    paneConfig.onActivate($pane, paneConfig, state, commandObj);

                // blur all text inputs to set hint text to correct state
                $pane.find('input[type=text], textarea').blur();

                // reset and reevaluate button states
                $nextButton.text(opts.nextText).removeClass('disabled default');
                $prevButton.text(opts.prevText).removeClass('disabled');
                $cancelButton.removeClass('disabled');

                if (paneStack.length === 1)
                    $prevButton.addClass('disabled');

                if (paneConfig.isFinish === true)
                    $nextButton.text(opts.finishText).addClass('default');

                _.each(paneConfig.disableButtons || [], function(disable)
                {
                    var $button = buttonLookup[disable] || {}; // a bit of bulletproofing
                    if ($button.jquery) $button.addClass('disabled');
                });

                // set currents
                $currentPane = $pane;
                currentPaneConfig = paneConfig;
                currentState = state;
            };

        // events
            $prevButton.click(function(event)
            {
                event.preventDefault();
                if ($prevButton.is('.disabled')) { return; }

                prevPane(currentPaneConfig.onPrev);
            });

            $nextButton.click(function(event)
            {
                event.preventDefault();
                if ($nextButton.is('.disabled')) { return; }

                nextPane(currentPaneConfig.onNext);
            });

            // sizing
            var adjustSize = function()
            {
                var targetWidth = $wizard.outerWidth(false);
                $panes.width(targetWidth);

                $paneContainer.width(targetWidth * 2);

                animateHoriz();
            };
            $(document).resize(adjustSize);

            // track the height of the current pane
            setInterval(animateVert, 2000);

            // go.
            $currentPane.appendTo($paneContainer).show();
            activatePane($currentPane, currentState);
            adjustSize();
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
        //   * isFinish: true/false
        //   * noValidation: true/false
        //   * onActivate: function($paneObject, paneConfig, state, commandObject)
        //     + fires every time a pane is activated
        //     + pane config will be evaluated *after* onActivate fires
        //   * onInitialize: function($paneObject, paneConfig, state, commandObject)
        //     + fires before onActivate the very first time a pane is activated
        //   * onNext: one of:
        //             + string => wizardPaneName to go to
        //             + function($paneObject, state) => return wizardPaneName to go to
        //             + leave unconfigured => next pane in the original list
        //   * onPrev: one of:
        //             + int => go back some number of stack items
        //             + 'beginning' => go back to the first pane
        //             + function($paneObject, state) => return int
        //             + leave unconfigured => go back one in the stack
        //   * uniform: true/false (default false)
        prevText: 'Previous',
        state: {}
    };
})(jQuery);
