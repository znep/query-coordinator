/* global prettyConfirm */
/* eslint-disable no-alert */

import { timeControl } from '../lib/admin-time-control';

export function replaceTimestamps($parent) {
  $parent.find('.started-time').each((i, el) => {
    const $el = $(el);
    const timestamp = moment.unix($el.data('epoch-seconds'));
    $el.text(timestamp.format('HH:mm:ss'));
    $el.siblings('.started-time-relative-day').text(todayYesterdayOrDate(timestamp));
  });
}

export function todayYesterdayOrDate(timestamp) {
  const startOfToday = moment().startOf('day');
  const startOfYesterday = startOfToday.clone().subtract(1, 'days');
  if (timestamp.isAfter(startOfToday)) {
    return _.capitalize($.t('core.date_time.current_day_past'));
  } else if (timestamp.isAfter(startOfYesterday)) {
    return _.capitalize($.t('core.date_time.single_day_past'));
  }
  return timestamp.format('M/D/YYYY');
}

/** @return {Object} Initial range from URL params; undefined if no URL param */
function dateRangeFromParams() {
  const rangeParams = $.urlParam(window.location.href, 'date_range');
  if (!rangeParams) {
    return {};
  }

  const range = _.map(
    unescape(rangeParams).split('+-+'),
    (date) => Date.parse(date)
  );

  return {
    dateStart: () => _.first(range),
    dateEnd: () => _.last(range)
  };
}

function confirmDatasetRestore(source) {
  const datasetName = source.dataset.datasetName;
  const datasetId = source.dataset.datasetId;

  if (!(datasetName || datasetId)) {
    console.error(`ERROR: Couldn't find dataset name and/or dataset id when clicking restore button (got name: ${datasetName} and id: ${datasetId})`);
    alert('Failed to restore dataset!');
    return;
  }

  prettyConfirm($.t('screens.admin.jobs.index_page.restore_deleted_dataset.confirm', { dataset: datasetName }),
    () =>
    $.ajax({
      url: `/views/${datasetId}.json?method=restore`,
      type: 'PATCH'
    }).
    done(() => location.reload()).
    fail(() => alert('Failed to restore dataset!'))
  );
}

$(() => {
  replaceTimestamps($(document.body));

  const $timecontrol = $('#time-control-input');

  const DEFAULT_DATE_RANGES = [
    // Today
    {
      text: $.t('plugins.daterangepicker.today'),
      previousText: $.t('plugins.daterangepicker.yesterday'),
      dateStart: () => Date.today(),
      dateEnd: () => Date.today(),
      datePrevious: Date.parse('yesterday'),
      enabled: true
    },

    // Last 3 Days
    {
      text: $.t('plugins.daterangepicker.last_3_days'),
      previousText: $.t('plugins.daterangepicker.last_3_days'),
      dateStart: () => Date.today().addDays(-2),
      dateEnd: () => Date.today(),
      enabled: true
    },

    // Last Week
    {
      text: $.t('plugins.daterangepicker.last_week'),
      previousText: $.t('plugins.daterangepicker.preceding_week'),
      dateStart: () => Date.today().addDays(-7),
      dateEnd: () => Date.today(),
      datePrevious: () => Date.today().addDays(-14),
      enabled: true
    }
  ];

  timeControl(
    $timecontrol,
    DEFAULT_DATE_RANGES,
    dateRangeFromParams(),
    true
  );

  // blank out the input field if we don't have URL params for the date,
  // since the daterangepicker on this page is ancient and defaults to
  // today's date no matter what
  if (!$.urlParam(window.location.href, 'date_range')) {
    $timecontrol.val('');
  }

  $('.restore-dataset').click((event) => confirmDatasetRestore(event.srcElement));
  $('.button.restore-dataset.not-restorable-type:disabled').parent().socrataTip({message: $.t('screens.admin.jobs.index_page.restore_deleted_dataset.disabled_restore_type')});
  $('.button.restore-dataset.not-restorable-time:disabled').parent().socrataTip({message: $.t('screens.admin.jobs.index_page.restore_deleted_dataset.disabled_restore_time')});
});
