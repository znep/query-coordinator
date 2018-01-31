import _ from 'lodash';

// Control to load Zendesk only once.
let loaded = false;

// One-time setup options.
let locale = null;
let user = null;

// Script loader provided by Zendesk.
function loadAsyncScript() {
  window.zEmbed||function(e,t){var n,o,d,i,s,a=[],r=document.createElement("iframe");window.zEmbed=function(){a.push(arguments)},window.zE=window.zE||window.zEmbed,r.src="javascript:false",r.title="",r.role="presentation",(r.frameElement||r).style.cssText="display: none",d=document.getElementsByTagName("script"),d=d[d.length-1],d.parentNode.insertBefore(r,d),i=r.contentWindow,s=i.document;try{o=s}catch(c){n=document.domain,r.src='javascript:var d=document.open();d.domain="'+n+'";void(0);',o=s}o.open()._l=function(){var o=this.createElement("script");n&&(this.domain=n),o.id="js-iframe-async",o.src=e,this.t=+new Date,this.zendeskHost=t,this.zEQueue=a,this.body.appendChild(o)},o.write('<body onload="document._l();">'),o.close()}("https://assets.zendesk.com/embeddable_framework/main.js","socrata.zendesk.com"); // eslint-disable-line
  window.zE(function() { window.zE.setLocale(locale); }); // must happen here, must be wrapped with zE
}

// Export the locked-down loader.
function activate() {
  if (!loaded) {
    console.error('Attempted to open Zendesk without initialization!');
  } else {
    window.zE.identify(user);
    window.zE.activate({
      hideOnClose: true
    });
  }
}

function init(options) {
  if (!loaded) {
    options = options || {};
    locale = options.locale;

    if (_.isPlainObject(options.user)) {
      user = _.pick(options.user, ['id', 'email', 'name', 'displayName', 'screenName']);
      user.name = user.name || user.displayName || user.screenName;
      delete user.displayName;
      delete user.screenName;
    }

    loadAsyncScript();
    loaded = true;
  }
}

export default { activate, init };

