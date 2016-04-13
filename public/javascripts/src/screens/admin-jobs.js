import { timeControl } from "./admin-time-control";

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
export function dateRangeFromParams() {
  let paramValues = {};
  
  // check for date range in param values
  const fromUrl = $.urlParam(window.location.href, 'date_range');
  if (fromUrl) {
    const split = unescape(fromUrl).split('+-+');
    paramValues.start = Date.parse(split[0].replace(/\+/g, ' '));

    if (split.length >= 2) {
      paramValues.end = Date.parse(split[1].replace(/\+/g, ' '));
    }
  }

  // create range from url params
  let range = undefined;
  if (paramValues.start || paramValues.end) {
    range = {
      dateStart: () => paramValues.start || paramValues.end,
      dateEnd: () => paramValues.end || paramValues.start
    };
  }
  
  return range;
}

/** @return {Object[]} Array of date ranges to use with date range picker */
export function getDateRanges() {
  const last3DaysRange = {
    text: $.t('plugins.daterangepicker.last_3_days'),
    previousText: $.t('plugins.daterangepicker.last_3_days'),
    dateStart: () => Date.today().addDays(-3),
    dateEnd: () => Date.parse('yesterday'),
    enabled: true
  };

  const todayRange = {
    text: $.t('plugins.daterangepicker.today'),
    previousText: $.t('plugins.daterangepicker.yesterday'),
    dateStart: () => Date.today(),
    dateEnd: () => Date.today(),
    datePrevious: Date.parse('yesterday'),
    enabled: true
  };

  const lastWeekRange = {
    text: $.t('plugins.daterangepicker.last_week'),
    previousText: $.t('plugins.daterangepicker.preceding_week'),
    dateStart: () => Date.parse('1 week ago').moveToDayOfWeek(0, -1),
    dateEnd: () => Date.parse('1 week ago').moveToDayOfWeek(6, 1),
    datePrevious: () => Date.parse('2 weeks ago').moveToDayOfWeek(0, -1),
    enabled: true
  }
  
  return [ todayRange, last3DaysRange, lastWeekRange ];
}

$(() => {
  replaceTimestamps($(document.body));

  var $timecontrol = $('#time-control-input');
  
  timeControl(
    $timecontrol,
    getDateRanges(),
    dateRangeFromParams()
  );

  // blank out the input field if we don't have URL params for the date, 
  // since the daterangepicker on this page is ancient and defaults to 
  // today's date no matter what 
  if (!$.urlParam(window.location.href, 'date_range')) {
    $timecontrol.val('');
  }
});
