import _ from 'lodash';
import React from 'react';
import ViewCard from '../ViewCard';
import I18n from 'common/i18n';

const ExternalViewCard = function(props) {
  let linkProps = _.defaults({}, props.linkProps, {
    target: '_blank',
    rel: 'nofollow external'
  });

  return (
    <ViewCard
      icon="socrata-icon-external-square"
      metadataLeft={I18n.t('shared.components.view_card.external_content')}
      {...props}
      linkProps={linkProps}>
      {props.children}
    </ViewCard>
  );
};

ExternalViewCard.propTypes = ViewCard.propTypes;

export default ExternalViewCard;
