import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import cssModules from 'react-css-modules';
import { resultFocusChanged, queryChanged, resultVisibilityChanged } from '../../actions';
import styles from './results.scss';

export class Result extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
    this.handleMouseOver = this.handleMouseOver.bind(this);
    this.displayTitle = this.displayTitle.bind(this);
  }

  handleClick() {
    const { onQueryChanged, onResultsVisibilityChanged, onChooseResult } = this.props;

    // set the textbox to be what was clicked and close the results
    onQueryChanged(this.props.name);
    onResultsVisibilityChanged(false);

    // actually search for the clicked item
    onChooseResult(this.props.name);
  }

  handleMouseOver() {
    // we set focus on mouseover so if somebody mouses over a result,
    // then uses the arrow keys, we start from the proper spot
    this.props.onResultFocusChanged(this.props.index);
  }

  // Returns array of `name` prop fragments decorated with <span class="highlight">
  // around the matches specified in the `matchOffsets` prop.
  // NOTE: there is a `display_title` in the Cetera Autocomplete result that has the <span>
  // tags already, but it is deprecated. More details: EN-15539
  displayTitle() {
    const { matchOffsets, name } = this.props;
    const displayTitleFragments = [];

    // Beginning of title, before any matches
    displayTitleFragments.push(name.substring(0, _.get(matchOffsets[0], 'start')));

    matchOffsets.forEach((offset, index) => {
      // Wrap each match with <span class="highlight">
      displayTitleFragments.push(
        <span className="highlight" key={index}>
          {name.substring(offset.start, offset.length + offset.start)}
        </span>
      );

      // Push the following non-highlighted substring up until the next highlighted substring,
      // or the rest of the name if there isn't another highlighted substring.
      const nextMatch = matchOffsets[index + 1];
      const nextMatchStart = nextMatch ? nextMatch.start : undefined;

      displayTitleFragments.push(
        name.substring(offset.length + offset.start, nextMatchStart)
      );
    });

    return displayTitleFragments;
  }

  render() {
    return (
      <div
        key={this.props.name}
        styleName={this.props.focused === true ? 'result-focused' : 'result'}
        onMouseDown={this.handleClick}
        onMouseOver={this.handleMouseOver}>
        {this.displayTitle()}
      </div>
    );
  }
}

Result.propTypes = {
  onChooseResult: PropTypes.func.isRequired,
  onResultFocusChanged: PropTypes.func.isRequired,
  onQueryChanged: PropTypes.func.isRequired,
  onResultsVisibilityChanged: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  matchOffsets: PropTypes.array.isRequired,
  name: PropTypes.string.isRequired,
  focused: PropTypes.bool
};

const mapDispatchToProps = (dispatch) => ({
  onResultFocusChanged: (newFocus) => { dispatch(resultFocusChanged(newFocus)); },
  onQueryChanged: (query) => { dispatch(queryChanged(query)); },
  onResultsVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(null, mapDispatchToProps)(cssModules(Result, styles));
