(function($)
{
    $.Control.extend('pane_embedSdp', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.sdp.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.sdp.subtitle'); },

        isAvailable: function()
        {
            return this._view.valid && (!this._view.temporary || this._view.minorChange);
        },

        getDisabledSubtitle: function()
        {
            return !this._view.valid ||
                (this._view.temporary && !this._view.minorChange) ?
                    $.t('screens.ds.grid_sidebar.sdp.validation.valid_saved') :
                    $.t('screens.ds.grid_sidebar.sdp.validation.public');
        },

        _getSections: function()
        {
            var cpObj = this;
            return [
                {
                    customContent: {
                        template: 'embedForm',
                        directive: {},
                        data: {},
                        callback: function($formElem)
                        {
                            $formElem.find('.privateDatasetMessage').toggleClass('hide', cpObj._view.isPublic());

                            $formElem.embedForm({
                                invalidCallback: function()
                                {
                                    $formElem.closest('.paneContent')
                                        .find('.button[data-value=preview]').addClass('disabled');
                                },
                                validCallback: function()
                                {
                                    $formElem.closest('.paneContent')
                                        .find('.button[data-value=preview]').removeClass('disabled');
                                }
                            });

                            var form_contents = $formElem.find('#form_code').text();
                            $formElem.find('#form_code').text($.htmlUnescape(form_contents));
                        }
                    }
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.done, { text: $.t('screens.ds.grid_sidebar.sdp.preview'), value: 'preview', isDefault: false }]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            cpObj._finishProcessing();
            var $embedForm = cpObj.$dom().find('.embedForm.commonForm');
            if ((value == 'preview') &&
                (!cpObj.$dom().find('.button[data-value=preview]').hasClass('disabled')))
            {
                var width = $embedForm.find('#embed_width').val();
                var height = $embedForm.find('#embed_height').val();
                var customizationId = $embedForm.find('#embed_template').val() || '';

                window.open(cpObj._view.url +
                    "/widget_preview?width=" + width + "&height=" + height +
                    "&customization_id=" + customizationId, "Preview");
            }
            if (_.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'embedSdp', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.embed) || !blist.sidebarHidden.embed.sdp) {
        $.gridSidebar.registerConfig('embed.embedSdp', 'pane_embedSdp', 1);
    } else {
        $('#sidebarOptions').find('li a.export').closest('li').hide();
    }

})(jQuery);
