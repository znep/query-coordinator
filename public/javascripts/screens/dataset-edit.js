;(function($)
{

blist.namespace.fetch('blist.importer');

var submitError = null;

var $wizard = $('.appendReplaceWizard');
$wizard.wizard({
    onCancel: function($pane, state)
    {
        blist.importer.dataset.redirectTo();
    },
    paneConfig: {

        'selectType': {
            disableButtons: [ 'next' ],
            onInitialize: function($pane, config, state, command)
            {
                var isBlobby = blist.importer.dataset.viewType == 'blobby';

                // permissions
                if (!_.include(blist.importer.dataset.rights, 'delete'))
                {
                    $pane.find('.importTypeList a.replace')
                        .addClass('disabled')
                        .attr('title', 'You do not have sufficient privileges to replace the data in this dataset.');
                }
                if (blist.importer.dataset.viewType == 'blobby')
                {
                    $pane.find('.importTypeList a.append')
                        .addClass('disabled')
                        .attr('title', 'You cannot append into a blobby dataset.');
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
                state.type = isBlobby ? 'blobby' : 'blist';
                $pane.find('.importTypeList a.append').click(function(event)
                {
                    event.preventDefault();
                    if ($(this).hasClass('disabled')) return;

                    state.operation = 'append';
                    state.afterUpload = isBlobby ? 'finish' : 'appendReplaceColumns';
                    command.next('uploadFile');
                });
                $pane.find('.importTypeList a.replace').click(function(event)
                {
                    event.preventDefault();
                    if ($(this).hasClass('disabled')) return;

                    state.operation = 'replace';
                    state.afterUpload = isBlobby ? 'finish' : 'appendReplaceColumns';
                    command.next('uploadFile');
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
        'importWarnings':       $.extend({}, blist.importer.importWarningsPaneConfig, { disableButtons: [ 'cancel', 'prev' ] }),

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
