import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { getSearchUrl } from '../Util';
import { searchCleared, resultVisibilityChanged } from '../actions';
import CollapsedIcon from './CollapsedIcon';
import SearchBox from './SearchBox/SearchBox';
import Results from './Results/Results';
import styles from './autocomplete.scss';

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown(event) {
    // hide results on esc
    if (event.keyCode === 27) {
      this.props.onResultVisibilityChanged(false);
    }
  }

  render() {
    const {
      animate,
      anonymous,
      collapsed,
      collapsible,
      getSearchResults,
      millisecondsBeforeSearch,
      mobile,
      onChooseResult,
      onClearSearch,
      onResultVisibilityChanged
    } = this.props;

    if (collapsible && collapsed) {
      return <CollapsedIcon />;
    } else {
      return (
        <div
          styleName="container"
          tabIndex="-1"
          onFocus={() => { onResultVisibilityChanged(true); }}
          onBlur={() => { onResultVisibilityChanged(false); }} >
          <SearchBox
            animate={animate}
            anonymous={anonymous}
            collapsible={collapsible}
            getSearchResults={getSearchResults}
            millisecondsBeforeSearch={millisecondsBeforeSearch}
            mobile={mobile}
            onChooseResult={onChooseResult}
            onClearSearch={onClearSearch} />
          <Results collapsible={collapsible} onChooseResult={onChooseResult} />
        </div>
      );
    }
  }
}

Autocomplete.propTypes = {
  animate: PropTypes.bool,
  anonymous: PropTypes.bool,
  collapsed: PropTypes.bool,
  collapsible: PropTypes.bool,
  getSearchResults: PropTypes.func.isRequired,
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  mobile: PropTypes.bool,
  onChooseResult: PropTypes.func,
  onClearSearch: PropTypes.func,
  onResultVisibilityChanged: PropTypes.func.isRequired
};

Autocomplete.defaultProps = {
  onChooseResult: (name) => { window.location.href = getSearchUrl(name); }
}

const mapStateToProps = (state) => ({
  collapsed: state.collapsed
});

const mapDispatchToProps = (dispatch) => ({
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Autocomplete, styles));

/** For testing purposes */
export const AutocompleteClass = cssModules(Autocomplete, styles);
