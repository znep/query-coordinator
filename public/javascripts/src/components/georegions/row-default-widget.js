import Status from './georegion-status';
import React, { PropTypes } from 'react';
import FormCheckbox from '../form-checkbox';

const RowDefaultWidget = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    allowDefaulting: PropTypes.bool.isRequired,
    authenticityToken: PropTypes.string.isRequired,
    defaultLimit: PropTypes.number.isRequired,
    defaultStatus: PropTypes.bool.isRequired,
    enabledStatus: PropTypes.oneOf(_.values(Status)).isRequired,
    id: PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
    onSuccess: PropTypes.func
  },
  getDefaultProps() {
    return {
      onSuccess: _.noop
    };
  },
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
        action: `${action}/undefault`
      });

      return (
        <FormCheckbox {...selectedFormCheckboxProps} />
      );
    } else {
      const notSelectedFormCheckboxProps = _.merge({}, defaultCheckboxProps, {
        action: `${action}/default`,
        disabled: !allowDefaulting || (enabledStatus === Status.DISABLED),
        title: allowDefaulting ? null : $.t('screens.admin.georegions.default_georegions_limit', { limit: defaultLimit })
      });

      return (
        <FormCheckbox {...notSelectedFormCheckboxProps} />
      );
    }
  }
});

export default RowDefaultWidget;
