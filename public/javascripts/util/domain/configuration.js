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
        'default': true,
        domainCName: true,
        id: true,
        name: true,
        properties: true,
        type: true
    }
});

Configuration.findByType = function(type, options, successCallback, errorCallback)
{
    var params = $.extend({merge: true}, options, {type: type});
    $.socrataServer.makeRequest({pageCache: true, url: '/admin/configuration.json', params: params,
        success: function(result)
        {
            if (_.isFunction(successCallback))
            {
                successCallback(new Configuration(result));
            }
        }, error: errorCallback});
};

if (blist.inBrowser)
{ this.Configuration = Configuration; }
else
{ module.exports = Configuration; }

})();
