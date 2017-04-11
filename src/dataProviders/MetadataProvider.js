var $ = require('jquery');
var utils = require('socrata-utils');
var DataProvider = require('./DataProvider');
var _ = require('lodash');

const headersForDomain = (domain) => {
  const isSameDomain = domain === window.location.hostname;

  const headers = {
    // TODO/EN-9041: The Curated Regions API currently returns an error
    // if you ask for 'application/json; charset=utf-8' as we do in
    // other places in the code. We are temporarily updating this to
    // ask for 'application/json' temporarily, and should restore the
    // charset clause once the bug in the Curated Regions API is fixed.
    'Accept': 'application/json'
  };

  // TODO EN-15459 EN-15483: Once Core correctly responds to OPTIONS,
  // remove the domain check and always set the federation header.
  if (isSameDomain) {
    // Suppress cross-domain redirects if possible.
    headers['X-Socrata-Federation'] = 'Honey Badger';
  }

  return headers;
};

function MetadataProvider(config) {
  var self = this;

  _.extend(this, new DataProvider(config));

  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  /**
   * Public methods
   */

  /**
   * Gets dataset metadata from /api/views/4x4.json.
   *
   * NOTE:
   * Columns are structured in an Array.
   * (See: https://localhost/api/docs/types#View)
   */
  this.getDatasetMetadata = function() {
    const datasetUid = this.getConfigurationProperty('datasetUid');
    return makeMetadataRequest(`api/views/${datasetUid}.json`);
  };

  this.getCuratedRegions = function() {
    return makeMetadataRequest('api/curated_regions');
  };

  this.getPhidippidesMetadata = function() {
    const datasetUid = this.getConfigurationProperty('datasetUid');
    return makeMetadataRequest(`metadata/v1/dataset/${datasetUid}.json`);
  };

  this.getDatasetMigrationMetadata = function() {
    var datasetUid = this.getConfigurationProperty('datasetUid');
    return makeMetadataRequest(`api/migrations/${datasetUid}.json`);
  };

  this.getShapefileMetadata = function() {
    // TODO Make this less of a special snowflake HTTP request.
    const datasetUid = this.getConfigurationProperty('datasetUid');
    const domain = this.getConfigurationProperty('domain');
    function makeRequest(path) {
      const url = `https://${domain}/${path}`;
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();

        function onFail() {

          return reject({
            status: parseInt(xhr.status, 10),
            message: xhr.statusText
          });
        }

        xhr.onload = function() {
          var status = parseInt(xhr.status, 10);

          if (status === 200) {

            try {

              return resolve(
                JSON.parse(xhr.responseText)
              );
            } catch (e) {
              // Let this fall through to the `onFail()` below.
            }
          }

          onFail();
        };

        xhr.onabort = onFail;
        xhr.onerror = onFail;

        xhr.open('GET', url, true);

        _.each(headersForDomain(domain), function(value, key) {
          xhr.setRequestHeader(key, value);
        });

        xhr.send();
      /* eslint-disable dot-notation */
      })['catch'](_.constant(null));
      /* eslint-enable dot-notation */
    }

    var curatedRegionsPath = `api/curated_regions?method=getByViewUid&viewUid=${datasetUid}`;

    var phidippidesPath = `metadata/v1/dataset/${datasetUid}.json`;

    var curatedRegionsRequest = makeRequest(curatedRegionsPath);
    var phidippidesRequest = makeRequest(phidippidesPath);

    return Promise.all([curatedRegionsRequest, phidippidesRequest]).then(function(responses) {
      var curatedRegionsResponse = responses[0];
      var phidippidesResponse = responses[1];

      var curatedRegionsGeometryLabel = _.get(curatedRegionsResponse, 'geometryLabel', null);
      var phidippidesGeometryLabel = _.get(phidippidesResponse, 'geometryLabel', null);
      var geometryLabel = curatedRegionsGeometryLabel || phidippidesGeometryLabel;

      var curatedRegionsFeaturePk = _.get(curatedRegionsResponse, 'featurePk', null);
      var phidippidesFeaturePk = _.get(phidippidesResponse, 'featurePk', null);
      var featurePk = curatedRegionsFeaturePk || phidippidesFeaturePk || '_feature_id';

      return {
        geometryLabel: geometryLabel,
        featurePk: featurePk
      };
    });
  };

  this.isSystemColumn = function(fieldName) {
    return fieldName[0] === ':';
  };

  /*
   * CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
   * sub-columns become their own columns. This function uses heuristics to figure out if a
   * column is likely to be a subcolumn (so not guaranteed to be 100% accurate!).
   *
   * This code is lifted from frontend: lib/common_metadata_methods.rb.
   */
  this.isSubcolumn = function(fieldName, datasetMetadata) {
    utils.assertIsOneOfTypes(fieldName, 'string');

    var isSubcolumn = false;
    var columns = datasetMetadata.columns;
    var fieldNameByName = {};

    var fieldNameWithoutCollisionSuffix = fieldName.replace(/_\d+$/g, '');
    var hasExplodedSuffix = /_(address|city|state|zip|type|description)$/.test(fieldNameWithoutCollisionSuffix);

    var matchedColumn = _.find(columns, _.matches({ fieldName: fieldName }));
    var parentColumnName;

    utils.assert(
      matchedColumn,
      'could not find column {0} in dataset {1}'.format(fieldName, datasetMetadata.id)
    );

    // The naming convention is that child column names are the parent column name, followed by the
    // child column name in parentheses. Remove the parentheses to get the parent column's name.
    parentColumnName = matchedColumn.name.replace(/(\w) +\(.+\)$/, '$1');

    /*
     * CORE-6925: Fairly brittle, but with no other clear option, it seems that
     * we can and should only flag a column as a subcolumn if it follows the
     * naming conventions associated with "exploding" location, URL, and phone
     * number columns, which is an OBE-to-NBE occurrence. Robert Macomber has
     * verified the closed set of suffixes in Slack PM:
     *
     *   _type for the type subcolumn on phones (the number has no suffix)
     *   _description for the description subcolumn on urls (the url itself has no suffix)
     *   _address, _city, _state, _zip for location columns (the point has no suffix)
     *
     * See also https://socrata.slack.com/archives/engineering/p1442959713000621
     * for an unfortunately lengthy conversation on this topic.
     *
     * Complicating this matter... there is no strict guarantee that any suffix
     * for collision prevention (e.g. `_1`) will belong to a user-given column
     * or an exploded column consistently. It's possible that a user will have
     * a column ending in a number. Given that we're already restricting the
     * columns that we're willing to mark as subcolumns based on the closed set
     * of (non-numeric) suffixes, and the low probability of this very specific
     * type of column name similarity, we'll strip numeric parts off the end of
     * the column name *before* checking the closed set. This leaves us with a
     * very low (but non-zero) probability that a user-provided column will be
     * marked as an exploded subcolumn.
     */
    if (parentColumnName !== matchedColumn.name && hasExplodedSuffix) {
      _.each(columns, function(column) {
        fieldNameByName[column.name] = fieldNameByName[column.name] || [];
        fieldNameByName[column.name].push(column.fieldName);
      });

      // Look for the parent column
      // There are columns that have the same name as this one, sans parenthetical.
      // Its field_name naming convention should also match, for us to infer it's a subcolumn.
      isSubcolumn = (fieldNameByName[parentColumnName] || []).
        some(function(parentFieldName) {
          return parentFieldName + '_' === fieldName.substring(0, parentFieldName.length + 1);
        });
    }

    return isSubcolumn;
  };

  // EN-13453: Don't try to pass along hidden columns.
  // If a logged in user has write access to a view, the request for metadata will return hidden
  // columns decorated with a nice hidden flag, instead of omitting the hidden columns completely.
  this.isHiddenColumn = function(flags) {
    return flags ? _.includes(flags, 'hidden') : false;
  };

  // Given a dataset metadata object (see .getDatasetMetadata()),
  // returns an array of the columns  which are suitable for
  // display to the user (all columns minus system and subcolumns).
  //
  // @return {Object[]}
  this.getDisplayableColumns = function(datasetMetadata) {
    utils.assertHasProperty(datasetMetadata, 'columns');

    return _.reject(datasetMetadata.columns, function(column) {
      return self.isSystemColumn(column.fieldName) ||
        self.isSubcolumn(column.fieldName, datasetMetadata) ||
        self.isHiddenColumn(column.flags);
    });
  };

  const makeMetadataRequest = (path) => {
    const domain = this.getConfigurationProperty('domain');
    const url = `https://${domain}/${path}`;

    return new Promise(
      function(resolve, reject) {

        function handleError(jqXHR) {

          reject(
            {
              status: parseInt(jqXHR.status, 10),
              message: jqXHR.statusText,
              metadataError: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
            }
          );
        }

        $.ajax({
          url,
          headers: headersForDomain(domain),
          method: 'GET',
          success: resolve,
          error: handleError
        });
      }
    );
  };
}

module.exports = MetadataProvider;
