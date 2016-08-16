import React  from 'react';
import { connect } from 'react-redux';
import { openFeedbackFlannel } from '../../actions/feedbackFlannelActions';
import './PreviewBar.scss';

class PreviewBar extends React.Component {
  render() {
    const translations = this.props.translations;

    return (
      <div className="preview-bar clearfix">
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
    );
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

const mapDispatchToProps = dispatch => ({
  openFeedbackFlannel: event => dispatch(openFeedbackFlannel(event.target))
});

export default connect(mapStateToProps, mapDispatchToProps)(PreviewBar);
