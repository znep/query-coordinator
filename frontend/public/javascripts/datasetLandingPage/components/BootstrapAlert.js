import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import classNames from 'classnames';
import components from 'common/components';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { localizeLink } from 'common/locale';

export class BootstrapAlert extends Component {
  componentWillMount() {
    this.uniqueId = _.uniqueId();
  }

  // Using components.attachTo here isn't possible.  Until common/components is able to handle
  // multiple attachTo's and scope them properly, we must use the factory manually.
  componentDidMount() {
    components.factories.FlyoutFactory(ReactDOM.findDOMNode(this)); // eslint-disable-line
  }

  render() {
    const { bootstrapUrl, onClickBootstrap } = this.props;
    const isDisabled = !_.isString(bootstrapUrl);
    let className = 'btn btn-sm btn-alternate-2';
    let flyoutId;
    let flyout;

    if (isDisabled) {
      className = classNames(className, 'btn-disabled');
      flyoutId = `bootstrap-flyout-${this.uniqueId}`;
      flyout = (
        <div id={flyoutId} className="flyout flyout-hidden">
          <section className="flyout-content">
            <p>{I18n.bootstrap_disabled_notice}</p>
          </section>
          <footer className="flyout-footer" />
        </div>
      );
    }

    return (
      <div className="alert default bootstrap-alert">
        <div className="message">
          {I18n.bootstrap_message}
        </div>

        <a
          href={isDisabled ? null : localizeLink(bootstrapUrl)}
          className={className}
          data-flyout={flyoutId}
          onClick={isDisabled ? null : onClickBootstrap}
          tabIndex="0"
          disabled={isDisabled}
          role="link">
          {I18n.bootstrap_button}
        </a>
        {flyout}
      </div>
    );
  }
}

BootstrapAlert.propTypes = {
  bootstrapUrl: PropTypes.string,
  onClickBootstrap: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return {
    onClickBootstrap() {
      const payload = {
        name: 'Created a Data Lens',
        properties: {
          'From Page': 'DSLP'
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(null, mapDispatchToProps)(BootstrapAlert);
