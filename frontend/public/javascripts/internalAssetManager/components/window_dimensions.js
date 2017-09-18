import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { changeDimensions } from '../actions/window_dimensions';

export class WindowDimensions extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'updateDimensions');
  }

  componentWillMount() {
    this.updateDimensions();
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions() {
    this.props.changeDimensions(window.innerHeight, window.innerWidth);
  }

  render() {
    return null;
  }
}

WindowDimensions.propTypes = {
  changeDimensions: PropTypes.func.isRequired
};

const mapDispatchToProps = (dispatch) => ({
  changeDimensions: (height, width) => dispatch(changeDimensions(height, width))
});

export default connect(null, mapDispatchToProps)(WindowDimensions);
