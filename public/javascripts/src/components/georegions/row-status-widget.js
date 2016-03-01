import Status from './georegion-status';
import FormButton from '../form-button';
import { classNames } from '../utils';
import React, { PropTypes } from 'react';

const georegionsNS = blist.namespace.fetch('blist.georegions');

function t(str, props) {
  return $.t('screens.admin.georegions.' + str, props);
}

const RowStatusWidget = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    allowEnablement: PropTypes.bool,
    authenticityToken: PropTypes.string.isRequired,
    disabledTitle: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.number]).isRequired,
    status: PropTypes.oneOf(_.values(Status)).isRequired,
    onSuccess: PropTypes.func
  },
  getDefaultProps() {
    return {
      allowEnablement: true,
      disabledTitle: t('enabled_georegions_limit', { limit: georegionsNS.maximumEnabledCount }),
      onSuccess: _.noop
    };
  },
  render() {
    const {
      action,
      allowEnablement,
      authenticityToken,
      disabledTitle,
      id,
      status,
      onSuccess
    } = this.props;
    const statusLabel = t(`status_${status}`);
    const className = classNames(
      'row-status-widget-label',
      `is-${status}`
    );
    const defaultButtonProps = {
      authenticityToken,
      onSuccess,
      method: 'put'
    };

    switch (status) {
      case Status.DISABLED:
        const disabledFormButtonProps = _.merge(defaultButtonProps, {
          action: `${action}/enable`,
          disabled: !allowEnablement,
          title: !allowEnablement ? disabledTitle : null,
          value: t('enable')
        });

        return (
          <div>
            <span className="icon-failed status-icon-disabled"></span>
            {' '}
            <span className={className}>{statusLabel}</span>
            <FormButton {...disabledFormButtonProps} />
          </div>
        );

      case Status.ENABLED:
        const enabledFormButtonProps = _.merge(defaultButtonProps, {
          action: `${action}/disable`,
          disabled: false,
          title: null,
          value: t('disable')
        });

        return (
          <div>
            <span className="icon-check status-icon-enabled"></span>
            {' '}
            <span className={className}>{statusLabel}</span>
            <FormButton {...enabledFormButtonProps} />
          </div>
        );

      case Status.PROGRESS:
        return (
          <div>
            <span className="icon-processing status-icon-progress"></span>
            {' '}
            <span className={className}>
              {statusLabel}
              <br />
              <span className="substatus">{t('substatus_progress')}</span>
            </span>
          </div>
        );

      case Status.FAILED:
        const failurePrompt = {
          __html: t('substatus_failed_html', {code: id})
        };
        return (
          <div>
            <span className="icon-failed status-icon-failed"></span>
            {' '}
            <span className={className}>
              {statusLabel}
              <br />
              <p className="substatus" dangerouslySetInnerHTML={failurePrompt} />
            </span>
          </div>
        );
    }
  }
});

export default RowStatusWidget;
