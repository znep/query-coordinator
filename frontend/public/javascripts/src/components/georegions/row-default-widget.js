import Status from './georegion-status';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import FormCheckbox from '../form-checkbox';

class RowDefaultWidget extends PureComponent {
  render() {
    const {
      action,
      allowDefaulting,
      authenticityToken,
      defaultLimit,
      defaultStatus,
      enabledStatus,
      id,
      onSuccess
    } = this.props;

    const defaultCheckboxProps = {
      authenticityToken,
      checked: defaultStatus,
      id: `default-${id}`,
      onSuccess,
      method: 'put'
    };

    if (defaultStatus && (enabledStatus === Status.ENABLED)) {
      const selectedFormCheckboxProps = _.merge({}, defaultCheckboxProps, {
        action: `${action}/undefault`,
        title: $.t('screens.admin.georegions.undefault')
      });

      return (
        <FormCheckbox {...selectedFormCheckboxProps} />
      );
    } else if (enabledStatus === Status.DISABLED) {
      const disabledFormCheckboxProps = _.merge({}, defaultCheckboxProps, {
        disabled: true,
        title: $.t('screens.admin.georegions.disable_default_label')
      });

      return (
        <FormCheckbox {...disabledFormCheckboxProps} />
      );
    } else {
      const label = allowDefaulting ?
        $.t('screens.admin.georegions.default') :
        $.t('screens.admin.georegions.default_georegions_limit', { limit: defaultLimit });

      const notSelectedFormCheckboxProps = _.merge({}, defaultCheckboxProps, {
        action: `${action}/default`,
        disabled: !allowDefaulting,
        title: label
      });

      return (
        <FormCheckbox {...notSelectedFormCheckboxProps} />
      );
    }
  }
}

RowDefaultWidget.propTypes = {
  action: PropTypes.string.isRequired,
  allowDefaulting: PropTypes.bool.isRequired,
  authenticityToken: PropTypes.string.isRequired,
  defaultLimit: PropTypes.number.isRequired,
  defaultStatus: PropTypes.bool.isRequired,
  enabledStatus: PropTypes.oneOf(_.values(Status)).isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSuccess: PropTypes.func
};

RowDefaultWidget.defaultProps = {
  onSuccess: _.noop
};

export default RowDefaultWidget;
