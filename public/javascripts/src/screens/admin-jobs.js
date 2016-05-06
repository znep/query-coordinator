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

$(() => {
  replaceTimestamps($(document.body));

  const $timecontrol = $('#time-control-input');

  if ($timecontrol.length > 0) {
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
        dateStart: () => Date.today().addDays(-3),
        dateEnd: () => Date.parse('yesterday'),
        enabled: true
      },

      // Last Week
      {
        text: $.t('plugins.daterangepicker.last_week'),
        previousText: $.t('plugins.daterangepicker.preceding_week'),
        dateStart: () => Date.parse('1 week ago').moveToDayOfWeek(0, -1),
        dateEnd: () => Date.parse('1 week ago').moveToDayOfWeek(6, 1),
        datePrevious: () => Date.parse('2 weeks ago').moveToDayOfWeek(0, -1),
        enabled: true
      }
    ];

    timeControl(
      $timecontrol,
      DEFAULT_DATE_RANGES,
      dateRangeFromParams()
    );

    // blank out the input field if we don't have URL params for the date,
    // since the daterangepicker on this page is ancient and defaults to
    // today's date no matter what
    if (!$.urlParam(window.location.href, 'date_range')) {
      $timecontrol.val('');
    }
  }
});
