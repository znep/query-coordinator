export default class GoalsApi {
  constructor(httpClient) {
    this._httpClient = httpClient;
    this._baseUrl = '/stat/api/';
  }

  /**
   * Updates the given goal
   *
   * @param {String} goalId      Goal id
   * @param {String} goalVersion Goal apiVersion
   * @param {Object} data        Goal object
   *
   * @returns {Promise<Object>}
   */
  update(goalId, goalVersion, data) {
    const path = this._getUrl('v2', `goals/${goalId}`);
    const options = {
      headers: {
        'If-Match': goalVersion
      }
    };

    return this._httpClient.put(path, data, options).then(goal => {
      goal.id = goalId;
      return goal;
    });
  }

  /**
   * Fetches all goal data from the server for current domain, be careful
   * this data might really big.
   *
   * @returns {Promise<Array>}
   */
  getAll() {
    const path = this._getUrl('v1', 'goals.json');
    return this._httpClient.get(path, { json: true });
  }

  /**
   * Fetches goal data matches the given id
   *
   * @param   {String} goalId Goal id
   *
   * @returns {Promise<Object>}
   */
  getById(goalId) {
    const path = this._getUrl('v1', `goals/${goalId}`);
    return this._httpClient.get(path, { json: true });
  }

  /**
   * Fetches all goal data as csv from the server for current domain.
   * Designed only for CSV exports
   *
   * @returns {Promise<String>}
   */
  fetchCsvData() {
    const path = this._getUrl('v1', 'goals.csv');
    return this._httpClient.get('v1', path, {});
  }

  /**
   * Helper method for creating urls
   *
   * @param {String} apiVersion
   * @param {String} path
   *
   * @returns {String}
   */
  _getUrl(apiVersion, path) {
    return `${this._baseUrl}/${apiVersion}/${path}`;
  }
}
