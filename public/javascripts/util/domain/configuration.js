;(function(){
var Configuration = ServerModel.extend({
    _init: function (c)
    {
        this._super();

        $.extend(this, c);
        this._translateProperties();
    },

    _translateProperties: function()
    {
        var conf = this;
        if ($.isBlank(conf.rawProperties) && !$.isBlank(conf.properties))
        {
            conf.rawProperties = conf.properties;
            conf.properties = {};
            _.each(conf.rawProperties, function(prop)
                { $.deepSet.apply($, [conf.properties, prop.value].concat(prop.name.split('.'))); });
        }
    },

// TODO: make updating work by translating rawProperties back to properties

    _validKeys: {
        default: true,
        domainCName: true,
        id: true,
        name: true,
        properties: true,
        type: true
    }
});

Configuration.findByType = function(type, options, successCallback, errorCallback)
{
    var params = $.extend({defaultOnly: true, merge: true}, options, {type: type});
    $.socrataServer.makeRequest({pageCache: true, url: '/api/configurations.json', params: params,
        success: function(results)
        {
            if (_.isFunction(successCallback))
            {
                var retObj = { count: results.length, configurations: _.map(results, function(c)
                        { return new Configuration(c); }) };
                if (params.defaultOnly) { retObj = _.first(retObj.configurations); }
                successCallback(retObj);
            }
        }, error: errorCallback});
};

if (blist.inBrowser)
{ this.Configuration = Configuration; }
else
{ module.exports = Configuration; }

})();
