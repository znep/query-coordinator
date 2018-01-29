import PropTypes from 'prop-types';

// This is essentially the shape of what `withComputedMeasure` returns
export default PropTypes.shape({
  // Represents a single result of a metric calculation for the most recent reporting period
  result: PropTypes.shape({

    // The actual value from a metric calculation
    value: PropTypes.string,

    // (Rate measures only) - result of a count or sum
    numerator: PropTypes.string,

    // (Rate measures only) - result of a count or sum OR a direct input
    denominator: PropTypes.string
  }),

  // Represents results for all date ranges within a reporting period
  // eg: [ ['2002-12-01T00:00:00.000', "42"], [], ... ]
  series: PropTypes.arrayOf(
    // [ <datetime>, <value> ]
    PropTypes.arrayOf(PropTypes.string)
  ),

  // Represents any metric configuration or calculation errors
  errors: PropTypes.shape({

    // Indicates an insufficiently-specified calculation, which varies by calculation type
    calculationNotConfigured: PropTypes.bool,

    // Indicates that no valid dataset has been set in the Data Source panel
    dataSourceNotConfigured: PropTypes.bool,

    // (Rate measures only)
    dividingByZero: PropTypes.bool,

    // Indicates that no reporting period is usable (this can happen if the start date is in the future,
    // or we're using closed reporting periods and no period has closed yet).
    noReportingPeriodAvailable: PropTypes.bool,

    // Indicates that no reporting period was set by the user
    noReportingPeriodConfigured: PropTypes.bool
  }).isRequired
});
