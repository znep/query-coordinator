const $ = require('jquery');
const _ = require('lodash');
const utils = require('common/js_utils');
const DataProvider = require('./DataProvider');
const SoqlDataProvider = require('./SoqlDataProvider');

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
  utils.assertHasProperty(config, 'domain');
  utils.assertHasProperty(config, 'datasetUid');

  utils.assertIsOneOfTypes(config.domain, 'string');
  utils.assertIsOneOfTypes(config.datasetUid, 'string');

  _.extend(this, new DataProvider(config));

  const soqlDataProvider = new SoqlDataProvider({
    domain: this.getConfigurationProperty('domain'),
    datasetUid: this.getConfigurationProperty('datasetUid')
  });

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
  this.getDatasetMetadata = () => {
    const datasetUid = this.getConfigurationProperty('datasetUid');
    const readFromNbe = this.getOptionalConfigurationProperty('readFromNbe', true);
    let url = `api/views/${datasetUid}.json`;

    if (readFromNbe) {
      url = url + '?read_from_nbe=true&version=2.1';
    }

    return makeMetadataRequest(url);
  };

  this.getCuratedRegions = () => {
    return makeMetadataRequest('api/curated_regions');
  };


  // In short, a view's base view is the view which supplies a view's metadata blob.
  // I'm sorry about how complicated this is. We're in a split world where
  //   A) We place important things into the view metadata (i.e. rowLabel),
  //   B) AX and the visualizations primarily work with NBE replicas,
  //   C) We have an OBE->NBE sync which does _not_ sync over the view metadata field,
  //   D) We're given any one of these as datasetUid:
  //    1. UID of NBE-only dataset.
  //    2. UID of NBE replica of OBE dataset.
  //    3. UID of a derived view (they don't have separate NBE UIDs).
  //      3a. The derived view may have a modifyingViewUid.
  // This means that we must always
  //   1) Check to see which of the 3 types of UIDs we've been given.
  //   2) If derived view, find parent view.
  //   3) Read metadata from OBE replica, if it exists.
  //      If it does not exist, read from base view.
  //      If that too does not exist, read from datasetUid.
  //
  // Important note: This method may fail due to permissions issues. If it does,
  // the recommended course of action is to fall back to the plain dataset metadata
  // from getDatasetMetadata - it is likely impossible for the user to obtain access
  // to the base view (especially when it comes to modifyingViewUid, which exists
  // purely to allow users to create derived views on datasets they have access to only
  // through a redacted derived view).
  this.getBaseViewMetadata = () => {
    const domain = this.getConfigurationProperty('domain');
    const datasetUid = this.getConfigurationProperty('datasetUid');

    return this.getDatasetMigrationMetadata().then(
      (migrationMetadata) =>
        // If there's a migration, we're definitely A) a default view, and
        // B) the OBE view has the correct metadata.
        new MetadataProvider({ domain, datasetUid: migrationMetadata.obeId }).
          getDatasetMetadata(),
      () => {
        // Lack of migration means we're either A) NBE-only, B) derived
        // In either case, we can call core to getDefaultView.
        // That should traverse through modifyingViewUid, but I'm not 100%
        // sure. If the view still has a modifyingViewUid, grab its metadata.
        return this.getDefaultView().then((defaultView) => {
          if (defaultView.modifyingViewUid) {
            return new MetadataProvider({ domain, datasetUid: defaultView.modifyingViewUid }).
              getDatasetMetadata();
          } else {
            return defaultView;
          }
        });
      }
    );
  }

  this.getDefaultView = () => {
    const datasetUid = this.getConfigurationProperty('datasetUid');
    const url = `api/views/${datasetUid}.json?method=getDefaultView&accessType=WEBSITE`;

    return makeMetadataRequest(url);
  };

  this.getDatasetMigrationMetadata = () => {
    const datasetUid = this.getConfigurationProperty('datasetUid');
    const url = `api/migrations/${datasetUid}.json`;

    return makeMetadataRequest(url);
  };

  this.getShapefileMetadata = () => {
    const domain = this.getConfigurationProperty('domain');
    const datasetUid = this.getConfigurationProperty('datasetUid');

    function makeRequest(path) {
      const url = `https://${domain}/${path}`;

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        function onFail() {
          return reject({
            status: parseInt(xhr.status, 10),
            message: xhr.statusText
          });
        }

        xhr.onload = () => {
          const status = parseInt(xhr.status, 10);

          if (status === 200) {
            try {
              return resolve(JSON.parse(xhr.responseText));
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
      }).catch(_.constant(null));
    }

    const curatedRegionsUrl = `api/curated_regions?method=getByViewUid&viewUid=${datasetUid}`;
    const curatedRegionsRequest = makeRequest(curatedRegionsUrl);

    return curatedRegionsRequest.then((curatedRegionsResponse) => {
      const curatedRegionsGeometryLabel = _.get(curatedRegionsResponse, 'geometryLabel', null);
      const geometryLabel = curatedRegionsGeometryLabel;

      const curatedRegionsFeaturePk = _.get(curatedRegionsResponse, 'featurePk', null);
      const featurePk = curatedRegionsFeaturePk || '_feature_id';

      return {
        geometryLabel: geometryLabel,
        featurePk: featurePk
      };
    });
  };

  this.isSystemColumn = (fieldName) => {
    return fieldName[0] === ':';
  };

  /*
   * CORE-4645 OBE datasets can have columns that have sub-columns. When converted to the NBE, these
   * sub-columns become their own columns. This function uses heuristics to figure out if a
   * column is likely to be a subcolumn (so not guaranteed to be 100% accurate!).
   *
   * This code is lifted from frontend: lib/common_metadata_methods.rb.
   */
  this.isSubcolumn = (fieldName, datasetMetadata) => {
    utils.assertIsOneOfTypes(fieldName, 'string');

    let parentColumnName;
    let isSubcolumn = false;
    const columns = datasetMetadata.columns;
    const fieldNameByName = {};

    const fieldNameWithoutCollisionSuffix = fieldName.replace(/_\d+$/g, '');
    const hasExplodedSuffix = /_(address|city|state|zip|type|description)$/.test(fieldNameWithoutCollisionSuffix);

    const matchedColumn = _.find(columns, _.matches({ fieldName: fieldName }));

    utils.assert(
      matchedColumn,
      `could not find column ${fieldName} in dataset ${datasetMetadata.id}`
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
      _.each(columns, (column) => {
        fieldNameByName[column.name] = fieldNameByName[column.name] || [];
        fieldNameByName[column.name].push(column.fieldName);
      });

      // Look for the parent column
      // There are columns that have the same name as this one, sans parenthetical.
      // Its field_name naming convention should also match, for us to infer it's a subcolumn.
      isSubcolumn = (fieldNameByName[parentColumnName] || []).
        some((parentFieldName) => {
          return parentFieldName + '_' === fieldName.substring(0, parentFieldName.length + 1);
        });
    }

    return isSubcolumn;
  };

  // EN-13453: Don't try to pass along hidden columns.
  // If a logged in user has write access to a view, the request for metadata will return hidden
  // columns decorated with a nice hidden flag, instead of omitting the hidden columns completely.
  this.isHiddenColumn = (flags) => {
    return flags ? _.includes(flags, 'hidden') : false;
  };

  // Given a dataset metadata object (see .getDatasetMetadata()),
  // returns an array of the columns  which are suitable for
  // display to the user (all columns minus system and subcolumns).
  //
  // @return {Object[]}
  this.getDisplayableColumns = (datasetMetadata) => {
    utils.assertHasProperty(datasetMetadata, 'columns');

    return _.reject(datasetMetadata.columns, (column) => {
      return this.isSystemColumn(column.fieldName) ||
        this.isSubcolumn(column.fieldName, datasetMetadata) ||
        this.isHiddenColumn(column.flags);
    });
  };

  /**
   * Returns columns that are support by our filtering experience.
   * These columns include numbers (with column stats), text and
   * calendar dates.
   */
  this.getFilterableColumns = (datasetMetadata) => {
    utils.assertHasProperty(datasetMetadata, 'columns');

    return _.filter(datasetMetadata.columns, (column) => {
      switch (column.dataTypeName) {
        case 'money':
        case 'number':
          return _.isNumber(column.rangeMin) && _.isNumber(column.rangeMax);
        case 'text':
        case 'calendar_date':
          return true;
        default:
          return false;
      }
    });
  };

  /**
   * Returns the result of getDisplayableColumns and
   * getFilterableColumns combined with a fresh call to
   * getDatasetMetadata.
   */
  this.getDisplayableFilterableColumns = () => {
    return this.getDatasetMetadata().
      then((datasetMetadata) => {
        return Promise.all([
          Promise.resolve(datasetMetadata),
          soqlDataProvider.getColumnStats(datasetMetadata.columns)
        ]);
      }).
      then((resolutions) => {
        const [ datasetMetadata, columnStats ] = resolutions;
        const columns = _.merge([], columnStats, datasetMetadata.columns);
        const getDisplayableFilterableColumns = _.flow(
          this.getDisplayableColumns,
          (displayableColumns) => this.getFilterableColumns({ columns: displayableColumns })
        );

        return Promise.resolve(getDisplayableFilterableColumns({ columns }));
      });
  };

  const makeMetadataRequest = (path) => {
    const domain = this.getConfigurationProperty('domain');
    const url = `https://${domain}/${path}`;

    return new Promise((resolve, reject) => {
      function handleError(jqXHR) {
        reject({
          status: parseInt(jqXHR.status, 10),
          message: jqXHR.statusText,
          metadataError: jqXHR.responseJSON || jqXHR.responseText || '<No response>'
        });
      }

      $.ajax({
        url,
        method: 'GET',
        success: resolve,
        error: handleError,
        headers: headersForDomain(domain)
      });
    });
  };
}

module.exports = MetadataProvider;
