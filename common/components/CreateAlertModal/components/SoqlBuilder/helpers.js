import _ from 'lodash';

import I18n from 'common/i18n';
import {
  AGGREGATION_TYPES,
  LOCATION_COLUMN_TYPES,
  DATE_COLUMN_TYPES,
  STRING_COLUMN_TYPES,
  NUMBER_COLUMN_TYPES
} from 'common/components/CreateAlertModal/constants';

const formatListOption = (options) => {
  return options.map((option) => {
    return { title: option, value: option };
  });
};

export const aggregateOptions = (selectedDatasetColumn) => {
  const columnType = _.get(selectedDatasetColumn, 'column_type');
  const translationScope = 'shared.components.create_alert_modal.custom_alert.aggregation';
  const textOptions = [
    { title: I18n.t('is', { scope: translationScope }), value: '=' },
    { title: I18n.t('is_not', { scope: translationScope }), value: '!=' }];
  const dateOptions = [
    { title: I18n.t('is_within', { scope: translationScope }), value: 'IS_WITHIN' },
    { title: I18n.t('not_within', { scope: translationScope }), value: 'NOT_WITHIN' }];
  const numberOptions = [
    { title: I18n.t('sum', { scope: translationScope }), value: 'SUM' },
    { title: I18n.t('avg', { scope: translationScope }), value: 'AVG' },
    { title: I18n.t('min', { scope: translationScope }), value: 'MIN' },
    { title: I18n.t('max', { scope: translationScope }), value: 'MAX' },
    { title: '<', value: '<' },
    { title: '>', value: '>' },
    { title: '=', value: '=' },
    { title: '<=', value: '<=' },
    { title: '>=', value: '>=' }];
  const locationOptions = [{ title: I18n.t('near', { scope: translationScope }), value: 'NEAR' }];

  let optionsHash = { 'row_identifier': formatListOption(['<', '>', '=', '<=', '>=']) };
  _.each(STRING_COLUMN_TYPES, function(columnType) {
    optionsHash[columnType] = textOptions;
  });
  _.each(NUMBER_COLUMN_TYPES, function(columnType) {
    optionsHash[columnType] = numberOptions;
  });
  _.each(LOCATION_COLUMN_TYPES, function(locationType) {
    optionsHash[locationType] = locationOptions;
  });

  _.each(DATE_COLUMN_TYPES, function(locationType) {
    optionsHash[locationType] = dateOptions;
  });
  return _.get(optionsHash, columnType, textOptions);
};
