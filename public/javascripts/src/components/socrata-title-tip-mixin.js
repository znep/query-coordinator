(() => {

  let componentsNS = blist.namespace.fetch('blist.components');

  componentsNS.socrataTitleTipMixin = {
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
    }
  };

})();
