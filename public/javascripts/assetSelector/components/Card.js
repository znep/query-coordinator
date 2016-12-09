import React, { Component, PropTypes } from 'react';
import { ViewCard } from 'socrata-components';

// export const Card = (props) => {
export class Card extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['getCardProps']);
  }

  getCardProps() {
    const data = this.props.data;
    console.log(data);

    return {
      name: data.resource.name,
      description: data.resource.description,
      url: data.link,
      imageUrl: '/images/dataLensThumbnail.png',
      icon: 'socrata-icon-cards',
      // metadataLeft: 'Updated Jan 1, 1970',
      metadataLeft: this.formatDate(data.resource.updatedAt),
      metadataRight: this.formatPopularity(data.resource.view_count.page_views_total),
      // metadataRight: '1,234 views',
      // isPrivate: ,
      linkProps: { target: '_blank' },
      onClick: function(event) {
        console.log(event);
      }
    };
  }

  // Move to helpers
  monthName(index) {
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

    // TODO: Localization.. and a better variable name
    const viewDescription = (viewCount === 1) ? 'view' : 'views';
    return `${numberWithCommas(viewCount)} ${viewDescription}`;
  }

  render() {
    return (
      <div>
        card:
        <ViewCard {...this.getCardProps()} />
      </div>
    );
  }
}

Card.propTypes = {
  data: PropTypes.object.isRequired
};

Card.defaultProps = {
  data: {}
};

export default Card;
