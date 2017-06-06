import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
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
      collapsible,
      collapsed,
      mobile,
      onResultVisibilityChanged,
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
            collapsible={collapsible}
            animate={animate}
            mobile={mobile} />
          <Results collapsible={collapsible} />
        </div>
      );
    }
  }
}

Autocomplete.propTypes = {
  onResultVisibilityChanged: PropTypes.func.isRequired,
  getSearchResults: PropTypes.func.isRequired,
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  collapsible: PropTypes.bool,
  collapsed: PropTypes.bool,
  animate: PropTypes.bool,
  mobile: PropTypes.bool
};

const mapStateToProps = (state) => ({
  collapsed: state.collapsed
});

const mapDispatchToProps = (dispatch) => ({
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Autocomplete, styles));

/** For testing purposes */
export const AutocompleteClass = cssModules(Autocomplete, styles);