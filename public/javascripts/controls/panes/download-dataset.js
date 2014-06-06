(function($)
{
    $.Control.extend('pane_downloadDataset', {
        getTitle: function()
        { return $.t('screens.ds.grid_sidebar.download.title'); },

        getSubtitle: function()
        { return $.t('screens.ds.grid_sidebar.download.subtitle'); },

        isAvailable: function() {
            return this._view.valid && blist.dataset.isExportable();
        },

        getDisabledSubtitle: function() {
            if (this._view.valid) {
                return $.t('screens.ds.grid_sidebar.download.download_dataset');
            } else {
                return $.t('screens.ds.grid_sidebar.base.validation.invalid_view');
            }
        },

        _getSections: function()
        {
            var cObj = this;
            var _view = this._view;
            var type = this._view.isGeoDataset() ? 'geo' : this._view.newBackend ? 'nbe' : 'normal';
            var catchForm = !this._view.isGeoDataset();
            return [
                {
                    customContent: {
                        template: 'downloadsSectionContent',
                        directive: $.templates.downloadsTable.directive[type],
                        data: { downloadTypes: $.templates.downloadsTable.downloadTypes[type],
                                layerDownloadTypes: $.templates.downloadsTable.downloadTypes['geo_attributes'],
                                view: this._view },
                        callback: function($sect)
                        {
                            if (catchForm)
                            {
                                $sect.find('.downloadsList .item a').downloadToFormCatcher(_view,
                                        cObj.$dom());
                            }

                            if (_view.isGeoDataset()) {
                                _view.getChildOptionsForType('table', function(views) {
                                    var hookupLinks = function(uid) {
                                        $sect.find('.layerDownloadsContent .item a').each(function() {
                                            var $link = $(this);
                                            var childView = _.detect(views, function(view) {
                                                return view.id == uid;
                                            });
                                            $link.attr('href', childView.downloadUrl($link.data('type')));
                                        });
                                    };

                                    hookupLinks(views[0].id);

                                    if (views.length > 1)
                                    {
                                        $sect.find('.layerTableDownloads')
                                            .find('.layerChooser')
                                            .append(_.map(views, function(view) {
                                                return $.tag({
                                                    tagName: 'option',
                                                    contents: view.name, 'data-uid': view.id
                                                }, true);
                                            }).join(''))
                                            .change(function() {
                                                hookupLinks($(this).find('option:selected').data('uid'));
                                            })
                                            .end().addClass('hasChoices');
                                    }
                                });
                            }
                            $.templates.downloadsTable.postRender($sect);
                        }
                    }
                }
            ];
        }
    }, {name: 'downloadDataset'}, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.download)
    { $.gridSidebar.registerConfig('export.downloadDataset', 'pane_downloadDataset', 1); }

})(jQuery);
