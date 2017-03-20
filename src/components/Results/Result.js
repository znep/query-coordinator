import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { getSearchUrl } from '../../Util';
import { resultFocusChanged } from '../../actions';
import styles from './results.scss';

class Result extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
  }

  handleClick() {
    window.location.href = getSearchUrl(this.props.name);
  }

  handleMouseOver() {
    // we set focus on mouseover so if somebody mouses over a result,
    // then uses the arrow keys, we start from the proper spot
    this.props.onResultFocusChanged(this.props.index);
  }

  render() {
    return (
      <div
        ref={(domNode) => { this.domNode = domNode; }}
        styleName={this.props.focused === true ? 'result-focused' : 'result'}
        onMouseDown={this.handleClick}
        onMouseOver={this.handleMouseOver}
        dangerouslySetInnerHTML={{ __html: this.props.displayTitle }} />
    );
  }
}

Result.propTypes = {
  onResultFocusChanged: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  displayTitle: PropTypes.string.isRequired,
  focused: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => ({
  onResultFocusChanged: (newFocus) => {
    dispatch(resultFocusChanged(newFocus));
  }
});

export default connect(null, mapDispatchToProps)(cssModules(Result, styles));
