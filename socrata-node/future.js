(function() {
    var Future = function()
    {
        // alias for convenience
        this.s = this.success;
        this.c = this.check;
        this.r = this.resolve;
    };

    Future.prototype = {
        success: function()
        {
            var future = this;
            return function(result)
            {
                future.result = result;
            };
        },

        check: function()
        {
            if (this.result === undefined)
            {
                console.log('not yet.');
                setTimeout(this.check, 500);
            }
            else
            {
                console.log('done!');
            }
        },

        resolve: function()
        {
            return this.result;
        }
    };

    module.exports = Future;
})();

