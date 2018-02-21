import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import I18n from 'common/i18n';
import { Flannel, FlannelContent, FlannelHeader } from 'common/components/Flannel';
import { RateAggregationTypes } from 'common/performance_measures/lib/constants';

import { setActivePanel } from '../../actions/editor';
import { EditTabs } from '../../lib/constants';
import validateConfiguration from '../../lib/validateConfiguration';

const scope = 'open_performance.measure.edit_modal.configuration_notice';

// Helper to provide error translations for each error case, by group and key.
const flannelDetail = (group, key) => (
  I18n.t(`flannel.${_.snakeCase(group)}.${_.snakeCase(key)}`, { scope })
);

// An inline notice and pop-up flannel for any incomplete or misconfigured parts
// of the measure.
export class ConfigurationNotice extends Component {
  state = {
    flannelOpen: false
  }

  toggleFlannel = (event) => {
    event.preventDefault();

    this.setState({ flannelOpen: !this.state.flannelOpen });
  }

  closeFlannel = (event) => {
    // We don't want the Escape key to close the enclosing modal.
    event.stopPropagation();

    this.setState({ flannelOpen: false });
  }

  renderDetails(validationSet) {
    if (!this.state.flannelOpen) {
      return null;
    }

    const flannelProps = {
      id: 'configuration-notice-flannel',
      className: 'configuration-notice-flannel',
      target: () => this.flannelTarget,
      title: I18n.t('flannel.title', { scope }),
      onDismiss: this.closeFlannel
    };

    const flannelHeaderProps = {
      title: I18n.t('flannel.title', { scope }),
      onDismiss: this.closeFlannel
    };

    // NOTE: We'll never actually show all three of these sections, because of
    // the subset selected early in the main render function.
    return (
      <Flannel {...flannelProps}>
        <FlannelHeader {...flannelHeaderProps} />
        <FlannelContent>
          {this.renderDetailsGroup(validationSet, EditTabs.DATA_SOURCE)}
          {this.renderDetailsGroup(validationSet, EditTabs.REPORTING_PERIOD)}
          {this.renderDetailsGroup(validationSet, EditTabs.CALCULATION)}
        </FlannelContent>
      </Flannel>
    );
  }

  renderDetailsGroup(validationSet, group) {
    const possibleErrors = validationSet[_.camelCase(group)];
    const errors = _.chain(possibleErrors).pickBy().keys().value();

    // Don't show sections when no error cases for that section exist.
    if (_.isEmpty(errors)) {
      return null;
    }

    // Handler for "Take me there" link
    const onSectionClick = (event) => {
      event.preventDefault();
      this.props.onSectionClick(event.target.hash.replace('#', ''));
    };

    return (
      <div key={group} className="configuration-notice-flannel-details">
        <h6>
          {I18n.t(`open_performance.measure.edit_modal.${_.snakeCase(group)}.tab_title`)}
          <a href={`#${group}`} onClick={onSectionClick}>
            {I18n.t('flannel.take_me_there', { scope })}
          </a>
        </h6>
        {_.map(errors, (key) => (<p key={key}>{flannelDetail(group, key)}</p>))}
      </div>
    );
  }

  render() {
    const { validation } = this.props;

    // Don't render if everything is fine.
    if (_(validation).flatMapDeep(_.values).compact().size() === 0) {
      return null;
    }

    // Data Source errors need to be rectified before addressing errors in the
    // Reporting Period or Calculation sections.
    let validationSet;
    let noticeKey;
    if (_.some(validation.dataSource)) {
      validationSet = _.pick(validation, 'dataSource');
      noticeKey = 'data_source_notice';
    } else {
      validationSet = _.omit(validation, 'dataSource');

      if (!_.some(validation.reportingPeriod)) {
        noticeKey = 'calculation_notice';
      } else if (!_.some(validation.calculation)) {
        noticeKey = 'reporting_period_notice';
      } else {
        noticeKey = 'reporting_period_and_calculation_notice';
      }
    }

    // TODO: add once we have a support link to show.
    /*
    const supportLink = (
      <a href="#" target="_blank" className="configuration-notice-support-link">
        <SocrataIcon name="question" />
      </a>
    );
    */

    return (
      <div className="configuration-notice">
        <span>
          {I18n.t(noticeKey, { scope })}
        </span>
        {' '}
        <a href="#" onClick={this.toggleFlannel} ref={ref => this.flannelTarget = ref}>
          {I18n.t('see_tasks', { scope })}
        </a>

        {this.renderDetails(validationSet)}
      </div>
    );
  }
}

ConfigurationNotice.defaultProps = {
  validation: {
    calculation: {},
    dataSource: {},
    reportingPeriod: {}
  }
};

ConfigurationNotice.propTypes = {
  validation: PropTypes.shape({
    calculation: PropTypes.object.isRequired,
    dataSource: PropTypes.object.isRequired,
    reportingPeriod: PropTypes.object.isRequired
  }).isRequired,
  onSectionClick: PropTypes.func.isRequired
};

export function mapStateToProps(state) {
  const { dataSourceView, displayableFilterableColumns, measure } = state.editor;

  const validation = validateConfiguration(
    _.get(measure, 'metricConfig'),
    dataSourceView,
    displayableFilterableColumns
  );

  // Because of the way we message the Reporting Period errors, we don't need to
  // warn about missing period size if the period type is also missing.
  if (validation.reportingPeriod.noPeriodType) {
    validation.reportingPeriod.noPeriodSize = false;
  }

  // If there aren't any numeric columns, don't prompt to select one.
  if (validation.calculation.noNumericColumn) {
    validation.calculation.noRecentValueColumn = false;
    validation.calculation.noSumColumn = false;

    if (_.get(measure, 'metricConfig.arguments.aggregationType') === RateAggregationTypes.SUM) {
      validation.calculation.noNumeratorColumn = false;
      validation.calculation.noDenominatorColumn = false;
    }
  }

  return { validation };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onSectionClick: setActivePanel
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigurationNotice);
