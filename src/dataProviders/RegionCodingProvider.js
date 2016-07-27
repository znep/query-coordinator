import _ from 'lodash';
import utils from 'socrata-utils';

import DataProvider from './DataProvider';

export default function RegionCodingProvider(config) {
  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  var { domain, datasetUid } = config;
  var requestOptions = { credentials: 'include' };
  var apiUrl = `https://${domain}/geo`;

  var handleJSON = (response) => response.json();
  var handleStatus = (response) => {
    if (response.ok) {
      return response;
    } else {
      throw new Error(response.statusText);
    }
  };

  this.getRegionCodingStatus = ({ shapefileId, jobId }) => {
    var url = `${apiUrl}/status?datasetId=${datasetUid}`;

    if (jobId) {
      url += `&jobId=${jobId}`;
    } else if (shapefileId) {
      url += `&shapefileId=${shapefileId}`;
    } else {
      throw new Error('Expected an Object with either shapefileId or jobId to check status.');
    }

    return fetch(url, requestOptions).
      then(handleStatus).
      then(handleJSON);
  };

  this.awaitRegionCodingCompletion = ({ shapefileId, jobId }) => {
    return new Promise((resolve, reject) => {
      var handleResponse = (response) => {
        switch (response.status) {
          case 'completed':
            resolve(response);
            break;

          case 'processing':
            awaitCompletion();
            break;

          case 'failed':
            reject(new Error(`The region coding job for ${shapefileId} failed.`));
            break;

          default:
            reject(new Error(`We cannot determine the region coding status of ${shapefileId}.`));
            break;

        }
      };

      var awaitCompletion = () => {
        _.delay(() => {
          this.getRegionCodingStatus({ shapefileId, jobId }).
            then(handleResponse).
            catch(handleResponse);
        }, 5000);
      };

      awaitCompletion();
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

    return fetch(`${apiUrl}/initiate`, _.merge(options, requestOptions)).
      then(handleStatus).
      then(handleJSON);
  };
}
