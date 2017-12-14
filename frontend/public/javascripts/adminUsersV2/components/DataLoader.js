import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { loadData } from '../actions';

/**
 * Wrapper utility component for triggering data load on component mount
 */
class BaseDataLoader extends Component {
  static propTypes = {
    children: PropTypes.any.isRequired,
    loadData: PropTypes.func.isRequired
  };

  componentDidMount() {
    this.props.loadData();
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => {
  return {
    loadData: () => dispatch(loadData())
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(BaseDataLoader);
