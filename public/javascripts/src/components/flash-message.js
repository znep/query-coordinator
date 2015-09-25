(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');

  const FlashMessagePropType = PropTypes.shape({
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['notice', 'error', 'warning']).isRequired
  });

  componentsNS.FlashMessage = React.createClass({
    displayName: 'FlashMessage',
    propTypes: {
      messages: PropTypes.arrayOf(FlashMessagePropType)
    },
    getDefaultProps: function() {
      return {
        messages: []
      };
    },
    render: function() {
      const messages = _.map(this.props.messages, ({ message, type }, index) => {
        const className = _.compact(['flash', type]).join(' ');
        return (
          <div key={index} className={className}>{message}</div>
        )
      });
      return (
        <div>{messages}</div>
      );
    }
  });

})();
