import React, { Component, PropTypes } from 'react';
import { ViewCard } from 'socrata-components';
import { getIconClassForDisplayType } from 'socrata-components/common/displayTypeMetadata';

export class Card extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['getCardProps']);
  }

  getCardProps() {
    const data = this.props.data;
    console.log(data);

    return {
      name: data.name,
      description: data.description,
      url: data.link,
      icon: getIconClassForDisplayType(data.type),
      metadataLeft: this.formatDate(data.updated_at), // TODO - use viewCardHelpers methods.. will need to refactor them to not require I18n
      metadataRight: this.formatPopularity(data.view_count),
      imageUrl: data.preview_image_url,
      isPrivate: !data.is_public,
      linkProps: {
        target: '_blank',
        'aria-label': this.getAriaLabel(data)
      },
      onClick: function(event) {
        console.log(event);
      }
    };
  }

  // Move to helpers?
  getAriaLabel(view) {
    return `${view.name} | ${view.type}`;
  }

  monthName(index) {
    // TODO: Localization
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const month = this.monthName(date.getMonth());
    const day = date.getDate();
    const year = date.getFullYear();

    // TODO: Localization
    return `Updated ${month} ${day}, ${year}`;
  }

  formatPopularity(viewCount) {
    const numberWithCommas = (number) => {
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // TODO: Localization
    const viewDescription = (viewCount === 1) ? 'view' : 'views';
    return `${numberWithCommas(viewCount)} ${viewDescription}`;
  }

  render() {
    return <ViewCard {...this.getCardProps()} />;
  }
}

Card.propTypes = {
  data: PropTypes.object.isRequired
};

Card.defaultProps = {
  data: {}
};

export default Card;
