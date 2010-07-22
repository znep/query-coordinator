datasetControlsNS = blist.namespace.fetch('blist.dataset.controls');

blist.dataset.controls.hookUpShareMenu = function(view, $menu, overrides)
{
    var tweet = escape('Check out the ' + $.htmlEscape(view.name) +
        ' dataset on ' + blist.configuration.strings.company + ': ');
    var seoPath = window.location.hostname + $.generateViewUrl(view);
    var shortPath = window.location.hostname.replace(/www\./, '') + '/d/' + view.id;
    var opts = {
        menuButtonContents: 'Socialize',
        menuButtonTitle: 'Share this dataset',
        contents: [
            { text: 'Delicious', className: 'delicious', rel: 'external',
              href: 'http://del.icio.us/post?url=' + seoPath + '&title=' +
                $.htmlEscape(view.name) },
            { text: 'Digg', className: 'digg', rel: 'external',
              href: 'http://digg.com/submit?phase=2&url=' + seoPath +
                '&title=' + $.htmlEscape(view.name) },
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://www.twitter.com/home?status=' + tweet + shortPath },
            { text: 'Email', className: 'email', href: '#email',
                onlyIf: view.viewType != 'blobby'}
        ]
    };

    $.extend(opts, overrides);
    $menu.menu(opts);
};

blist.dataset.controls.unsavedViewPrompt = function()
{
    $.live('a', 'click', function(e)
    {
        // We only care about temp views
        if (!blist.display.isTempView) { return; }

        var a = e.currentTarget;
        // Skip links that open a new window
        if (a.rel.indexOf('external') > -1) { return; }

        var origHref = a.href;

        // If there is no href, nothing could happen anyway
        if ($.isBlank(origHref)) { return; }

        var href = origHref;
        if (origHref.startsWith(window.location.href))
        { href = origHref.slice(window.location.href.length); }

        // Skip local URLs
        if (href[0] == '#') { return; }

        e.preventDefault();

        var doRedirect = function()
        {
            window.location = origHref;
            return true;
        };
        datasetControlsNS.showSaveViewDialog('leavingSaveDialog',
            doRedirect, doRedirect);
    });
};

blist.dataset.controls.showSaveViewDialog = function(customClass, saveCallback,
    dontSaveCallback)
{
    var dialogObj = datasetControlsNS.showSaveViewDialog;

    var $dialog = $('.saveViewDialog');
    $dialog.find('.mainError').text('');
    $dialog.jqmShow();

    dialogObj._customClass = customClass;
    if (!$.isBlank(dialogObj._customClass))
    { $dialog.addClass(dialogObj._customClass); }

    var clearCustomClass = function()
    {
        // Do this after the fade out...
        setTimeout(function()
        {
            if (!$.isBlank(dialogObj._customClass))
            { $dialog.removeClass(dialogObj._customClass); }
        }, 1000);
    };

    dialogObj._saveCallback = saveCallback;
    dialogObj._dontSaveCallback = dontSaveCallback;

    var saveView = function()
    {
        var name = $dialog.find('.viewName').val();
        if ($.isBlank(name))
        {
            $dialog.find('.mainError').text('A view name is required');
            return;
        }

        $dialog.find('.mainError').text('');

        var doSave = function()
        {
            $dialog.find('.loadingOverlay, .loadingSpinner').removeClass('hide');
            $.ajax({url: '/views.json', type: 'POST', dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify(blist.dataset.cleanViewForPost($.extend({},
                    blist.display.view, {name: name}), true)),
                error: function(xhr)
                {
                    $dialog.find('.loadingOverlay, .loadingSpinner')
                        .addClass('hide');
                    $dialog.find('.mainError')
                        .text(JSON.parse(xhr.responseText).message);
                },
                success: function(view)
                {
                    clearCustomClass();
                    $dialog.jqmHide();

                    var preventRedirect = false;
                    if (_.isFunction(dialogObj._saveCallback))
                    { preventRedirect = dialogObj._saveCallback(view); }

                    if (!preventRedirect)
                    { blist.util.navigation.redirectToView(view); }
                }});
        };

        if (!$.isBlank(blist.util.inlineLogin))
        {
            var msg = 'You must be logged in to save a view';
            blist.util.inlineLogin.verifyUser(
                function(isSuccess)
                {
                    if (isSuccess) { doSave(); }
                    else { $dialog.find('.mainError').text(msg); }
                }, msg);
        }
        else
        { doSave(); }
    };

    if ($.isBlank(dialogObj._hookedEvents))
    {
        $dialog.find('form').submit(function(e)
        {
            e.preventDefault();
            saveView();
        });

        $dialog.find('a.save').click(function(e)
        {
            e.preventDefault();
            saveView();
        });

        $dialog.find('.jqmClose').click(function()
        { clearCustomClass() });

        $dialog.find('.dontSave').click(function()
        {
            if (_.isFunction(dialogObj._dontSaveCallback))
            { dialogObj._dontSaveCallback(); }
        });

        dialogObj._hookedEvents = true;
    }
};
