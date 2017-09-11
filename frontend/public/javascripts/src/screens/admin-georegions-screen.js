import ConfigureBoundaryForm from '../components/georegions/configure-boundary-form';
import GeoregionAdminTable from '../components/georegions/georegion-admin-table';
import FlashMessage from '../components/flash-message';
import React from 'react';
import ReactDOM from 'react-dom';

const commonNS = blist.namespace.fetch('blist.common');
const georegionsNS = blist.namespace.fetch('blist.georegions');

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

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

function normalizeGeoregions() {
  // For failed/queued/processing jobs, copy job parameters out of nested objects,
  // making the job have a shape more similar to a completed region
  const decorateJob = (job, metadataObject) => {
    _.each(metadataObject.jobParameters, (paramValue, paramKey) => {
      // Do not inline this assignment; without curly braces,
      // ES6 will inject implicit return, which can exit _.each prematurely.
      job[paramKey] = paramValue;
    });
    job.id = metadataObject.common.externalId;
    return job;
  };

  const georegions = _.sortByOrder(georegionsNS.georegions, ['dateAdded'], [false]);
  const jobs = _.map(georegionsNS.jobs, (job) => decorateJob(job, job));
  const failedJobs = _.map(georegionsNS.failedJobs, (job) => decorateJob(job, job.latest_event.info));

  return [].concat(jobs, georegions, failedJobs);
}

function pollGeoregions(timeout) {
  georegionsNS.poller = setTimeout(updateAllGeoregions, timeout, timeout);
}

function updateAllGeoregions(timeout) {
  // The backoff timings were calibrated against a local dev environment
  // such that results for small boundaries (or failures that occurred early)
  // were reported after 1 polling call, while results for larger boundaries
  // (including late-stage failures) were usually reported after 3-4 polls.
  const nextPollInterval = Math.min(
    (1.25 * timeout) + (2 * 1000),
    60 * 1000
  );

  $.ajax({
    url: '/admin/geo/poll',
    type: 'post',
    dataType: 'json',
    success: ({ message, success }) => {
      if (success) {
        const { georegions, jobs, failedJobs } = message;
        georegionsNS.georegions = georegions;
        georegionsNS.jobs = jobs;
        georegionsNS.failedJobs = failedJobs;

        if (georegionsNS.jobs.length > 0) {
          pollGeoregions(nextPollInterval);
        }

        renderPage();
      } else if (message.errorMessage) {
        console.error(message.errorMessage);
      }
    }
  });
}

function updateGeoregion(id, newValue) {
  georegionsNS.georegions = _.map(
    georegionsNS.georegions,
    (georegion) => (georegion.id === id) ? _.extend({}, georegion, newValue) : georegion
  );
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
  georegionsNS.jobs.unshift(newJob);

  // Wait a few seconds before starting to poll — jobs don't finish instantly.
  // See note on timings above.
  const initialPollInterval = 8 * 1000;
  const pollingDelay = 2 * 1000;
  clearTimeout(georegionsNS.poller);
  setTimeout(pollGeoregions, pollingDelay, initialPollInterval);

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
  const georegions = normalizeGeoregions();
  const defaultNonFailedBoundaries = _.filter(georegions, (gr) => {
    return gr.defaultFlag && gr.enabledFlag && gr.status !== 'Failure';
  });
  const allowDefaulting = defaultNonFailedBoundaries.length < georegionsNS.maximumDefaultCount;
  const defaultCount = defaultNonFailedBoundaries.length;
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
          successCallback(_.extend(message, {isConfigured: true}));
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
      title={t('configure_boundary.configure_boundary')} />,
    $reactModal.get(0)
  );
  $reactModal.jqmShow();
}

function closeConfigureModal() {
  const $reactModal = $('#react-modal');
  ReactDOM.unmountComponentAtNode($reactModal.get(0));
  $reactModal.jqmHide();
}

function showInitialConfigureModal(uid, name) {
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
          successCallback(_.extend(message, {name}));
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
        addGeoregionJob(message, boundary);
        setFlashMessage(t('configure_boundary.save_success'), 'notice');
        closeConfigureModal();
      } else if (error) {
        errorCallback(t('configure_boundary.save_core_error', {error_message: message}));
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

  const requiredFields = ['name', 'geometryLabel'];

  ReactDOM.render(
    <ConfigureBoundaryForm
      fetchInitialState={fetchInitialState}
      id={uid}
      onCancel={onBack}
      onSave={onSave}
      requiredFields={requiredFields}
      shouldConfirm
      title={t('configure_boundary.configure_boundary')} />,
    $reactModal.get(0)
  );
  $reactModal.jqmShow();
}

// end function definitions; begin immediately executed code

georegionsNS.renderPage = renderPage;
georegionsNS.clearFlashMessage = clearFlashMessage;
georegionsNS.flash = georegionsNS.flash || [];

commonNS.georegionSelected = (layerId, datasetName) => {
  $('#selectDataset').jqmHide();
  showInitialConfigureModal(layerId, datasetName);
};

$(() => {
  georegionsNS.renderPage();

  if (georegionsNS.jobs.length > 0) {
    pollGeoregions(4 * 1000);
  }

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
