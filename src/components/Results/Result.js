import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import { getSearchUrl } from '../../Util';
import { resultFocusChanged, queryChanged, resultVisibilityChanged } from '../../actions';
import styles from './results.scss';

class Result extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
  }

  handleClick() {
    const { onQueryChanged, onResultsVisibilityChanged } = this.props;

    // set the textbox to be what was clicked and close the results
    onQueryChanged(this.props.name);
    onResultsVisibilityChanged(false);

    // actually search for the clicked item
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
  onQueryChanged: PropTypes.func.isRequired,
  onResultsVisibilityChanged: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  displayTitle: PropTypes.string.isRequired,
  focused: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => ({
  onResultFocusChanged: (newFocus) => { dispatch(resultFocusChanged(newFocus)); },
  onQueryChanged: (query) => { dispatch(queryChanged(query)); },
  onResultsVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(null, mapDispatchToProps)(cssModules(Result, styles));
