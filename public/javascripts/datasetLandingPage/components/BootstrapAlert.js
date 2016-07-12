import _ from 'lodash';
import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import classNames from 'classnames';
import styleguide from 'socrata-styleguide';
import { emitMixpanelEvent } from '../actions/mixpanel';

export var BootstrapAlert = React.createClass({
  propTypes: {
    bootstrapUrl: PropTypes.string,
    onClickBootstrap: PropTypes.func
  },

  componentWillMount: function() {
    this.uniqueId = _.uniqueId();
  },

  // Using styleguide.attachTo here isn't possible.  Until styleguide is able to handle multiple
  // attachTo's and scope them properly, we must use the factory manually.
  componentDidMount: function() {
    styleguide.factories.FlyoutFactory(ReactDOM.findDOMNode(this)); // eslint-disable-line
  },

  render: function() {
    var { bootstrapUrl, onClickBootstrap } = this.props;
    var isDisabled = !_.isString(bootstrapUrl);
    var className = 'btn btn-sm btn-alternate-2';
    var flyoutId;
    var flyout;

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
        {I18n.bootstrap_message}
        <a
          href={bootstrapUrl}
          className={className}
          target="_blank"
          data-flyout={flyoutId}
          onClick={onClickBootstrap}>
          {I18n.bootstrap_button}
        </a>
        {flyout}
      </div>
    );
  }
});

function mapDispatchToProps(dispatch) {
  return {
    onClickBootstrap: function() {
      var payload = {
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
