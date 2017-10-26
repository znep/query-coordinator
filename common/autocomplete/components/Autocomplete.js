import React from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';

import { getBrowseUrl } from '../Util';
import { resultVisibilityChanged } from '../actions';
import CollapsedIcon from './CollapsedIcon';
import SearchBox from './SearchBox/SearchBox';
import Results from './Results/Results';
import styles from './autocomplete.scss';

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.state = { autocomplete: { query: props.currentQuery } };

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(event) {
    // hide results on escape
    if (event.keyCode === 27) {
      this.props.onResultVisibilityChanged(false);
    }
  }

  render() {
    const {
      animate,
      anonymous,
      className,
      collapsed,
      collapsible,
      currentQuery,
      getSearchResults,
      millisecondsBeforeSearch,
      mobile,
      adminHeaderClasses,
      onChooseResult,
      onClearSearch,
      onResultVisibilityChanged,
      renderResult
    } = this.props;

    if (collapsible && collapsed) {
      return <CollapsedIcon adminHeaderClasses={adminHeaderClasses} />;
    }

    return (
      <div
        className={className}
        styleName="container"
        tabIndex="-1"
        onFocus={() => onResultVisibilityChanged(true)}
        onBlur={() => onResultVisibilityChanged(false)}>
        <SearchBox
          animate={animate}
          anonymous={anonymous}
          collapsible={collapsible}
          getSearchResults={getSearchResults}
          millisecondsBeforeSearch={millisecondsBeforeSearch}
          mobile={mobile}
          onChooseResult={onChooseResult}
          onClearSearch={onClearSearch}
          query={currentQuery}
          adminHeaderClasses={adminHeaderClasses} />
        <Results
          collapsible={collapsible}
          onChooseResult={onChooseResult}
          renderResult={renderResult} />
      </div>
    );
  }
}

Autocomplete.propTypes = {
  animate: PropTypes.bool,
  anonymous: PropTypes.bool,
  className: PropTypes.string,
  collapsed: PropTypes.bool,
  collapsible: PropTypes.bool,
  currentQuery: PropTypes.string,
  getSearchResults: PropTypes.func.isRequired,
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  mobile: PropTypes.bool,
  adminHeaderClasses: PropTypes.array,
  onChooseResult: PropTypes.func,
  onClearSearch: PropTypes.func,
  onResultVisibilityChanged: PropTypes.func.isRequired,
  renderResult: PropTypes.func
};

Autocomplete.defaultProps = {
  onChooseResult: (name) => { window.location.href = getBrowseUrl(name); },
  collapsible: false,
  collapsed: false,
  adminHeaderClasses: []
};

const mapStateToProps = (state) => ({ collapsed: state.autocomplete.collapsed });

const mapDispatchToProps = (dispatch) => ({
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Autocomplete, styles));

// Used by platform-ui/common/spec/autocomplete/components/Autocomplete.spec.js
export const AutocompleteClass = cssModules(Autocomplete, styles);
