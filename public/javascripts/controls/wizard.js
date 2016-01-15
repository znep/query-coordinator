;(function($)
{
    $.fn.wizard = function(options)
    {
        var opts = $.extend({}, $.fn.wizard.defaults, options);

        return this.each(function()
        {
            var $wizard = $(this);
            $wizard.attr('aria-live', 'polite');
            var $paneContainer = $wizard.children('ul');

            var $panes = $paneContainer.children('li').detach();

            var $currentPane, currentPaneConfig, currentState;

        // states
            var paneStack = [];
            var stateStack = [];

        // append control row
            var $wizardButtons = $.tag({ tagName: 'ul', 'class': 'wizardButtons clearfix',
                'aria-live': 'polite', contents: [
                { tagName: 'li', 'class': 'cancel', contents: { tagName: 'a', 'class': 'button cancelButton',
                    contents: opts.cancelText,
                    href: _.isString(opts.onCancel) ? opts.onCancel : '#cancel' } },
                { tagName: 'li', 'class': 'next', contents: { tagName: 'a', 'class': 'button nextButton',
                    contents: opts.nextText, href: '#' } },
                { tagName: 'li', 'class': 'prev', contents: { tagName: 'a', 'class': 'button prevButton',
                    contents: opts.prevText, href: '#' } }
            ] });

            if (opts.buttonContainerId) {
              $('#' + opts.buttonContainerId).append($wizardButtons);
            } else {
              $wizard.after($wizardButtons);
            }

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
                $paneContainer.stop().animate({ marginLeft: -1 * $currentPane.position().left }, function()
                {
                    // animation is done; hide the gone-pane
                    $currentPane.siblings().detach();
                    $paneContainer.css('marginLeft', 0);

                    var paneConfig = opts.paneConfig[$currentPane.data('wizardpanename')] || {};
                    if (_.isFunction(paneConfig.onAnimatedIn)) {
                        paneConfig.onAnimatedIn($currentPane);
                    }
                });

                animateVert();
            };
            var animateVert = function()
            {
                $wizard.stop().animate({ height: $currentPane.outerHeight(true) }, function()
                {
                    _.defer(function() { $wizard.css('height', ''); });
                });
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
                    paneStack.splice(paneStack.length - prevAttr, prevAttr);
                    stateStack.splice(stateStack.length - prevAttr, prevAttr);
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
                if ((currentPaneConfig.skipValidation !== true) && !valid($currentPane))
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
                    $nextPane = $panes.filter('[data-wizardpanename="' + nextAttr + '"]:first');
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

            var valid = function($pane)
            {
                // I think this is a filed bug:
                // http://plugins.jquery.com/content/valid-and-single-optional-elements
                // but the issue is that the Contact Email field is failing
                // validation even when not filled in. So we need to manually select
                // everything that is non-empty or required
                var $vizItems = $pane.find(':input:visible');
                return $vizItems.filter(':not(.prompt)')
                           .add($vizItems.filter('.required')).valid();
            };

            // takes a pane and readies it for being shown, including all callbacks
            // the plugin consumer expects, and readying the general UI state.
            var activatePane = function($pane, state)
            {
                var paneConfig = opts.paneConfig[$pane.data('wizardpanename')] || {};
                // track step in wizard as a pageview
                if (typeof _gaSocrata !== 'undefined') {
                    _gaSocrata('socrata.send', 'pageview', '{0}#{1}'.format(window.location.href, $pane.data('wizardpanename')));
                }

                // init command obj for consumers to trigger pane actions
                var commandObj = {
                    prev: prevPane,
                    next: nextPane,
                    valid: function() { return valid($currentPane); }
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
                $nextButton.text(paneConfig.nextText || opts.nextText).removeClass('disabled default');
                $prevButton.text(paneConfig.prevText || opts.prevText).removeClass('disabled');
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

                // fire events the old pane is expecting
                if (!_.isUndefined(currentPaneConfig) && _.isFunction(currentPaneConfig.onLeave))
                    currentPaneConfig.onLeave($currentPane, currentPaneConfig, currentState);

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

            $cancelButton.click(function(event)
            {
                event.preventDefault();
                if ($cancelButton.is('.disabled')) { return; }

                var destination = opts.onCancel;
                if (_.isFunction(destination))
                    destination = destination($currentPane, currentState);

                if (_.isString(destination))
                    window.location.href = destination;
            });

            $wizard.closest('form').submit(function(event)
            {
                event.preventDefault();
                $nextButton.click();

                return false; // for IE
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

            // go.
            var $initialPane = $panes.first();
            var initialState = opts.state || {};
            paneStack.push($initialPane);
            stateStack.push(initialState);
            $initialPane.appendTo($paneContainer).show();
            activatePane($initialPane, initialState);
            adjustSize();
        });
    };

    $.fn.wizard.defaults = {
        cancelText: $.t('screens.wizard.cancel'),
        finishCallback: function() {},
        finishText: $.t('screens.wizard.finish'),
        nextText: $.t('screens.wizard.next'),
        onCancel: '#cancel', // either string (url path), or function (handle it yourself)
        paneConfig: {},
        // keys are values of data-wizardpanename elems that correlate; subkeys are:
        //   * disableButtons: [ 'prev', 'next' ]
        //   * isFinish: true/false
        //   * skipValidation: true/false
        //   * onActivate: function($paneObject, paneConfig, state, commandObject)
        //     + fires every time a pane is activated
        //     + pane config will be evaluated *after* onActivate fires
        //   * onInitialize: function($paneObject, paneConfig, state, commandObject)
        //     + fires before onActivate the very first time a pane is activated
        //   * onNext: one of:
        //             + string => wizardpanename to go to
        //             + function($paneObject, state) => return wizardpanename to go to
        //             + leave unconfigured => next pane in the original list
        //   * onPrev: one of:
        //             + int => go back some number of stack items
        //             + 'beginning' => go back to the first pane
        //             + function($paneObject, state) => return int
        //             + leave unconfigured => go back one in the stack
        //   * onLeave: function($paneObject, paneConfig, state)
        //     + fires right before a pane is navigated away from in either direction
        //   * uniform: true/false (default false)
        prevText: $.t('screens.wizard.previous'),
        state: {}
    };
})(jQuery);
