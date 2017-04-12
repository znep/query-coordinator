import moment from 'moment';

export default class ActivityFeedApi {
  constructor(httpClient) {
    this._httpClient = httpClient;
    this._baseUrl = '/admin/activity_feed.json';
  }

  /**
   * Fetchs the activity feed
   *
   * @param {Number} [page]           1 Indexed page number
   * @param {String} [activityType]   Activity type for filtering
   * @param {String} [activityStatus] Activity status for filtering
   * @param {Object} [dateFrom]       Limit activities after the given date
   * @param {Object} [dateTo]         Limit activities before the given date
   *
   * @returns {Promise<Array>}
   */
  get(page = 1, activityType = 'All', activityStatus = 'All', dateFrom, dateTo) {
    let query = '?';

    if (dateFrom) {
      let dateRange = '';

      dateRange += moment(dateFrom).format('MM/DD/YYYY');

      if (dateTo) {
        dateRange += ' - ';
        dateRange += moment(dateTo).format('MM/DD/YYYY');
      }

      query += `date_range=${encodeURIComponent(dateRange)}`;
    }

    query += `&page=${page}&activity_type=${activityType}&activity_status=${activityStatus}`;

    const url = this._baseUrl + query;

    return this._httpClient.get(url, { json: true });
  }

  restoreDataset(datasetId) {
    if (datasetId) {
      const url = `/views/${datasetId}.json?method=restore`;

      return this._httpClient.patch(url);
    } else {
      return Promise.reject(new Error('empty datasetId'));
    }
  }
}
