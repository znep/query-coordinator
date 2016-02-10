import React from 'react';
import $ from 'jquery';
import './filteritem.scss';
import FlannelUtils from '../../flannel/flannel';

/* eslint-disable */
import SocrataAutocompletefilter from '../autocompletefilter/react.socrata.autocompletefilter';
import SocrataNumberfilter from '../numberfilter/react.socrata.numberfilter';
/* eslint-enable */

class FilterItem extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      label: '(all values)',
      pendingLabel: '',
      pendingData: null,
      isApplicable: false,
      isCorrect: true
    };

    this.onClickFlannelCanvas = this.onClickFlannelCanvas.bind(this);
    this.onClickDeleteFilter = this.onClickDeleteFilter.bind(this);
    this.onClickOpenFlannel = this.onClickOpenFlannel.bind(this);
    this.onClickCloseFlannel = this.onClickCloseFlannel.bind(this);
    this.onClickCancel = this.onClickCancel.bind(this);
    this.onClickApply = this.onClickApply.bind(this);

    this.handleFilterData = this.handleFilterData.bind(this);
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
    FlannelUtils.closeAll();
  }
  onClickApply() {
    if (this.state.isApplicable) {
      this.props.additionHandler(this.props.filter.id, this.state.pendingData );
      this.setState({ label: this.state.pendingLabel });
      FlannelUtils.closeAll();
    }
  }

  handleFilterData(label, data, boolApplicable, boolCorrect) {
    this.setState({
      pendingLabel: label,
      pendingData: data,
      isApplicable: boolApplicable,
      isCorrect: boolCorrect
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
        filter = <SocrataNumberfilter
          key={ 'qf-' + this.props.filter.id }
          componentId={ this.props.filter.id }
          name={ this.props.filter.name }
          labelHandler={ this.handleFilterLabel }
          dataHandler={ this.handleFilterData }
          remoteApply={ this.onClickApply } />;
        break;
      case 'string':
        filter = <SocrataAutocompletefilter
          key={ 'qf-' + this.props.filter.id }
          componentId={ this.props.filter.id }
          domain={ this.props.domain }
          datasetId={ this.props.datasetId }
          dataColumn={ this.props.filter.name }
          dataHandler={ this.handleFilterData } />;
        break;
      case 'datetime':
        break;
      default:
        break;
    }

    var applyButtonClasses = 'qfb-filter-item-flannel-actions-btndone btn btn-primary';
    if (!this.state.isApplicable) { applyButtonClasses += ' disabled'; }

    var warningClasses = 'qfb-filter-item-flannel-actions-warningmessage';
    if (this.state.isCorrect) { warningClasses += ' hidden'; }

    return (
      <div id={ 'qf-' + this.props.filter.id } className="qfb-filter-item">
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
                <i className="icon-warning"></i> Please check your values.
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
