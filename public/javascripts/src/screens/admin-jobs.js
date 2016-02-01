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

$(() => {
  replaceTimestamps($(document.body));
});
