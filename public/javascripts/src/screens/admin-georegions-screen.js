var t = function(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
};

(function() {
  const PropTypes = React.PropTypes;
  const {
    FlashMessage,
  } = blist.namespace.fetch('blist.components');
  let georegionsComponentsNS = blist.namespace.fetch('blist.georegions.components');
  let georegionsNS = blist.namespace.fetch('blist.georegions');
  const {
    ConfigureBoundaryForm,
    GeoregionAdminTable
  } = georegionsComponentsNS;
  georegionsNS.flash = georegionsNS.flash || {};

  function onEnableSuccess(id, newState, response) {
    if (response.success) {
      setFlashMessage(response.message, 'notice');
      updateGeoregion(id, { enabledFlag: newState });
    }
    else if (response.error) {
      setFlashMessage(response.message, 'error');
    }
  }

  function setFlashMessage(message, type) {
    georegionsNS.flash = [{ message, type }];
    renderPage();
  }

  function clearFlashMessage() {
    georegionsNS.flash = [];
    renderPage();
  }

  function updateGeoregion(id, newValue) {
    georegionsNS.georegions = _.map(georegionsNS.georegions, function(georegion) {
      if (georegion.id === id) {
        return _.extend({}, georegion, newValue);
      } else {
        return georegion;
      }
    });
    renderPage();
  }

  function addGeoregion(newValue) {
    georegionsNS.georegions.push(newValue);
    renderPage();
  }

  function renderTables(georegions, allowEnablement) {
    const authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
    const baseUrlPath = '/admin/geo/';
    const [defaultBoundaries, customBoundaries] = _.partition(georegions, 'defaultFlag');
    const baseTableProps = {
      allowEnablement,
      authenticityToken,
      baseUrlPath
    };

    React.render(
      <GeoregionAdminTable
        onEdit={showConfigureModal}
        onEnableSuccess={onEnableSuccess}
        rows={customBoundaries}
        {...baseTableProps} />,
      $('.georegions-custom .gridListWrapper').get(0)
    );

    React.render(
      <GeoregionAdminTable
        onEnableSuccess={onEnableSuccess}
        renderActions={false}
        rows={defaultBoundaries}
        {...baseTableProps} />,
      $('.georegions-default .gridListWrapper').get(0)
    );
  }

  function renderPageSubtitle(enabledCount, availableCount) {
    const pageSubtitle = t('page_subtitle', {
      enabled_count: String(enabledCount),
      available_count: String(availableCount)
    });

    React.render(
      <span>{pageSubtitle}</span>,
      $('#georegions-page-subtitle').get(0)
    );
  }

  function renderFlashMessage(messages) {
    React.render(
      <FlashMessage messages={messages} />,
      $('#flash-container').get(0)
    );
  }

  function renderPage() {
    const georegions = georegionsNS.georegions;
    const enabledBoundaries = _.filter(georegions, 'enabledFlag');
    const allowEnablement = enabledBoundaries.length < georegionsNS.maximumEnabledCount;

    renderTables(georegions, allowEnablement);
    renderPageSubtitle(enabledBoundaries.length, georegionsNS.maximumEnabledCount);
    renderFlashMessage(georegionsNS.flash);
  }

  function showConfigureModal(id) {
    let $reactModal = $('#react-modal');
    clearFlashMessage();

    const fetchInitialState = (completeCallback, successCallback) => {
      $.ajax({
        url: `/admin/geo/${id}`,
        type: 'get',
        dataType: 'json',
        complete: completeCallback,
        success: (response) => {
          const { error, message, success } = response;
          if (success) {
            successCallback(message);
          }
          if (error) {
            errorCallback(message);
          }
        }
      });
    };

    const onSave = (boundary, completeCallback, successCallback, errorCallback) => {
      const success = (response) => {
        if (response.success) {
          updateGeoregion(id, response.message);
          setFlashMessage(t('configure_boundary.save_success'), 'notice');
          closeConfigureModal();
        }
        if (response.error) {
          errorCallback(t('configure_boundary.save_error'));
        }
      };

      $.ajax({
        contentType: 'application/json',
        url: `/admin/geo/${id}`,
        type: 'put',
        data: JSON.stringify({ boundary }),
        dataType: 'json',
        complete: completeCallback,
        success: success,
        error: () => errorCallback(t('configure_boundary.save_error'))
      });
    };

    React.render(
      <ConfigureBoundaryForm
        fetchInitialState={fetchInitialState}
        id={id}
        onCancel={closeConfigureModal}
        onSave={onSave}
        requiredFields={['name', 'geometryLabel']}
        title={t('configure_boundary.configure_boundary')}
        />,
      $reactModal.get(0)
    );
    $reactModal.jqmShow();
  }

  function closeConfigureModal() {
    let $reactModal = $('#react-modal');
    React.unmountComponentAtNode($reactModal.get(0));
    $reactModal.jqmHide();
  }

  function showInitialConfigureModal(uid) {
    let $reactModal = $('#react-modal');
    georegionsNS.clearFlashMessage();

    const fetchInitialState = (completeCallback, successCallback, errorCallback) => {
      $.ajax({
        url: `/admin/geo/candidate/${uid}`,
        type: 'get',
        dataType: 'json',
        complete: completeCallback,
        success: (response) => {
          const { error, message, success } = response;
          if (success) {
            successCallback(message);
          }
          if (error) {
            errorCallback(message);
          }
        },
        error: () => errorCallback(t('configure_boundary.save_error'))
      });
    };

    const onSave = (boundary, completeCallback, errorCallback) => {
      const success = (response) => {
        if (response.success) {
          addGeoregion(response.message);
          setFlashMessage(t('configure_boundary.save_success'), 'notice');
          closeConfigureModal();
        }
        if (response.error) {
          errorCallback(t('configure_boundary.save_core_error', {error_message: response.message}));
        }
      };

      $.ajax({
        contentType: 'application/json',
        url: `/admin/geo`,
        type: 'post',
        data: JSON.stringify(_.extend({ id: uid }, boundary)),
        dataType: 'json',
        complete: completeCallback,
        success: success,
        error: () => errorCallback(t('configure_boundary.save_error'))
      });
    };

    const onBack = () => {
      closeConfigureModal();
      $('#selectDataset').jqmShow();
    };

    React.render(
      <ConfigureBoundaryForm
        allowPrimaryKeySelection={true}
        cancelLabel={$.t('core.dialogs.back')}
        fetchInitialState={fetchInitialState}
        id={uid}
        onCancel={onBack}
        onSave={onSave}
        requiredFields={['name', 'geometryLabel', 'primaryKey']}
        saveLabel={$.t('core.dialogs.create')}
        title={t('configure_boundary.configure_boundary')}
        />,
      $reactModal.get(0)
    );
    $reactModal.jqmShow();
  }

  georegionsNS.renderPage = renderPage;
  georegionsNS.clearFlashMessage = clearFlashMessage;

  var commonNS = blist.namespace.fetch('blist.common');

  commonNS.georegionSelected = function(datasetId) {
    $('#selectDataset').jqmHide();
    showInitialConfigureModal(datasetId);
  };

})();

$(function() {
  var georegionsNS = blist.namespace.fetch('blist.georegions');

  georegionsNS.renderPage();

  $('[data-action="add"]').click(function(event) {
    event.preventDefault();

    if ($(this).hasClass('disabled')) {
      return;
    }

    $('#selectDataset').jqmShow();
  });
});
