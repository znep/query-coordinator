import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import cssModules from 'react-css-modules';
import styles from './list.scss';

class ViewMoreLink extends PureComponent {
  render() {
    const { link, text } = this.props;

    if (!link || !text) {
      return null;
    } else {
      return (
        <div styleName="view-older">
          <a
            styleName="view-older-link"
            href={link}
            target="_blank"
            rel="noopener noreferrer">
            {text}
          </a>
        </div>
      );
    }
  }
}

ViewMoreLink.propTypes = {
  link: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
};

export default cssModules(ViewMoreLink, styles);
