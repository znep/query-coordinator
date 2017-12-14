(function($) {
  $.Control.extend('pane_downloadDataset', {
    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.download.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.download.subtitle');
    },

    isAvailable: function() {
      return this._view.valid;
    },

    getDisabledSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.base.validation.invalid_view');
    },

    _getSections: function() {
      var cObj = this;
      var _view = this._view;
      var type = this._view.getDownloadType();
      var layerDownloadType = (_view.newBackend && _view.isLayered()) ? 'layer_geojson_attributes' : 'layer_attributes';
      var catchForm = !this._view.isGeoDataset();
      var hideCsvForExcel = !!blist.feature_flags.hide_csv_for_excel_download;

      /**
       * copied from ExportFlannel.js in datasetLandingPage
       *
       * Used below to filter out the 'CSV for Excel' options from the list of links if
       * the hide_csv_for_excel_download feature flag is set to true.
       *
       * The code here is expecting a hard-coded string that is not currently translated. It
       * comes from `#normal_download_types` in the datasets_helper.rb. If that is ever changed
       * this code will need to be updated.
       */
      function csvForExcelOrTrue(value) {
        return !(hideCsvForExcel && value.match(/^CSV for Excel/));
      }

      return [{
        customContent: {
          template: 'downloadsSectionContent',
          directive: $.templates.downloadsTable.directive[type],
          data: {
            downloadTypes: $.templates.downloadsTable.downloadTypes[type].filter(csvForExcelOrTrue),
            layerDownloadTypes: $.templates.downloadsTable.downloadTypes[layerDownloadType],
            view: this._view
          },
          callback: function($sect) {
            if (catchForm) {
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

                if (views.length > 1) {
                  $sect.find('.layerTableDownloads').
                    find('.layerChooser').
                    append(_.map(views, function(view) {
                      return $.tag({
                        tagName: 'option',
                        contents: view.name,
                        'data-uid': view.id
                      }, true);
                    }).join('')).
                    change(function() {
                      hookupLinks($(this).find('option:selected').data('uid'));
                    }).
                    end().addClass('hasChoices');
                }
              });
            }
            $.templates.downloadsTable.postRender($sect);
          }
        }
      }];
    }
  }, {
    name: 'downloadDataset'
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.exportSection) || !blist.sidebarHidden.exportSection.download) {
    $.gridSidebar.registerConfig('export.downloadDataset', 'pane_downloadDataset', 1);
  }

})(jQuery);
