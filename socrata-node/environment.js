(function() 
{
    var env = {
        base: {
            url: 'https://socrata.dev:9443',
            hostname: 'socrata.dev',
            protocol: 'https:',
            port: 9443,
            toString: function() { return env.base.url; }
        },
        includes: {
            username: 'cxlt',
            password: 'aoeuaoeu',
            headers: {
                'X-App-Token': 'U29jcmF0YS0td2VraWNrYXNz0'
            }
        },
        debugRequests: false
    };

    module.exports = env;
})();

