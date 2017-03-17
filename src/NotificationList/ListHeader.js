import React, { PropTypes, PureComponent } from 'react';
import cssModules from 'react-css-modules';
import styles from './list.scss';
import SocrataLogo from '../SocrataLogo';

class ListHeader extends PureComponent {
  render() {
    const { text } = this.props;

    return (
      <div styleName="header">
        <SocrataLogo />
        <span>
          {text}
        </span>
      </div>
    );
  }
}

ListHeader.propTypes = {
  text: PropTypes.string.isRequired
};

export default cssModules(ListHeader, styles);
