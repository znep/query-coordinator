import _ from 'lodash';
import React from 'react';
import ViewCard from '../ViewCard';
import { translate } from 'common/I18n';

const ExternalViewCard = function(props) {
  let linkProps = _.defaults({}, props.linkProps, {
    target: '_blank',
    rel: 'nofollow external'
  });

  return (
    <ViewCard
      icon="socrata-icon-external-square"
      metadataLeft={translate('view_card.external_content')}
      {...props}
      linkProps={linkProps}>
      {props.children}
    </ViewCard>
  );
};

ExternalViewCard.propTypes = ViewCard.propTypes;

export default ExternalViewCard;
