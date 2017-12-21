(function($) {

  blist.namespace.fetch('blist.importer');

  var $wizard = $('.appendReplaceWizard');
  $wizard.wizard({
    onCancel: function() {
      blist.importer.dataset.redirectTo();
    },
    onAnyActivated: function($pane) {
      // track step in wizard as a pageview in GA
      if (typeof window._gaSocrata !== 'undefined') {
        window._gaSocrata('socrata.send', 'pageview', '{0}/{1}'.format(window.location.href, $pane.data('wizardpanename')));
      }
    },
    paneConfig: {

      'selectType': {
        disableButtons: ['next'],
        onInitialize: function($pane, config, state, command) {
          var isBlobby = blist.importer.dataset.viewType == 'blobby',
            isGeo = GeoHelpers.isGeoDataset(blist.importer.dataset);

          // permissions
          if (!_.include(blist.importer.dataset.rights, blist.rights.view.DELETE)) {
            $pane.find('.importTypeList a.replace').
              addClass('disabled').
              attr('title', 'You do not have sufficient privileges to replace the data in this dataset.');
          }
          if (isBlobby || isGeo) {
            $pane.find('.importTypeList a.append').
              addClass('disabled').
              attr('title', 'You cannot append into a ' +
                (isBlobby ? 'blobby' : 'map layer') + ' dataset.');
          }

          // tooltips
          state.selectTypeTips = [];
          $pane.find('.importTypeList > li > a').each(function() {
            var $this = $(this);
            state.selectTypeTips.push($this.socrataTip({
              message: $this.attr('title').clean(),
              shrinkToFit: false,
              killTitle: true
            }));
          });

          // actions
          state.type = isBlobby ? 'blobby' :
            (isGeo ? 'shapefile' : 'blist');
          $pane.find('.importTypeList a.append').click(function(event) {
            event.preventDefault();
            if ($(this).hasClass('disabled')) return;

            state.operation = 'append';
            state.afterUpload = isBlobby ? 'finish' : 'appendReplaceColumns';
            command.next('uploadFile');
          });
          $pane.find('.importTypeList a.replace').click(function(event) {
            event.preventDefault();
            if ($(this).hasClass('disabled')) return;

            state.operation = 'replace';
            state.afterUpload = isBlobby ? 'finish' :
              (isGeo ? 'importShapefile' : 'appendReplaceColumns');
            command.next('uploadFile');
          });

        },
        onActivate: function($pane, config, state) {
          // reactivate tips if we have them
          _.each(state.selectTypeTips || [], function(tip) {
            tip.enable();
          });
        },
        onLeave: function($pane, config, state) {
          _.each(state.selectTypeTips || [], function(tip) {
            tip.hide();
            tip.disable();
          });
        }
      },

      'uploadFile': blist.importer.uploadFilePaneConfig,
      'importShapefile': blist.importer.importShapefilePaneConfig,
      'appendReplaceColumns': blist.importer.appendReplaceColumnsPaneConfig,
      'importing': blist.importer.importingPaneConfig,
      'importWarnings': $.extend({}, blist.importer.importWarningsPaneConfig, {
        disableButtons: ['cancel', 'prev']
      }),

      'finish': {
        disableButtons: ['cancel', 'prev'],
        isFinish: true,
        onNext: function() {
          blist.importer.dataset.redirectTo();
          return false;
        }
      }
    }
  });


})(jQuery);
