import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

import I18n from 'common/i18n';
import { Radiobutton } from 'common/components';

import connectFlux from 'editor/connectFlux';
import { WIZARD_STEP, assetSelectorStore } from 'editor/stores/AssetSelectorStore';

import Actions from 'editor/Actions';

const CHART = 'measure.chart';
const CARD = 'measure.card';

const scope = 'editor.asset_selector.visualization';

export class ConfigureMeasure extends Component {
  renderHeader() {
    return (
      <div className="modal-header-group">
        <h1 className="modal-title">
          {I18n.t('measure_heading', { scope })}
        </h1>
        <button className="modal-close-btn btn-close">
          <span className="socrata-icon-close-2"></span>
        </button>
      </div>
    );
  }

  renderFooter() {
    return (
      <div className="modal-button-group r-to-l">
        { /* These buttons have delegate handlers in AssetSelectorRenderer. */ }
        { /* The data attribute and .btn-apply is significant to AssetSelectorRenderer. */ }
        <button
          className="btn btn-default back-btn"
          data-resume-from-step={WIZARD_STEP.SELECT_MEASURE_FROM_CATALOG}>
          {I18n.t('editor.modal.buttons.cancel')}
        </button>
        <button className="btn btn-primary btn-apply">
          {I18n.t('editor.asset_selector.insert_button_text')}
        </button>
      </div>
    );
  }

  render() {
    const { componentType, onSetComponentType } = this.props;

    // For now, we only support either the card or the chart (not both).
    const isChart = componentType === CHART;

    const imgClassName = classNames('tile-preview-image', {
      'tile-chart': isChart,
      'tile-card': !isChart
    });

    return (<div className="configure-measure">
      {this.renderHeader()}
      <div className="modal-content">
        <img className={imgClassName} />
        {I18n.t('choose_measure_contents', { scope })}
        <form>
          <Radiobutton
            id="card-radiobutton"
            checked={!isChart}
            onChange={() => onSetComponentType(CARD)}>
            {I18n.t('measure_card', { scope })}
          </Radiobutton>
          <Radiobutton
            id="chart-radiobutton"
            checked={isChart}
            onChange={() => onSetComponentType(CHART)}>
            {I18n.t('measure_visualization', { scope })}
          </Radiobutton>
        </form>
        {this.renderFooter()}
      </div>
    </div>);
  }

  static propTypes = {
    componentType: PropTypes.string,
    onSetComponentType: PropTypes.func.isRequired
  };
}

export default connectFlux(
  { assetSelectorStore },
  (stores) => ({ componentType: stores.assetSelectorStore.getComponentType() }),
  (dispatch) => ({
    onSetComponentType: (type) => {
      dispatch({
        action: Actions.ASSET_SELECTOR_UPDATE_COMPONENT_TYPE,
        type
      });
    }
  })
)(ConfigureMeasure);
