/**
 * This contains the logic for instantiating a template
 */
(function($) {

    var $form     = $('#insertionForm'),
        $renderTo = $('div.socrata-root'),
        $wizard   = $('div.templateCreation'),
        $body     = $(document.body);

    $.cf.configuration({
        mask:false,
        editOnly: true,
        sidebar: false
    });
    $.cf.edit(true);

    // Simulate a click into the first form element
    _.defer(function() {
        // $form.find('.socrata-component:first').trigger('mousedown');
    });

    $wizard.wizard({
        paneConfig: {
            'template': {
                onActivate: function($pane, config, state) {
                    _.each(state.insertionTips || [], function(tip) {
                        tip.enable();
                    });
                },

                onInitialize: function($pane, config, state, command) {
                    state.insertionTips = [];
                    $pane.find('div.insertion').each(function() {
                        var $t = $(this);
                        state.insertionTips.push(
                            $t.find('div.insertion-container').socrataTip({
                                content: $t.find('div.tooltip').html()
                            })
                        );
                    });
                },

                onLeave: function($pane, config, state)
                {
                    _.each(state.insertionTips || [], function(tip)
                    {
                        tip.hide();
                        tip.disable();
                    });
                },

                onNext: function($pane, state) {
                    $body.removeClass('instantiating');

                    var pageName = $.component('t_pageTitle').asString(),
                        pagePath = $.component('t_pagePath').asString();

                    var insertions = [];
                    $.component.eachRoot(function(root) {
                        insertions.push(root.properties());
                        // de-register components
                        root.destroy();
                    });

                    var templatron = new $.component.PageTemplate({ insertions: insertions });

                    // TODO: Data, Locale, Community
                    var page = blist.configuration.page = {
                        content: templatron.render($renderTo),
                        name: pageName,
                        'status': 'published', // TODO: not always
                        path: pagePath,
                        template: blist.configuration.template.identifier
                    };

                    // reset configuration
                    $.cf.edit(false);
                    $.cf.initialize($('div.socrata-cf-top'), {
                        edit: false
                    });

                    return 'rendered';
                }
            },

            'rendered': {
                isFinish: true,

                onActivate: function($pane) {
                    $pane.append($renderTo);
                },

                onAnimatedIn: function() {
                    $wizard.replaceWith($renderTo);
                },

                onNext: function() {
                    $.cf.save();
                    return false;
                }
            }
        },

        onCancel: function($pane, state) {
            // TODO: Something more appropriate than this?
            window.location.href = '/profile';
        },

        finishText: 'Create'
    });

    $body.addClass('instantiating');

})(jQuery);
