(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');

  componentsNS.LoadingButton = React.createClass({
    displayName: 'LoadingButton',
    propTypes: {
      children: PropTypes.string.isRequired,
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
    setupTooltip: function() {
      const node = React.findDOMNode(this);
      if (this.props.title) { $(node).socrataTitleTip(); }
    },
    destroyTooltip: function() {
      const node = React.findDOMNode(this);
      const socrataTip = $(node).removeAttr('bt-xtitle').data('socrataTip');
      if (socrataTip) { socrataTip.destroy(); }
    },
    componentDidMount: function() {
      this.setupTooltip();
    },
    componentWillUpdate: function() {
      this.destroyTooltip();
    },
    componentDidUpdate: function() {
      this.setupTooltip();
    },
    componentWillUnmount: function() {
      this.destroyTooltip();
    },
    render: function() {
      const { isLoading, children, disabled, ...props } = this.props;
      let className = _.compact(['button', disabled ? 'disabled' : null]).join(' ');
      let spinnerStyle = { display: 'none' };
      let labelStyle = {};
      if (isLoading) {
        labelStyle = { visibility: 'hidden' };
        spinnerStyle = {
          backgroundColor: 'transparent',
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
          display: 'block',
          textAlign: 'left',
          backgroundImage: 'url(/stylesheets/images/content/snuffleupasnake.gif)',
          height: '16px',
          width: '16px',
          position: 'absolute',
          top: 'calc(50% - 8px)',
          left: 'calc(50% - 8px)'
        };
      }
      return (
        <button
          className={className}
          name="commit"
          onClick={(event) => { if(disabled) event.preventDefault(); }}
          style={{ position: 'relative' }}
          {...props}>
          <span style={labelStyle}>{children}</span>
          <span className="loading" style={spinnerStyle}></span>
        </button>
      );
    }
  });

})();
