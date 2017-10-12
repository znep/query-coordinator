import classNames from 'classnames/bind';

import * as React from 'react';
import * as Redux from 'redux';
import * as ReactRedux from 'react-redux';
import * as Actions from '../../actions';
import * as State from '../../state';
import * as Selectors from '../../selectors';

class PageSelector extends React.Component {
  constructor(props) {
    super(props);

    this.handleNextPageClicked = this.handleNextPageClicked.bind(this);
    this.handlePreviousPageClicked = this.handlePreviousPageClicked.bind(this);
  }

  handleNextPageClicked() {
    this.props.actions.showPage(this.props.currentPage + 1);
  }

  handlePreviousPageClicked() {
    this.props.actions.showPage(this.props.currentPage - 1);
  }

  render() {
    const { goalsPerPage, currentPage, numberOfPages, totalGoalsCount } = this.props;

    let startOffset = goalsPerPage * currentPage;
    let maxIndex = startOffset + goalsPerPage;
    let endPosition = maxIndex > totalGoalsCount ? totalGoalsCount : maxIndex;

    let prevAvailable = currentPage >= 1;
    let prevProps = { className: classNames('page-change-icon', 'page-previous', 'icon-arrow-left', { disabled: !prevAvailable }) };
    if (prevAvailable) {
      prevProps.onClick = this.handlePreviousPageClicked;
    }

    let nextAvailable = currentPage < numberOfPages - 1;
    let nextProps = { className: classNames('page-change-icon', 'page-previous', 'icon-arrow-right', { disabled: !nextAvailable }) };
    if (nextAvailable) {
      nextProps.onClick = this.handleNextPageClicked;
    }

    const startLabel = startOffset + 1;
    return <div className="page-selector-container">
      <span className="labels">{ `${startLabel} - ${endPosition} ${this.props.translations.getIn(['admin', 'listing', 'of'])} ${ totalGoalsCount }` }</span>
      <span { ...prevProps } />
      <span { ...nextProps } />
    </div>;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  totalGoalsCount: State.getData(state).count(),
  goalsPerPage: State.getPagination(state).get('goalsPerPage'),
  currentPage: State.getPagination(state).get('currentPage'),
  numberOfPages: Selectors.getNumberOfPages(state)
});

const mapDispatchToProps = dispatch => ({
  actions: Redux.bindActionCreators(Actions.UI, dispatch)
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(PageSelector);
