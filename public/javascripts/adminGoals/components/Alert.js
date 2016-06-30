import _ from 'lodash';
import React from 'react';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

import { hideAlert } from '../actions/alertActions';

class Alert extends React.Component {
  render() {
    let alertProps = {
      className: classNames('alert', this.props.label, {
        hidden: _.isUndefined(this.props.label) || _.isEmpty(this.props.label)
      }),
      onClick: this.props.hide,
      dangerouslySetInnerHTML: {
        __html: this.props.message ||
        this.props.translations.getIn(['admin', 'listing', 'default_alert_message'])
      }
    };

    return <div { ...alertProps } />;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  label: state.getIn(['goalTableData', 'alert', 'label']),
  message: state.getIn(['goalTableData', 'alert', 'message'])
});

const mapDispatchToProps = dispatch => ({
  hide: () => dispatch(hideAlert())
});

export default connect(mapStateToProps, mapDispatchToProps)(Alert);
