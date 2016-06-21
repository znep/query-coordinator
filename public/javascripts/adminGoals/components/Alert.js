import _ from 'lodash';
import React from 'react';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

import { hideAlert } from '../actions/alertActions';

class Alert extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let alertClass = classNames('alert', this.props.label, {
      hidden: _.isUndefined(this.props.label) || _.isEmpty(this.props.label)
    });
    let message = this.props.message || <span><b>Oh no!</b> Something went wrong and our team has been notified.
        In the meantime, try your action again or refresh this page.</span>;

    return <div className={ alertClass } onClick={ this.props.hide }>
      { message }
    </div>;
  }
}

const mapStateToProps = state => ({
  label: state.getIn(['goalTableData', 'alert', 'label']),
  message: state.getIn(['goalTableData', 'alert', 'message'])
});

const mapDispatchToProps = dispatch => ({
  hide: () => dispatch(hideAlert())
});

export default connect(mapStateToProps, mapDispatchToProps)(Alert);
