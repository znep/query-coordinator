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

function onDefaultSuccess(id, newState, { error, message, success }) {
  if (success) {
    setFlashMessage(message, 'notice');
    updateGeoregion(id, { defaultFlag: newState });
  } else if (error) {
    setFlashMessage(message, 'error');
  }
}

function onEnableSuccess(id, newEnabledState, newDefaultState, { error, message, success }) {
  if (success) {
    setFlashMessage(message, 'notice');
    updateGeoregion(id, { enabledFlag: newEnabledState, defaultFlag: newDefaultState });
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

function addGeoregionJob(jobStatus, boundary) {
  // The response for a single job's status doesn't have the same shape as
  // the batch data we get back from the queue response, so... more massaging.
  const newJob = _.extend(jobStatus, {
    // Properties that mimic metadata from CRJQ
    common: {
      classifier: jobStatus.data.dataset,
      externalId: jobStatus.data.jobId,
      internalId: jobStatus.data.jobId
    },
    dataset: jobStatus.data.dataset,
    // Properties that mimic the payload from georegion_adder.rb
    jobParameters: {
      defaultFlag: false,
      enabledFlag: true,
      geometryLabel: boundary.geometryLabel,
      name: boundary.name,
      type: 'prepare_curated_region'
    }
  });
  georegionsNS.jobs.push(newJob);
  renderPage();
}

function renderTables(georegions, allowDefaulting, defaultCount, defaultLimit) {
  const authenticityToken = $('.georegions-controls-custom [name="authenticity_token"]').value();
  const baseUrlPath = '/admin/geo/';
  const baseTableProps = {
    allowDefaulting,
    authenticityToken,
    baseUrlPath,
    defaultCount,
    defaultLimit
  };

  ReactDOM.render(
    <GeoregionAdminTable
      onDefaultSuccess={onDefaultSuccess}
      onEdit={showConfigureModal}
      onEnableSuccess={onEnableSuccess}
      rows={georegions}
      {...baseTableProps} />,
    $('.georegions-custom .gridListWrapper').get(0)
  );
}

function renderPageSubtitle(defaultCount, availableCount) {
  const pageSubtitle = t('page_subtitle', {
    default_count: String(defaultCount),
    available_count: String(availableCount)
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
  // For failed/queued/processing jobs, copy job parameters out of nested objects,
  // making the job have a shape more similar to a completed region
  const decorateJob = (job, metadataObject) => {
    _.each(metadataObject.jobParameters, (paramValue, paramKey) => {
      // Odd quirk: if this function isn't wrapped in curly braces,
      // not all properties will be copied over!
      job[paramKey] = paramValue;
    });
    job.id = metadataObject.common.externalId;
    return job;
  };
  const georegionJobs = _.map(
    georegionsNS.jobs,
    (job) => decorateJob(job, job)
  );
  const georegionFailedJobs = _.map(
    georegionsNS.failedJobs,
    (job) => decorateJob(job, job.latest_event.info)
  );

  const georegions = georegionsNS.georegions.concat(georegionJobs, georegionFailedJobs);
  const defaultBoundaries = _.filter(georegions, 'defaultFlag');
  const allowDefaulting = defaultBoundaries.length < georegionsNS.maximumDefaultCount;
  const defaultCount = defaultBoundaries.length;
  const defaultLimit = georegionsNS.maximumDefaultCount;

  renderTables(georegions, allowDefaulting, defaultCount, defaultLimit);
  renderPageSubtitle(defaultCount, defaultLimit);
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

  // TODO: Remove enableSyntheticSpatialLensId once we're using
  // synthetic spatial lens shape ids exclusively
  const enableSyntheticSpatialLensId = blist.feature_flags.enable_synthetic_spatial_lens_id;

  const onSave = (boundary, completeCallback, errorCallback) => {
    const onSuccess = ({ error, message, success }) => {
      if (success) {
        if (enableSyntheticSpatialLensId) {
          addGeoregionJob(message, boundary);
        } else {
          addGeoregion(message);
        }

        setFlashMessage(t('configure_boundary.save_success'), 'notice');
        closeConfigureModal();
      } else if (error) {
        errorCallback(t('configure_boundary.save_core_error', {error_message: message}));
      }
    };

    // TODO: Remove query parameter in url once we're using synthetic
    // spatial lens shape ids exclusively. We're passing it along here
    // to make it respect query parameter feature flags in the ajax request.
    const url = enableSyntheticSpatialLensId ?
      '/admin/geo?enable_synthetic_spatial_lens_id=true' :
      '/admin/geo';

    $.ajax({
      contentType: 'application/json',
      url: url,
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

  // TODO: Remove allowPrimaryKeySelection option once we're using
  // synthetic spatial lens shape ids exclusively
  const enablePrimaryKeySelection = !enableSyntheticSpatialLensId;
  const requiredFields = ['name', 'geometryLabel'];

  if (enablePrimaryKeySelection) {
    requiredFields.push('primaryKey');
  }

  ReactDOM.render(
    <ConfigureBoundaryForm
      allowPrimaryKeySelection={enablePrimaryKeySelection}
      fetchInitialState={fetchInitialState}
      id={uid}
      onCancel={onBack}
      onSave={onSave}
      requiredFields={requiredFields}
      shouldConfirm
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

  // Set default region code column flyout
  const flyoutTarget = $('.georegions-table .icon-info');
  flyoutTarget.socrataTip({
    content: t('default_georegions_flyout'),
    width: '300px'
  });
});
