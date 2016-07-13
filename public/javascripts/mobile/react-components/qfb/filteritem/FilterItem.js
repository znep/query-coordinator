import _ from 'lodash';
import React from 'react';
import $ from 'jquery';
import './filteritem.scss';
import FlannelUtils from '../../flannel/flannel';

/* eslint-disable */
import SocrataAutocompletefilter from '../autocompletefilter/react.socrata.autocompletefilter';
import SocrataNumberfilter from '../numberfilter/react.socrata.numberfilter';
import SocrataRangefilter from '../rangefilter/react.socrata.rangefilter';
import SocrataDatefilter from '../datefilter/react.socrata.datefilter';
/* eslint-enable */

class FilterItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      label: '(all values)',
      pendingLabel: '',
      pendingData: null,
      isApplicable: false,
      isCorrect: true,
      showWarning: false,
      warningText: null
    };

    this.filterChanged = 0;

    this.onClickFlannelCanvas = this.onClickFlannelCanvas.bind(this);
    this.onClickDeleteFilter = this.onClickDeleteFilter.bind(this);
    this.onClickOpenFlannel = this.onClickOpenFlannel.bind(this);
    this.onClickCloseFlannel = this.onClickCloseFlannel.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickApply = this.onClickApply.bind(this);

    this.handleKeyboardEvents = this.handleKeyboardEvents.bind(this);

    this.handleFilterData = this.handleFilterData.bind(this);
    this.handleFilterLabel = this.handleFilterLabel.bind(this);
    this.handleWarning = this.handleWarning.bind(this);
  }

  componentDidMount() {
    if (this.props.startWithClosedFlannel) {
      FlannelUtils.closeAll();
    }
  }

  onClickFlannelCanvas(e) {
    e.stopPropagation();
    if ($(e.target).is('.qfb-filter-item-flannel')) {
      FlannelUtils.closeAll();
    }
  }

  onClickDeleteFilter(e) {
    e.stopPropagation();
    this.props.deletionHandler(this.props.filter.id);
  }

  onClickOpenFlannelFromSummary() {
    FlannelUtils.openFlannelForId(this.props.filter.id);
  }

  onClickOpenFlannel() {
    FlannelUtils.openFlannelForId(this.props.filter.id);
  }

  onClickCloseFlannel() {
    FlannelUtils.closeAll();
  }

  onClickCancel() {
    if (this.filterChanged === 0) {
      this.props.deletionHandler(this.props.filter.id);
    }

    FlannelUtils.closeAll();
  }

  handleKeyboardEvents(e) {
    if (e.keyCode == 13) {
      if (this.state.isApplicable) {
        this.props.additionHandler(this.props.filter.id, this.state.pendingData);
        this.setState({ label: this.state.pendingLabel });
        FlannelUtils.closeAll();
      }
    }
  }

  onClickApply() {
    if (this.state.isApplicable) {
      this.props.additionHandler(this.props.filter.id, this.state.pendingData);
      this.setState({ label: this.state.pendingLabel });
      FlannelUtils.closeAll();
    }
  }

  handleFilterData(label, data, boolApplicable, boolCorrect) {
    this.filterChanged++;

    this.setState({
      pendingLabel: label,
      pendingData: data,
      isApplicable: boolApplicable,
      isCorrect: boolCorrect
    });
  }

  handleWarning(isVisible, warningMessage) {
    this.setState({
      showWarning: isVisible,
      warningText: warningMessage
    });

    if (isVisible) {
      this.setState({
        isCorrect: false,
        isApplicable: false
      });
    } else {
      this.setState({
        isCorrect: true,
        isApplicable: true
      });
    }
  }

  handleFilterLabel(label) {
    this.setState({
      label: label
    });
  }

  render() {
    var filter;

    switch (this.props.filter.type) {
      case 'bool':
      case 'binary':
        break;
      case 'float':
      case 'int':
        if (this.props.isLarge) {
          filter = <SocrataRangefilter
            key={ 'qf-{0}'.format(this.props.filter.id) }
            type={ this.props.filter.type }
            componentId={ this.props.filter.id }
            name={ this.props.filter.name }
            isLarge={ true }
            scale={ this.props.filter.scale }
            dataHandler={ this.handleFilterData }/>;
        } else {
          var rangeMin = Number(_.head(this.props.filter.scale));
          var rangeMax = Number(_.last(this.props.filter.scale));

          filter = <SocrataRangefilter
            key={ 'qf-{0}'.format(this.props.filter.id) }
            type={ this.props.filter.type }
            componentId={ this.props.filter.id }
            name={ this.props.filter.name }
            isLarge={ false }
            rangeMin={ rangeMin }
            rangeMax={ rangeMax }
            warningHandler={ this.handleWarning }
            dataHandler={ this.handleFilterData }/>;
        }
        break;
      case 'string':
        filter = <SocrataAutocompletefilter
          key={ 'qf-{0}'.format(this.props.filter.id) }
          componentId={ this.props.filter.id }
          domain={ this.props.domain }
          datasetId={ this.props.datasetId }
          dataColumn={ this.props.filter.name }
          data={ this.props.filter.data || [] }
          labelHandler={ this.handleFilterLabel }
          dataHandler={ this.handleFilterData } />;
        break;
      case 'calendar_date':
        filter = <SocrataRangefilter
          key={ 'qf-{0}'.format(this.props.filter.id) }
          type={ this.props.filter.type }
          componentId={ this.props.filter.id }
          name={ this.props.filter.name }
          isLarge={ this.props.isLarge }
          scale={ this.props.filter.scale }
          warningHandler={ this.handleWarning }
          dataHandler={ this.handleFilterData }/>;
        break;
      default:
        break;
    }

    var applyButtonClasses = 'qfb-filter-item-flannel-actions-btndone btn btn-primary';
    if (!this.state.isApplicable) { applyButtonClasses += ' disabled'; }

    var warningClasses = 'qfb-filter-item-flannel-actions-warningmessage';
    if (!this.state.showWarning) { warningClasses += ' hidden'; }

    return (
      <div id={ 'qf-{0}'.format(this.props.filter.id) } className="qfb-filter-item" onKeyDown={ this.handleKeyboardEvents }>
        <div className="qfb-filter-item-main">
          <button className="qfb-filter-item-mobile-btn visible-xs" onClick={ this.onClickDeleteFilter }>
            <i className="icon-close-circle"></i>
          </button>
          <div className="qfb-filter-item-main-group-2">
            <h3 className="qfb-filter-item-main-title">{ this.props.filter.displayName }</h3>
            <div className="qfb-filter-item-main-summary" onClick={ this.onClickOpenFlannel }>
              <i className="qfb-filter-item-main-summary-delete icon-close-circle hidden-xs"
                title="Clear filter"
                onClick={ this.onClickDeleteFilter }></i>
              <span className="qfb-filter-item-main-summary-value">{ this.state.label }</span>
              <i className="qfb-filter-item-main-summary-btnshowdetails icon-arrow-down hidden-xs"></i>
            </div>
          </div>
          <div className="qfb-filter-item-mobile-btn visible-xs" onClick={ this.onClickOpenFlannel }>
            <i className="icon-edit"></i>
          </div>
        </div>
        <div className="qfb-filter-item-flannel" onClick={ this.onClickFlannelCanvas }>
          <div className="qfb-filter-item-flannel-content">
            <div className="qfb-filter-item-flannel-triangle"></div>
            <i className="qfb-filter-item-flannel-btnclose icon-close" onClick={ this.onClickCloseFlannel }></i>
            <h3 className="qfb-filter-item-flannel-title">Filter: <b>{ this.props.filter.displayName }</b></h3>
            { filter }
            <div className="qfb-filter-item-flannel-actions">
              <p className={ warningClasses }>
                <i className="icon-warning"></i> { this.state.warningText }
              </p>
              <button className="qfb-filter-item-flannel-actions-btncancel btn btn-link"
                onClick={ this.onClickCancel }>Cancel</button>
              <div className={ applyButtonClasses } onClick={ this.onClickApply }>Apply</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

FilterItem.propTypes = {
  filter: React.PropTypes.object.isRequired,
  deletionHandler: React.PropTypes.func.isRequired,
  additionHandler: React.PropTypes.func.isRequired
};

export default FilterItem;