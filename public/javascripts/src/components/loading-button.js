(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { socrataTitleTipWrapper } = componentsNS;
  const { classNames } = blist.namespace.fetch('blist.components.utils');

  componentsNS.LoadingButton = socrataTitleTipWrapper(React.createClass({
    displayName: 'LoadingButton',
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
      let className = classNames(
        'button',
        { disabled }
      );
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
  }));

})();
