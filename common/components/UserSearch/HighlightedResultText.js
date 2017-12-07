import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { MatchesPropType } from './UserSearchResultPropType';

/**
 * Checks the given "matches" for the given "fieldName"
 *
 * If the fieldName has a match, will split the given string
 * into an array with spans for highlights
 * (see renderSplitString method)
 *
 * It the fieldName does NOT have a match, then the string will
 * just be rendered.
 */
class HighlightedResultText extends Component {
  static propTypes = {
    fieldName: PropTypes.string.isRequired,
    matches: MatchesPropType,
    text: PropTypes.string.isRequired
  };

  static defaultProps = {
    matches: null
  }

  /**
   * Splits the given string based on the given offsets.
   *
   * Offsets look like:
   * [
   *  { start: 0, length: 4 },
   *  { start: 7, length: 4 }
   * ]
   */
  renderSplitString = (text, fieldName, offsets) => {
    const fragments = [];

    let currentIndex = 0;
    offsets.forEach(offset => {
      const { start, length } = offset;

      // push before the highlight...
      fragments.push(text.substring(currentIndex, start));

      // then the highlight itself...
      fragments.push(
        <span
          className="user-search-result-highlight"
          key={`${fieldName}-${start}-highlight`}>
          {text.substring(start, start + length)}
        </span>
      );

      // ... and move on to the next one
      currentIndex = start + length;
    });

    // push any remaining bits of string we have
    fragments.push(text.substring(currentIndex, text.length));

    return fragments;
  }

  render() {
    const { text, matches, fieldName } = this.props;

    // no matches mean we can just return our text
    if (!matches) {
      return (<span>{text}</span>);
    }

    // render the split string if it exists
    // otherwise just return the string itself
    const match = matches.find(m => m.field === fieldName);
    if (match) {
      return (
        <span>
          {this.renderSplitString(text, fieldName, match.offsets)}
        </span>
      );
    } else {
      return (<span>{text}</span>);
    }
  }
}

export default HighlightedResultText;
