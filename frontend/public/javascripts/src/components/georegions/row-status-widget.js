import Status from './georegion-status';
import FormButton from '../form-button';
import { classNames } from '../utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

const georegionsNS = blist.namespace.fetch('blist.georegions');

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

class RowStatusWidget extends Component {
  render() {
    const {
      action,
      authenticityToken,
      id,
      status,
      onSuccess
    } = this.props;

    const className = classNames(
      'row-status-widget-label',
      `is-${status}`
    );
    const defaultButtonProps = {
      authenticityToken,
      onSuccess,
      method: 'put'
    };
    const disabledFormButtonProps = _.merge({}, defaultButtonProps, {
      action: `${action}/enable`,
      'aria-label': t('enable_label'),
      value: t('enable')
    });
    const enabledFormButtonProps = _.merge({}, defaultButtonProps, {
      action: `${action}/disable`,
      'aria-label': t('disable_label'),
      disabled: false,
      title: null,
      value: t('disable')
    });
    const failurePrompt = {
      __html: t('substatus_failed_html', {code: id})
    };

    switch (status) {
      case Status.DISABLED:
        return (
          <div>
            <span
              className="icon-failed status-icon-disabled"
              aria-hidden="true"
              role="presentation" />
            {' '}
            <span className={className}>{t('status_disabled')}</span>
            <FormButton {...disabledFormButtonProps} />
          </div>
        );

      case Status.ENABLED:
        return (
          <div>
            <span
              className="icon-check status-icon-enabled"
              aria-hidden="true"
              role="presentation" />
            {' '}
            <span className={className}>{t('status_enabled')}</span>
            <FormButton {...enabledFormButtonProps} />
          </div>
        );

      case Status.PROGRESS:
        return (
          <div>
            <span
              className="status-icon-progress"
              aria-hidden="true"
              role="presentation" />
            {' '}
            <span className={className}>
              {t('status_progress')}
              <br />
              <span className="substatus">{t('substatus_progress')}</span>
            </span>
          </div>
        );

      case Status.FAILED:
        return (
          <div>
            <span
              className="icon-failed status-icon-failed"
              aria-hidden="true"
              role="presentation" />
            {' '}
            <span className={className}>
              {t('status_failed')}
              <br />
              <p className="substatus" dangerouslySetInnerHTML={failurePrompt} />
            </span>
          </div>
        );

      default:
        // We shouldn't get into this state, but if we don't return anything from this component,
        // React breaks the rest of the javascript on this page. :(
        return null;
    }
  }
}

RowStatusWidget.propTypes = {
  action: PropTypes.string.isRequired,
  authenticityToken: PropTypes.string.isRequired,
  disabledTitle: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.oneOf(_.values(Status)).isRequired,
  onSuccess: PropTypes.func
};

RowStatusWidget.defaultProps = {
  disabledTitle: t('enabled_georegions_limit', { limit: georegionsNS.maximumEnabledCount }),
  onSuccess: _.noop
};

export default RowStatusWidget;
