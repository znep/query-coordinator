(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');

  componentsNS.LoadingButton = React.createClass({
    displayName: 'LoadingButton',
    mixins: [ componentsNS.socrataTitleTipMixin ],
    propTypes: {
      children: PropTypes.string,
      disabled: PropTypes.bool,
      isLoading: PropTypes.bool,
      type: PropTypes.oneOf(['button', 'submit', 'reset'])
    },
    getDefaultProps: function() {
      return {
        disabled: false,
        isLoading: false,
        type: 'button'
      };
    },
    render: function() {
      const { isLoading, children, disabled, ...props } = this.props;
      let className = _.compact([
        'button',
        disabled ? 'disabled' : null
      ]).join(' ');
      let spinnerStyle = { display: 'none' };
      let labelStyle = {};
      if (isLoading) {
        labelStyle = { visibility: 'hidden' };
        spinnerStyle = { display: 'block' };
      }
      return (
        <button
          className={className}
          name="commit"
          onClick={(event) => { if(disabled) event.preventDefault(); }}
          {...props}>
          <span style={labelStyle}>{children}</span>
          <span className="loading" style={spinnerStyle}></span>
        </button>
      );
    }
  });

})();
