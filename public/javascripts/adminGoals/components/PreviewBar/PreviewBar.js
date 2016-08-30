import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Feedback from '../feedback';
import { SocrataBulkActions } from '../../sections/goals/components';

import './PreviewBar.scss';

class PreviewBar extends React.Component {
  render() {
    const translations = this.props.translations;

    return (
      <div className="preview-bar">
        <div className="preview-bar-header clearfix">
          <div className="back-link icon-arrow-prev">
            <a href={ `${serverConfig.localePrefix}/manage/site_config` }>{ translations.getIn(['admin', 'preview_bar', 'back_to_configuration']) }</a>
          </div>
          <div className="header">
            <span>{ translations.getIn(['admin', 'preview_bar', 'performance_goal_management_preview']) }</span>
            <a href="https://support.socrata.com/hc/en-us/articles/224812107" target="_blank" className="external-link">
              { translations.getIn(['admin', 'preview_bar', 'learn_more']) } <span className="icon-external" />
            </a>
          </div>
          <div className="feedback-link">
            <a onClick={ this.props.openFeedbackFlannel }>{ translations.getIn(['admin', 'preview_bar', 'feedback']) }</a>
          </div>
        </div>
        <div className="actions-header">
          <h1>
            { translations.getIn(['admin', 'manage_performance_goals']) }
          </h1>
          <SocrataBulkActions />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

const mapDispatchToProps = dispatch => ({
  openFeedbackFlannel: event => dispatch(Feedback.Flannel.actions.open(event.target))
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(PreviewBar);
