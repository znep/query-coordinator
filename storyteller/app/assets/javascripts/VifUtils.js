import _ from 'lodash';

import { assertInstanceOf, assertIsString } from 'common/js_utils';

import Constants from './editor/Constants';
import I18n from './editor/I18n';

export const vifsAreEquivalent = (vif1, vif2) => {
  var vif1Clone = _.cloneDeep(vif1);
  var vif2Clone = _.cloneDeep(vif2);

  // The 'createdAt' property is updated when a visualization is added to the
  // story, but if everything else is the same the two visualizations are
  // equivalent anyway. We can therefore delete this key from the two cloned
  // vifs and measure functional equality using _.isEqual().
  delete vif1Clone.createdAt;
  delete vif2Clone.createdAt;

  return _.isEqual(vif1Clone, vif2Clone);
};

export const updateVifWithDefaults = (vif) => {
  assertInstanceOf(vif, Object);

  const newVif = _.cloneDeep(vif);

  _.defaults(newVif, {
    unit: {
      one: I18n.t('editor.visualizations.default_unit.one'),
      other: I18n.t('editor.visualizations.default_unit.other')
    }
  });

  // Core strips null values from our vif when we retrieve it with the ViewsService.
  // See Block class (rails) for another spot where we fill in the stripped fields.
  // Important fields that will break viz if they don't exist:
  //
  //    series[...].dataSource.filters (default this to empty array)
  //    series[...].dataSource.filters[...].argument (default this to null)
  //
  _.forEach(newVif.series, (series) => {
    if (_.isUndefined(series.dataSource.filters)) {
      series.dataSource.filters = [];
    } else {
      _.forEach(series.dataSource.filters, (filter) => {
        if (_.isUndefined(filter.arguments)) {
          filter.arguments = null;
        }
      });
    }
  });

  return newVif;
};

export const updateVifWithFederatedFromDomain = (vif, federatedFromDomain) => {
  assertInstanceOf(vif, Object);
  if (!_.isUndefined(federatedFromDomain) && !_.isNull(federatedFromDomain)) {
    assertIsString(federatedFromDomain);
  }

  const newVif = _.cloneDeep(vif);
  if (!_.isEmpty(federatedFromDomain)) {
    _.defaults(newVif, {
      origin: {
        federatedFromDomain
      }
    });
  }
  return newVif;
};

// At some point in the future we may want to do a check to see if the
// datasetUid is available on `tileserver[1..n].api.us.socrata.com` before
// falling back to the dataset's host domain.
//
// For now, this should be sufficient.
export const updateFeatureMapVifWithDefaults = (vif) => {
  assertInstanceOf(vif, Object);

  const newVif = _.cloneDeep(vif);

  _.defaults(newVif, {
    configuration: {
      tileserverHosts: [
        'https://' + _.get(vif, 'series[0].dataSource.domain', vif.domain)
      ],
      baseLayerUrl: Constants.SOCRATA_VISUALIZATION_FEATURE_MAP_DEFAULT_BASE_LAYER,
      baseLayerOpacity: 0.8,
      hover: true,
      locateUser: true,
      panAndZoom: true
    }
  });

  return newVif;
};
