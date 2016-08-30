;(function(){
// This model isn't yet useful because domains are not generally accessible from the frontend.
// This may be useful for server-side JS
var Domain = ServerModel.extend({
    _init: function (d)
    {
        this._super();

        $.extend(this, d);
        this._updateProperties();
    },

    isModuleAvailable: function(module)
    {
        return this._availableModules[module];
    },

    _updateProperties: function()
    {
        var dObj = this;
        dObj._availableModules = {};
        _.each((dObj.accountModules || []).concat(dObj.accountTier.accountModules), function(am)
        { dObj._availableModules[am.name] = true; });
    }
});

Domain._cachedDomains = {};

Domain.find = function(hostname, successCallback, errorCallback)
{
    var hostKey = $.isBlank(hostname) ? 1 : hostname;
    if (Domain._cachedDomains.hasOwnProperty(hostKey))
    {
        successCallback(Domain._cachedDomains[hostKey]);
        return;
    }

    $.socrataServer.makeRequest({ pageCache: true, url: '/api/domains' +
        ($.isBlank(hostname) ? '' : '/' + hostname) + '.json',
        success: function(result)
        {
            Domain._cachedDomains[hostKey] = new Domain(result);
            if (_.isFunction(successCallback))
            { successCallback(Domain._cachedDomains[hostKey]); }
        }, error: errorCallback});
};

if (blist.inBrowser)
{ this.Domain = Domain; }
else
{ module.exports = Domain; }

})();
