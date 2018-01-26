(function($) {
  $.Control.extend('pane_datasetPermissions', {
    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.permissions.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.permissions.subtitle', {
        view_type: this._view.displayName
      });
    },

    isAvailable: function() {
      return this._view.valid &&
        (!this._view.temporary || this._view.minorChange);
    },

    getDisabledSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.permissions.validation.valid_saved');
    },

    _getSections: function() {
      var cpObj = this;
      return [{
        customContent: {
          template: 'datasetPermissions',
          data: {},
          directive: {},
          callback: function($formElem) {
            // If the publicness is inherited from the parent dataset,
            // they can't make it private
            var publicGrant = _.detect(
              cpObj._view.grants || [], function(grant) {
                return _.include(grant.flags || [], 'public');
              }
            );
            var $publicText = $formElem.find('.datasetPublicText');
            var $toggleForm = $formElem.find('.togglePermissionsForm');
            var $toggleRadios = $toggleForm.find('.toggleDatasetPermissions');

            $publicText.text(
              cpObj._view.isPublic() ?
                $.t('core.visibility.public').capitalize() :
                $.t('core.visibility.private').capitalize()
            );

            $formElem.find('.datasetTypeName').text(this._view.displayName);
            $formElem.find('.datasetTypeNameUpcase').text(this._view.displayName.capitalize());

            // Only owned, parent-public datasets can be toggled
            if (cpObj._view.hasRight(blist.rights.view.UPDATE_VIEW) &&
              ($.isBlank(publicGrant) || (publicGrant.inherited || false) == false)) {
              $toggleRadios.change(function(event) {
                var $radio = $(event.target);
                cpObj._view[$radio.val()](function() {
                    $publicText.text(
                      cpObj._view.isPublic() ?
                        $.t('core.visibility.public').capitalize() :
                        $.t('core.visibility.private').capitalize()
                    );
                    $radio.socrataAlert({
                      message: $.t('screens.ds.grid_sidebar.permissions.success'),
                      overlay: true
                    });
                  },
                  function() {
                    cpObj.$dom().find('.sharingFlash').addClass('error').
                      text($.t('screens.ds.grid_sidebar.permissions.error'));
                  });
              });

              _.defer(function() {
                $toggleRadios.uniform();
              });

              var pendingApproval = _.get(blist, 'dataset.approvals.0.outcome') === 'publicize' && cpObj._view.isPublic();

              if (pendingApproval) {
                $publicText.html($.t('core.visibility.awaiting_approval_html'));
                var $sectionContent = $(cpObj.currentDom).find('.sectionContent.togglePermissionsForm');
                var $withdrawApprovalRequestButton = $(
                  '<a href="#" class="button" id="withdraw_approval_request">' +
                    $.t('screens.ds.grid_sidebar.permissions.withdraw_approval_request') +
                  '</a>'
                );

                $withdrawApprovalRequestButton.on('click', function() {
                  cpObj._view.makePrivate(
                    function() { location.reload(); },
                    function() {
                      cpObj.$dom().find('.sharingFlash').addClass('error').
                        text($.t('screens.ds.grid_sidebar.permissions.error'));
                    });
                  cpObj._finish();
                });

                $sectionContent.find('.line').hide(); // Hide radio buttons
                cpObj.$dom().find('.finishButtons li a.submit').hide(); // Hide update/submit button
                $sectionContent.append($withdrawApprovalRequestButton);
              }
            } else {
              $toggleForm.hide();
            }
          }
        }
      }];
    },

    shown: function() {
      this._super();
      this.$dom().find('.flash').removeClass('error').text('');
    },

    _getFinishButtons: function() {
      return [$.controlPane.buttons.update, $.controlPane.buttons.cancel];
    },

    _finish: function(data, value, finalCallback) {
      var cpObj = this;
      if (!cpObj._super.apply(this, arguments)) {
        return;
      }

      var formValues = cpObj._getFormValues();
      cpObj._view.disabledFeatureFlags = _.reject(_.keys(formValues),
        function(key) {
          return formValues[key];
        });

      cpObj._view.save(function() {
          cpObj._finishProcessing();
          cpObj._showMessage($.t('screens.ds.grid_sidebar.permissions.success'));
          cpObj._hide();
          if (_.isFunction(finalCallback)) {
            finalCallback();
          }
          location.reload();
        },
        function() {
          cpObj.find$('.sharingFlash').addClass('error').
            text($.t('screens.ds.grid_sidebar.permissions.error'));
        });
    }
  }, {
    name: 'datasetPermissions',
    noReset: true,
    showFinishButtons: true
  }, 'controlPane');

  if (blist.sidebarHidden && ($.isBlank(blist.sidebarHidden.manage) || !blist.sidebarHidden.manage.permissions)) {
    $.gridSidebar.registerConfig('manage.datasetPermissions', 'pane_datasetPermissions', 7);
  }

})(jQuery);
