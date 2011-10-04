(function($)
{
    $.Control.extend('pane_embedSdp', {
        getTitle: function()
        { return 'Social Data Player'; },

        getSubtitle: function()
        { return 'The Social Data Player enables you to publish this dataset on the Internet at large'; },

        isAvailable: function()
        {
            return this.settings.view.isPublic() && this.settings.view.valid &&
                (!this.settings.view.temporary || this.settings.view.minorChange);
        },

        getDisabledSubtitle: function()
        {
            return !this.settings.view.valid ||
                (this.settings.view.temporary && !this.settings.view.minorChange) ?
                'This view must be valid and saved' :
                'This view must be public before it can be published';
        },

        _getSections: function()
        {
            return [
                {
                    customContent: {
                        template: 'embedForm',
                        directive: {},
                        data: {},
                        callback: function($formElem)
                        {
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
                        }
                    }
                }
            ];
        },

        _getFinishButtons: function()
        { return [$.controlPane.buttons.done, { text: 'Preview', value: 'preview', isDefault: false }]; },

        _finish: function(data, value, finalCallback)
        {
            var cpObj = this;
            if (!cpObj._super.apply(cpObj, arguments)) { return; }

            var $embedForm = cpObj.$dom().find('.embedForm.commonForm');
            if ((value == 'preview') &&
                (!cpObj.$dom().find('.button[data-value=preview]').hasClass('disabled')))
            {
                var width = $embedForm.find('#embed_width').val();
                var height = $embedForm.find('#embed_height').val();
                var customizationId = $embedForm.find('#embed_template').val() || '';

                window.open(cpObj.settings.view.url +
                    "/widget_preview?width=" + width + "&height=" + height +
                    "&customization_id=" + customizationId, "Preview");
            }
            if (_.isFunction(finalCallback)) { finalCallback(); }
        }
    }, {name: 'embedSdp', noReset: true}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.embed) || !blist.sidebarHidden.embed.sdp)
    { $.gridSidebar.registerConfig('embed.embedSdp', 'pane_embedSdp', 1); }

})(jQuery);
