;(function($)
{

blist.fileUploader = function(opts)
{
    var uploader;

    // build our credentials
    var appToken = 'U29jcmF0YS0td2VraWNrYXNz0';
    var authenticityToken = $('meta[name="csrf-token"]').attr('content');

    // update the form fields
    var socrataCredentials = {
        app_token: appToken,
        authenticity_token: authenticityToken
    };

    if (_.isUndefined(opts.params))
        opts.params = socrataCredentials;
    else
        $.extend(opts.params, socrataCredentials);

    // create a proxy in order to update the url on submit
    var oldOnSubmit = opts.onSubmit || function() { return true; };
    var onSubmit = function(id, fileName)
    {
        if (oldOnSubmit(id, fileName) !== false)
        {
            if (!uploader._options.action.match(/app_token=/)) // only update if not present
            {
                var firstCharacter = (uploader._options.action.indexOf('?') >= 0) ? '&' : '?';
                uploader._options.action += firstCharacter + 'app_token=' + appToken +
                                            '&authenticity_token=' + escape(authenticityToken);
            }
            return true;
        }
        else
        {
            return false;
        }
    };
    opts.onSubmit = onSubmit;

    uploader = new fileUploader.FileUploader(opts);
    return uploader;
};

})(jQuery);