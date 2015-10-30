(() => {
  let componentsNS = blist.namespace.fetch('blist.components');

  componentsNS.socrataTitleTipWrapper = (Component) => {

    return React.createClass({
      displayName: `${Component.displayName}WithTooltip`,
      setupTooltip: function() {
        const node = ReactDOM.findDOMNode(this);
        if (this.props.title) { $(node).socrataTitleTip(); }
      },
      destroyTooltip: function() {
        const node = ReactDOM.findDOMNode(this);
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
        return (<Component {...this.props} />);
      }
    });
  };
})();
