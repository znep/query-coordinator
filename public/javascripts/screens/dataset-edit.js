;(function($)
{

blist.namespace.fetch('blist.importer');

var submitError = null;

var $wizard = $('.appendReplaceWizard');
$wizard.wizard({
    onCancel: function($pane, state)
    {
        var redirectToProfile = function()
        {
            window.location.href = '/profile';
        };

        if (!_.isUndefined(state.submittedView))
        {
            // well, if we fail we probably don't have anything we can delete anyway
            state.submittedView.remove(redirectToProfile, redirectToProfile);
        }
        else
        {
            redirectToProfile();
        }

        return false;
    },
    paneConfig: {

        'selectType': {
            disableButtons: [ 'next' ],
            onInitialize: function($pane, config, state, command)
            {
                // permissions
                if (!blist.importer.canReplace)
                {
                    $pane.find('.importTypeList a.replace')
                        .addClass('disabled')
                        .attr('title', 'You do not have sufficient privileges to replace the data in this dataset.');
                }

                // tooltips
                state.selectTypeTips = [];
                $pane.find('.importTypeList > li > a').each(function()
                {
                    var $this = $(this);
                    state.selectTypeTips.push($this.socrataTip({ message: $this.attr('title').clean(),
                        shrinkToFit: false, killTitle: true }));
                });

                // actions
                state.type = 'blist'; // necessarily this is what we're dealing with
                $pane.find('.importTypeList a.append').click(function(event)
                {
                    event.preventDefault();

                    state.operation = 'append';
                    state.afterUpload = 'appendReplaceColumns';
                    command.next('uploadFile');
                });
                $pane.find('.importTypeList a.replace').click(function(event)
                {
                    event.preventDefault();

                    if (!$(this).hasClass('disabled'))
                    {
                        state.operation = 'replace';
                        state.afterUpload = 'appendReplaceColumns';
                        command.next('uploadFile');
                    }
                });

            },
            onActivate: function($pane, config, state)
            {
                // reactivate tips if we have them
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.enable();
                });
            },
            onLeave: function($pane, config, state)
            {
                _.each(state.selectTypeTips || [], function(tip)
                {
                    tip.hide();
                    tip.disable();
                });
            }
        },

        'uploadFile':           blist.importer.uploadFilePaneConfig,
        'appendReplaceColumns': blist.importer.appendReplaceColumnsPaneConfig,
        'importing':            blist.importer.importingPaneConfig,
        'importWarnings':       blist.importer.importWarningsPaneConfig,

        'finish': {
            disableButtons: [ 'cancel', 'prev' ],
            isFinish: true,
            onNext: function($pane, state)
            {
                blist.importer.dataset.redirectTo();
                return false;
            }
        }
    }
});


})(jQuery);
