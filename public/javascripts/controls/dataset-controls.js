datasetControlsNS = blist.namespace.fetch('blist.datasetControls');

blist.datasetControls.hookUpShareMenu = function(view, $menu, overrides, hideEmail)
{
    var tweet = escape('Check out the ' + $.htmlEscape(view.name) +
        ' dataset on ' + blist.configuration.strings.company + ': ');
    var seoPath = view.fullUrl;
    var shortPath = view.shortUrl;
    var opts = {
        menuButtonContents: 'Socialize',
        menuButtonTitle: 'Share this Dataset',
        contents: [
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://www.twitter.com/home?status=' + tweet + shortPath },
            { text: 'Email', className: 'email', href: '#email',
                onlyIf: !hideEmail}
        ]
    };

    $.extend(opts, overrides);
    $menu.menu(opts);
};

blist.datasetControls.unsavedViewPrompt = function()
{
    $.live('a', 'click', function(e)
    {
        // We only care about temp views
        if (!blist.dataset.temporary || blist.dataset.minorChange) { return; }

        var a = e.currentTarget;
        // Skip links that open a new window
        if (a.rel.indexOf('external') > -1) { return; }

        // Skip links we explicitly don't want to save off/prompt on
        if (a.className.indexOf('noRedirPrompt') > -1) { return; }

        var origHref = a.href;

        // If there is no href, nothing could happen anyway
        if ($.isBlank(origHref)) { return; }

        var href = origHref;
        // Need to tweak window.location.href, since it may have a hash
        var adjLoc = window.location.href;
        if (window.location.hash.length > 0)
        { adjLoc = adjLoc.slice(0, -window.location.hash.length); }
        if (origHref.startsWith(adjLoc))
        { href = origHref.slice(adjLoc.length); }

        // Skip local URLs
        if (href.charAt(0) == '#') { return; }

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

blist.datasetControls.showSaveViewDialog = function(customClass, saveCallback,
    dontSaveCallback)
{
    var dialogObj = datasetControlsNS.showSaveViewDialog;

    var $dialog = $('.saveViewDialog');
    $dialog.find('.mainError').text('');
    $dialog.jqmShow();

    dialogObj._customClass = customClass;
    if (!$.isBlank(dialogObj._customClass))
    { $dialog.addClass(dialogObj._customClass); }

    var cleanDialog = function()
    {
        // Do this after the fade out...
        setTimeout(function()
        {
            if (!$.isBlank(dialogObj._customClass))
            { $dialog.removeClass(dialogObj._customClass); }
            $dialog.find('.viewName').val('');
        }, 1000);
    };

    dialogObj._saveCallback = saveCallback;
    dialogObj._dontSaveCallback = dontSaveCallback;

    var saveView = function()
    {
        var $name = $dialog.find('.viewName');
        var isNew = $name.is(':visible');
        var name = $name.val();
        if (isNew && $.isBlank(name))
        {
            $dialog.find('.mainError').text('A view name is required');
            return;
        }

        $dialog.find('.mainError').text('');

        var doSave = function()
        {
            $dialog.find('.loadingOverlay, .loadingSpinner').removeClass('hide');
            if (isNew) { blist.dataset.name = name; }
            blist.dataset['save' + (isNew ? 'New' : '')](
                // Success
                function(view)
                {
                    var preventRedirect = false;
                    if (_.isFunction(dialogObj._saveCallback))
                    { preventRedirect = dialogObj._saveCallback(view); }

                    // If we're immediately doing a redirect, don't hide the
                    // dialog; because it is just confusing
                    if (!preventRedirect) { view.redirectTo(); }
                    else
                    {
                        cleanDialog();
                        $dialog.jqmHide();
                    }
                },
                // Error
                function(xhr)
                {
                    $dialog.find('.loadingOverlay, .loadingSpinner')
                        .addClass('hide');
                    $dialog.find('.mainError')
                        .text(JSON.parse(xhr.responseText).message);
                });
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
        { cleanDialog() });

        $dialog.find('.dontSave').click(function()
        {
            if (_.isFunction(dialogObj._dontSaveCallback))
            { dialogObj._dontSaveCallback(); }
        });

        dialogObj._hookedEvents = true;
    }
};

blist.datasetControls.columnTip = function(col, $col, tipsRef, initialShow)
{
    var clearShowTimer = function(item)
    {
        clearTimeout(item.timer);
        delete item.timer;
    };

    if (!$.isBlank(tipsRef[col.id]))
    {
        if (tipsRef[col.id].$dom.isSocrataTip())
        {
            tipsRef[col.id].$dom.socrataTip().hide();
            tipsRef[col.id].$dom.socrataTip().disable();
        }
        clearShowTimer(tipsRef[col.id]);
    }
    tipsRef[col.id] = {$dom: $col};

    var tooltipContent = '<div class="blist-th-tooltip ' +
        col.renderTypeName + '">' +
        '<p class="name">' +
        $.htmlEscape(col.name).replace(/ /, '&nbsp;') + '</p>' +
        (col.description !== undefined ?
            '<p class="description">' + $.htmlEscape(col.description) +
            '</p>' : '') +
        '<p class="columnType">' +
        '<span class="blist-th-icon"></span>' +
        col.renderType.title +
        (col.format.grouping_aggregate !== undefined ?
            ' (' + $.capitalize(col.format.grouping_aggregate) + ' on ' +
            col.dataTypeName.displayable() + ')' : '') +
        '</p>' +
        '</div>';
    var contentIsMain = true;

    var showTip = function()
    {
        tipsRef[col.id].timer = setTimeout(function()
        {
            delete tipsRef[col.id].timer;
            $col.socrataTip().show();
        }, 300);
    };
    // Use mouseover for showing tip to catch when it moves onto
    // the menuLink.
    // Use mouseleave for hiding to catch when it leaves the entire header
    $col
        .mouseover(function(e)
        {
            if (!$(e.target).hasClass('menuLink'))
            {
                clearShowTimer(tipsRef[col.id]);
                showTip();
            }
            else
            {
                clearShowTimer(tipsRef[col.id]);
                $col.socrataTip().hide();
            }
        })
        .mouseleave(function(e)
        {
            clearShowTimer(tipsRef[col.id]);
            $col.socrataTip().hide();
        });


    $col.socrataTip({content: tooltipContent, trigger: 'none', parent: 'body'});
    if (initialShow) { showTip(); }
};
