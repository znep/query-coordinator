import ConfigureBoundaryForm from '../components/georegions/configure-boundary-form';
import GeoregionAdminTable from '../components/georegions/georegion-admin-table';
import FlashMessage from '../components/flash-message';
import React from 'react';
import ReactDOM from 'react-dom';

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

const georegionsNS = blist.namespace.fetch('blist.georegions');
georegionsNS.flash = georegionsNS.flash || {};

function onEnableSuccess(id, newState, { error, message, success }) {
  if (success) {
    setFlashMessage(message, 'notice');
    updateGeoregion(id, { enabledFlag: newState });
  } else if (error) {
    setFlashMessage(message, 'error');
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
  georegionsNS.georegions = _.map(
    georegionsNS.georegions,
    (georegion) => (georegion.id === id) ? _.extend({}, georegion, newValue) : georegion
  );
  renderPage();
}

function addGeoregion(newValue) {
  georegionsNS.georegions.push(newValue);
  renderPage();
}

function renderTables(georegions, allowEnablement) {
  const authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
  const baseUrlPath = '/admin/geo/';
  const customBoundaries = georegions;
  const baseTableProps = {
    allowEnablement,
    authenticityToken,
    baseUrlPath
  };

  ReactDOM.render(
    <GeoregionAdminTable
      onEdit={showConfigureModal}
      onEnableSuccess={onEnableSuccess}
      rows={customBoundaries}
      {...baseTableProps} />,
    $('.georegions-custom .gridListWrapper').get(0)
  );
}

function renderPageSubtitle(enabledCount, availableCount) {
  const pageSubtitle = t('page_subtitle', {
    'enabled_count': String(enabledCount),
    'available_count': String(availableCount)
  });

  ReactDOM.render(
    <span>{pageSubtitle}</span>,
    $('#georegions-page-subtitle').get(0)
  );
}

function renderFlashMessage(messages) {
  ReactDOM.render(
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
  const $reactModal = $('#react-modal');
  clearFlashMessage();

  const fetchInitialState = (completeCallback, successCallback, errorCallback) => {
    $.ajax({
      url: `/admin/geo/${id}`,
      type: 'get',
      dataType: 'json',
      complete: completeCallback,
      success: ({ error, message, success }) => {
        if (success) {
          successCallback(message);
        } else if (error) {
          errorCallback(message);
        }
      }
    });
  };

  const onSave = (boundary, completeCallback, successCallback, errorCallback) => {
    const onSuccess = ({ error, message, success }) => {
      if (success) {
        updateGeoregion(id, message);
        setFlashMessage(t('configure_boundary.save_success'), 'notice');
        closeConfigureModal();
      }
      if (error) {
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
      success: onSuccess,
      error: () => errorCallback(t('configure_boundary.save_error'))
    });
  };

  ReactDOM.render(
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
  const $reactModal = $('#react-modal');
  ReactDOM.unmountComponentAtNode($reactModal.get(0));
  $reactModal.jqmHide();
}

function showInitialConfigureModal(uid) {
  const $reactModal = $('#react-modal');
  georegionsNS.clearFlashMessage();

  const fetchInitialState = (completeCallback, successCallback, errorCallback) => {
    $.ajax({
      url: `/admin/geo/candidate/${uid}`,
      type: 'get',
      dataType: 'json',
      complete: completeCallback,
      success: ({ error, message, success }) => {
        if (success) {
          successCallback(message);
        } else if (error) {
          errorCallback(message);
        }
      },
      error: () => errorCallback(t('configure_boundary.save_error'))
    });
  };

  const onSave = (boundary, completeCallback, errorCallback) => {
    const onSuccess = ({ error, message, success }) => {
      if (success) {
        addGeoregion(message);
        setFlashMessage(t('configure_boundary.save_success'), 'notice');
        closeConfigureModal();
      } else if (error) {
        errorCallback(t('configure_boundary.save_core_error', {'error_message': message}));
      }
    };

    $.ajax({
      contentType: 'application/json',
      url: '/admin/geo',
      type: 'post',
      data: JSON.stringify(_.extend({ id: uid }, boundary)),
      dataType: 'json',
      complete: completeCallback,
      success: onSuccess,
      error: () => errorCallback(t('configure_boundary.save_error'))
    });
  };

  const onBack = () => {
    closeConfigureModal();
    $('#selectDataset').jqmShow();
  };

  ReactDOM.render(
    <ConfigureBoundaryForm
      allowPrimaryKeySelection
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

const commonNS = blist.namespace.fetch('blist.common');

commonNS.georegionSelected = (datasetId) => {
  $('#selectDataset').jqmHide();
  showInitialConfigureModal(datasetId);
};

$(() => {
  const georegionsNamespace = blist.namespace.fetch('blist.georegions');

  georegionsNamespace.renderPage();

  $('[data-action="add"]').click((event) => {
    event.preventDefault();

    if (!$(event.target).hasClass('disabled')) {
      $('#selectDataset').jqmShow();
    }
  });
});
