/**
 * Turns an input box into a date range picker
 * @param {jQuery object} input - jQuery-wrapped input to turn into date range picker
 * @param {Object[]} ranges - Array of date-range objects to use for selecting default ranges
 * @param {Object} initialRange - Initial range to put into input; null is allowed and input will default to "today"
 */
export function timeControl(input, ranges, initialRange) {
  const today = Date.parse('today');

  const options = {
    earliestDate: Date.parse('2008-01-01'),
    latestDate: today,
    posY: input.offset().top + input.outerHeight() + 5,
    rangeSplitter: '-',
    presetRanges: ranges,
    presets: {
      specificDate: t('the_day_of'),
      dateRange: t('date_range')
    },
    rangeStartTitle: t('start_date'),
    rangeEndTitle: t('end_date'),
    nextLinkText: t('next'),
    prevLinkText: t('prev'),
    doneButtonText: t('done')
  };

  // set this conditionally because it blows up if you set it to undefined or null
  if (initialRange) {
    options.initialRange = initialRange;
  }

  input.daterangepicker(options);
}

function t(str) { return $.t(`plugins.daterangepicker.${str}`); }
