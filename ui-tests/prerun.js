var _ = require('underscore');
var config = require ('./test-config.js');

config.printActiveConfig();

var configErrors = config.errors;

if (_.isEmpty(configErrors))
{
    process.exit(0);
}
else
{
    _.each(configErrors, function(e)
    {
        console.log("!! " + e);
    });
    process.exit(1);
}
