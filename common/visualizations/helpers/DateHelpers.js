import moment from 'moment';

export function serializeFloatingTimestamp(date) {
  function formatToTwoPlaces(value) {
    return (value < 10) ?
      '0' + value.toString() :
      value.toString();
  }

  // The month component of JavaScript dates is 0-indexed
  // (I have no idea why) so when we are serializing a
  // JavaScript date as ISO-8601 date we need to increment
  // the month value.
  return `${date.getFullYear()}-${formatToTwoPlaces(date.getMonth() + 1)}-${formatToTwoPlaces(date.getDate())}T${formatToTwoPlaces(date.getHours())}:${formatToTwoPlaces(date.getMinutes())}:${formatToTwoPlaces(date.getSeconds())}`;
}

export function deserializeFloatingTimestamp(timestamp) {
  if (timestamp.length < 19 || isNaN(new Date(timestamp).getTime())) {
    throw new Error(
      `Could not parse floating timestamp: "${timestamp}" is not a valid ISO-8601 date.`
    );
  }

  // The month component of JavaScript dates is 0-indexed
  // (I have no idea why) so when we are deserializing a
  // properly-formatted ISO-8601 date we need to decrement
  // the month value.
  // 2017-07-07T21:39:13.910
  // 01234567890123456789013
  // 00000000001111111111222
  return new Date(
    timestamp.substring(0, 4),     // Year
    timestamp.substring(5, 7) - 1, // Month
    timestamp.substring(8, 10),    // Date
    timestamp.substring(11, 13),   // Hours
    timestamp.substring(14, 16),   // Minutes
    timestamp.substring(17, 19)    // Seconds
  );
}

export function decrementDateByHalfInterval(date, interval) {

  var newDate;

  switch (interval.toUpperCase()) {
    case 'DECADE':
      newDate = moment(date).subtract(5, 'year').toDate();
      break;
    case 'YEAR':
      newDate = moment(date).subtract(6, 'month').toDate();
      break;
    case 'MONTH':
      newDate = moment(date).subtract(15, 'day').toDate();
      break;
    case 'DAY':
      newDate = moment(date).subtract(12, 'hour').toDate();
      break;
    default:
      throw new Error(
        `Cannot decrement date by dataset precision: invalid interval "${interval}"`
      );
  }

  return newDate;

}

export function incrementDateByHalfInterval(date, interval) {

  var newDate;

  switch (interval.toUpperCase()) {
    case 'DECADE':
      newDate = moment(date).add(5, 'year').toDate();
      break;
    case 'YEAR':
      newDate = moment(date).add(6, 'month').toDate();
      break;
    case 'MONTH':
      newDate = moment(date).add(15, 'day').toDate();
      break;
    case 'DAY':
      newDate = moment(date).add(12, 'hour').toDate();
      break;
    default:
      throw new Error(
        `Cannot increment date by dataset precision: invalid interval "${interval}"`
      );
  }

  return newDate;

}

// Snaps an arbitrary date X to the start date of X's containing date
// bin, defined by bin interval (DECADE/YEAR/MONTH/DAY) in the local timezone.
//
// Example: Given indicated interval, Feb 10 1988 04:00:00 GMT-0800 (PST) would map to:
// DAY => Feb 10 1988 00:00:00 GMT-0800 (PST)
// MONTH => Feb 01 1988 00:00:00 GMT-0800 (PST)
// YEAR => Jan 01 1988 00:00:00 GMT-0800 (PST)
// DECADE => Jan 01 1980 00:00:00 GMT-0800 (PST)
export function snapToBinStartDate(date, interval) {

  if (interval === 'DECADE' ) {
    date.setYear(Math.floor(date.getYear() / 10) * 10); // Beginning of decade.
    date.setMonth(0);
    date.setDate(1);
  } else if (interval === 'YEAR') {
    date.setMonth(0);
    date.setDate(1);
  } else if (interval === 'MONTH') {
    date.setDate(1);
  }

  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(0);
  date.setHours(0);

  return date;

}
