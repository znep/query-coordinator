import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { getSearchUrl } from '../Util';
import { resultVisibilityChanged } from '../actions';
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
      collapsible,
      collapsed,
      mobile,
      onResultVisibilityChanged,
      onChooseResult,
      getSearchResults,
      millisecondsBeforeSearch
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
            getSearchResults={getSearchResults}
            millisecondsBeforeSearch={millisecondsBeforeSearch}
            anonymous={anonymous}
            collapsible={collapsible}
            animate={animate}
            mobile={mobile}
            onChooseResult={onChooseResult} />
          <Results collapsible={collapsible} onChooseResult={onChooseResult} />
        </div>
      );
    }
  }
}

Autocomplete.propTypes = {
  onResultVisibilityChanged: PropTypes.func.isRequired,
  getSearchResults: PropTypes.func.isRequired,
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  anonymous: PropTypes.bool,
  collapsible: PropTypes.bool,
  collapsed: PropTypes.bool,
  animate: PropTypes.bool,
  mobile: PropTypes.bool,
  onChooseResult: PropTypes.func
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
