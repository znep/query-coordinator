import React, { PropTypes } from 'react';
import Flyout from './Flyout';
import _ from 'lodash';

export class VisibilityIcon extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'getLocale', 'renderFlyoutParagraph', 'renderVisibilityIcon');
  }

  getLocale(key) {
    return _.get(I18n, `result_list_table.visibility_flyout.${key}`);
  }

  flyoutSectionClass(sectionIsVisible) {
    return sectionIsVisible ? 'green' : 'red';
  }

  renderVisibilityIcon() {
    const { visibleToAnonymous } = this.props;
    const iconClass = visibleToAnonymous ? 'socrata-icon-geo' : 'socrata-icon-private';
    const iconAltText = this.getLocale(visibleToAnonymous ? 'open' : 'internal');

    return <span alt={iconAltText} className={iconClass} />;
  }

  renderFlyoutSections() {
    const { isDataLensApproved, isHidden, isModerationApproved, isPublic, isPublished,
      isRoutingApproved } = this.props;

    const dataLensSection = _.isBoolean(isDataLensApproved) ?
      (<li className={this.flyoutSectionClass(isDataLensApproved)}>
        {this.getLocale(`datalens_approved.${isDataLensApproved}`)}
      </li>) : null;

    const moderationSection = _.isBoolean(isModerationApproved) ?
      (<li className={this.flyoutSectionClass(isModerationApproved)}>
        {this.getLocale(`moderation_approved.${isModerationApproved}`)}
      </li>) : null;

    const routingApprovalSection = _.isBoolean(isRoutingApproved) ?
      (<li className={this.flyoutSectionClass(isRoutingApproved)}>
        {this.getLocale(`routing_approved.${isRoutingApproved}`)}
      </li>) : null;

    return (
      <ul>
        <li className={this.flyoutSectionClass(!isHidden)}>
          {this.getLocale(`hidden.${isHidden}`)}
        </li>
        <li className={this.flyoutSectionClass(isPublic)}>
          {this.getLocale(`public.${isPublic}`)}
        </li>
        <li className={this.flyoutSectionClass(isPublished)}>
          {this.getLocale(`published.${isPublished}`)}
        </li>
        {/* The following sections are shown conditionally if we are given a value for them from Cetera. */}
        {dataLensSection}
        {moderationSection}
        {routingApprovalSection}
      </ul>
    );
  }

  renderFlyoutParagraph() {
    const flyoutTitle = this.getLocale(this.props.visibleToAnonymous ? 'open' : 'internal');

    return (
      <div>
        <span className="title">
          {this.renderVisibilityIcon()}
          <strong>{flyoutTitle}</strong>
        </span>
        {this.renderFlyoutSections()}
      </div>
    );
  }

  render() {
    return (
      <Flyout left text={this.renderFlyoutParagraph()}>
        {this.renderVisibilityIcon()}
      </Flyout>
    );
  }
}

VisibilityIcon.propTypes = {
  isDataLensApproved: PropTypes.bool,
  isHidden: PropTypes.bool,
  isModerationApproved: PropTypes.bool,
  isPublic: PropTypes.bool.isRequired,
  isPublished: PropTypes.bool.isRequired,
  isRoutingApproved: PropTypes.bool,
  visibleToAnonymous: PropTypes.bool.isRequired
};

export default VisibilityIcon;
