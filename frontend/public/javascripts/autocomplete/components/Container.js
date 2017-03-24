import React, { PropTypes } from 'react';
import cssModules from 'react-css-modules';
import { connect } from 'react-redux';
import { ESCAPE } from 'socrata-components/common/keycodes';
import { resultVisibilityChanged } from '../actions';
import CollapsedIcon from './CollapsedIcon';
import SearchBox from './SearchBox/SearchBox';
import Results from './Results/Results';
import styles from './autocomplete.scss';

class Container extends React.Component {
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
    if (event.keyCode === ESCAPE) {
      this.props.onResultVisibilityChanged(false);
    }
  }

  render() {
    const {
      animate,
      collapsible,
      collapsed,
      onResultVisibilityChanged,
      getResults,
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
            getResults={getResults}
            millisecondsBeforeSearch={millisecondsBeforeSearch}
            collapsible={collapsible}
            animate={animate} />
          <Results collapsible={collapsible} />
        </div>
      );
    }
  }
}

Container.propTypes = {
  onResultVisibilityChanged: PropTypes.func.isRequired,
  millisecondsBeforeSearch: PropTypes.number.isRequired,
  getResults: PropTypes.func.isRequired,
  collapsible: PropTypes.bool,
  collapsed: PropTypes.bool,
  animate: PropTypes.bool
};

const mapStateToProps = (state) => ({
  collapsed: state.collapsed
});

const mapDispatchToProps = (dispatch) => ({
  onResultVisibilityChanged: (visible) => { dispatch(resultVisibilityChanged(visible)); }
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(Container, styles));

/** For testing purposes */
export const ContainerClass = cssModules(Container, styles);
