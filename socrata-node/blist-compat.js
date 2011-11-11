(function()
{
    module.exports = {
        inBrowser: false,
        datatypes: require('datatypes'),
        util: {
            patterns: {
                UID: /^\w{4}-\w{4}$/
            }
        },
        viewCache: {}
    };
})();

