import React from 'react';
import classNames from 'classnames/bind';
import { connect } from 'react-redux';

class Alert extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      label: this.props.label,
      message: this.props.message,
      hidden: true
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      label: nextProps.label,
      message: nextProps.message,
      hidden: false
    });
  }

  clickOnClose() {
    this.setState({
      hidden: true
    });
  }

  render() {
    let alertProps = {
      onClick: this.clickOnClose.bind(this),
      className: classNames('alert', this.state.label, { hidden: this.state.hidden }),
      dangerouslySetInnerHTML: {
        __html: this.state.message ||
          this.props.translations.getIn(['admin', 'listing', 'default_alert_message'])
      }
    };

    return <div { ...alertProps } />;
  }
}

const mapStateToProps = state => ({
  translations: state.get('translations')
});

const mapDispatchToProps = () => ({});

export default connect(mapStateToProps, mapDispatchToProps)(Alert);
