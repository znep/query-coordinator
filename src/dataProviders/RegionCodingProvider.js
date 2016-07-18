import _ from 'lodash';
import $ from 'jquery';
import utils from 'socrata-utils';

import DataProvider from './DataProvider';

export default function RegionCodingProvider(config) {
  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  var { domain, datasetUid } = config;
  var requestOptions = { credentials: 'include' };
  var apiUrl = `https://${domain}/geo`;

  this.getRegionCodingStatus = (shapefileId) => {
    return fetch(`${apiUrl}/status?datasetId=${datasetUid}&shapefileId=${shapefileId}`, requestOptions).
      then(response => response.json());
  };

  this.awaitRegionCodingCompletion = (shapefileId) => {
    return new Promise((resolve, reject) => {
      var await = () => {
        this.getRegionCodingStatus(shapefileId).
          then(handleResponse);
      };

      var handleResponse = (response) => {
        if (response.success && response.status === 'completed') {
          resolve(response);
        } else if (response.success && response.status === 'failed') {
          reject(null); // TODO: provide an error so upstream consumers have something to work with
        } else {
          resolve(this.awaitRegionCodingCompletion(shapefileId));
        }
      };

      _.delay(await, 5000);
    });
  };

  this.initiateRegionCoding = (shapefileId, sourceColumn) => {
    var options = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        datasetId: datasetUid,
        shapefileId,
        sourceColumn
      })
    };

    return fetch(`${apiUrl}/initiate`, _.merge(options, requestOptions));
  };
}
