import * as React  from 'react';
import * as ReactRedux from 'react-redux';
import * as Feedback from '../feedback';
import { SocrataBulkActions } from '../../sections/goals/components';
import SocrataAlert from '../SocrataAlert';

import './PreviewBar.scss';

class PreviewBar extends React.Component {
  render() {
    const { notification, translations, onDismissNotification } = this.props;

    let alert = null;
    if (notification.get('visible')) {
      alert = <SocrataAlert type={ notification.get('type') }
                                        message={ notification.get('message') }
                                        onDismiss={ onDismissNotification }/>;
    }

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
          { alert }
          <SocrataBulkActions />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations'),
  notification: state.get('notification')
});

const mapDispatchToProps = dispatch => ({
  onDismissNotification: () => dispatch(Actions.notifications.dismissNotification()),
  openFeedbackFlannel: event => dispatch(Feedback.Flannel.actions.open(event.target))
});

export default ReactRedux.connect(mapStateToProps, mapDispatchToProps)(PreviewBar);
