(function()
{
    module.exports = {
        inBrowser: false,
        datatypes: require(__dirname + '/datatypes'),
        util: {
            patterns: {
                UID: /^\w{4}-\w{4}$/
            }
        },
        viewCache: {}
    };
})();

