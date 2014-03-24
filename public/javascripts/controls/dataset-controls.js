datasetControlsNS = blist.namespace.fetch('blist.datasetControls');

blist.datasetControls.hookUpShareMenu = function(view, $menu, overrides, hideEmail)
{
    var tweet = escape($.t('controls.common.share.share_text', { name: view.name, site: blist.configuration.strings.company }));
    var seoPath = view.fullUrl;
    var shortPath = view.shortUrl;
    var opts = {
        menuButtonContents: $.t('controls.common.share.button_prompt'),
        menuButtonTitle: $.t('controls.common.share.button_tooltip'),
        contents: [
            { text: $.t('controls.common.share.networks.facebook'), className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: $.t('controls.common.share.networks.twitter'), className: 'twitter', rel: 'external',
              href: 'http://twitter.com/?status=' + tweet + shortPath },
            { text: $.t('controls.common.share.networks.email'), className: 'email', href: '#email',
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

        // Usually browsers (correctly) won't call onClick if the user wants to
        // open in a new tab. However browsers will still call the handler on
        // ctrl/meta-click, so ignore the click in these cases.
        if (e.ctrlKey || e.metaKey) { return; }

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
        if (adjLoc.endsWith('#'))
        { adjLoc = adjLoc.slice(0, -1); }
        if (window.location.hash.length > 0)
        { adjLoc = adjLoc.slice(0, -window.location.hash.length); }
        if (origHref.startsWith(adjLoc))
        { href = origHref.slice(adjLoc.length); }

        // Skip local URLs
        if (href.charAt(0) == '#') { return; }

        // if we're not trying to go anywhere, don't do anything.
        if (window.location.href == origHref) { return; }

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
    dontSaveCallback, cancelCallback, newViewData)
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

    $dialog.loadingSpinner({metric: 'save', overlay: true});

    dialogObj._saveCallback = saveCallback;
    dialogObj._dontSaveCallback = dontSaveCallback;
    dialogObj._cancelCallback = cancelCallback;

    var saveView = function(isNew)
    {
        var $name = $dialog.find('.viewName');
        var name = $name.val();
        if (isNew && $.isBlank(name))
        {
            $dialog.find('.mainError').text($.t('screens.ds.save_dialog.validation.view_name_required'));
            return;
        }

        $dialog.find('.mainError').text('');

        var doSave = function()
        {
            $dialog.loadingSpinner().showHide(true);
            if (!$.isBlank(newViewData)) { blist.dataset.update(newViewData); }
            if (isNew) { blist.dataset.name = name; }
            blist.dataset['save' + (isNew ? 'New' : '')](
                // Success
                function(view)
                {
                    $dialog.loadingSpinner().showHide(false);
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
                    $dialog.loadingSpinner().showHide(false);
                    $dialog.find('.mainError')
                        .text(JSON.parse(xhr.responseText).message);
                });
        };

        if (!$.isBlank(blist.util.inlineLogin))
        {
            var msg = $.t('screens.ds.save_dialog.validation.auth_required');
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
            saveView(true);
        });

        $dialog.find('a.save').click(function(e)
        {
            e.preventDefault();
            saveView($dialog.find('.viewName').is(':visible'));
        });

        $dialog.find('a.update').click(function(e)
        {
            e.preventDefault();
            saveView(false);
        });

        $dialog.find('.jqmClose').click(function()
        {
            cleanDialog()
            if (_.isFunction(dialogObj._cancelCallback))
            { dialogObj._cancelCallback(); }
        });

        $dialog.find('.dontSave').click(function()
        {
            if (_.isFunction(dialogObj._dontSaveCallback))
            { dialogObj._dontSaveCallback(); }
        });

        dialogObj._hookedEvents = true;
    }
};

blist.datasetControls.datasetRating = function($star, $sect, enabled)
{
    if (!enabled && !$.isBlank($star.data('rating-type')) && $.isBlank($star.data('rating')))
    {
        var $dd = $star.closest('dd').addClass('hide');
        $dd.prev('dt').addClass('hide');
        return;
    }

    $star.stars({
        onChange: function(value)
        {
            blist.util.doAuthedAction($.t('controls.common.rate.auth_action_phrase'), function(successCallback)
            {
                blist.dataset.updateRating(
                    {
                        type: $star.attr('data-rating-type'),
                        rating: (value * 20)
                    },
                    function(responseData)
                    {
                        // If the type is returned, that means it's newly created.
                        // Update totals
                        if (!_.isUndefined(responseData.type))
                        {
                            $sect.find('.totalTimesRated').text(
                                parseInt($.trim($sect
                                    .find('.totalTimesRated').text())) + 1);
                        }
                        $star.attr('title', '');
                        if (_.isFunction(successCallback)) { successCallback(); }
                    }
                );
            });
        }
    });
};

blist.datasetControls.datasetContact = function($sect)
{
    // Build the email subject for flag/message
    var contactPurposeChange = function(event)
    {
        var $select = $sect.find('#contactPurpose');

        var type = $select.val();
        var subject = '';

        if ($.isBlank(type)) { return; }

        if (type == 'other')
        {
            subject = $.t('screens.ds.dataset_contact.other_subject', {
                dataset_name: blist.dataset.name,
                site: blist.configuration.strings.company
            });
        }
        else
        {
            subject = $.t('screens.ds.dataset_contact.subject', {
                dataset_name: blist.dataset.name,
                reason: $.t('screens.ds.dataset_contact.reasons.' + type)
            });
        }
        $sect.find('#contactSubject').val(subject);
        $sect.find('#contactBody').focus();
    };

    // IE7/8 can't handle the slideToggle.  It also gets
    // confused about the current state.
    var toggleAction = ($.browser.msie &&
        ($.browser.majorVersion <= 8)) ?
        'toggle' : 'slideToggle';

    // Swap out links for form and back, show 'required' hint
    var toggleContactActions = function()
    {
        $sect.find('.contactOwnerForm')[toggleAction]()
            .find('#contactBody')
                .focus().end().end()
            .find('.contactOwnerLinks')
                [toggleAction]().end();
    };

    $sect.delegate('.contactButton', 'click', function(event)
    {
        event.preventDefault();
        var $this = $(this);

        $sect.find('.flash')
            .removeClass('notice')
            .text('').fadeOut();

        // Captcha width: 321.
        // 350 = ceiling(321 / 50) * 50
        if ($.subKeyDefined(blist, 'datasetPage.sidebar')
            && blist.datasetPage.sidebar.$dom().width() < 350)
        {
            blist.datasetPage.sidebar.$dom().width(350);
            $(window).resize();
        }

        blist.util.loadCaptcha('contactCaptcha');

        // Grab the form from its template
        if ($sect.find('.contactOwnerForm').length === 0)
        {
            $this.closest('.formSection').after(
                $.renderTemplate('aboutDataset_contact'));
            var $form = $sect.find('.contactOwnerForm').addClass('sectionContent');
            $form.parent().addClass('formSection');

            $form.validate({
                rules: {
                    'type'   : 'required',
                    'subject': 'required',
                    'message': 'required',
                    'from_address': {'required': true, 'email': true}
                },
                messages: {
                    'type'   : $.t('screens.ds.dataset_contact.validation.no_purpose'),
                    'subject': $.t('screens.ds.dataset_contact.validation.no_subject'),
                    'message': $.t('screens.ds.dataset_contact.validation.no_body'),
                    'from_address': {
                        required: $.t('screens.ds.dataset_contact.validation.no_email')
                    }
                },
                errorPlacement: function($error, $element)
                { $error.appendTo($element.closest('.lined')); }
            });

            var $purpose = $sect.find('#contactPurpose')
                .change(contactPurposeChange);
            if (!$purpose.parent().hasClass('uniform'))
            { $purpose.uniform(); }

            $form.submit(function(event)
            {
                event.preventDefault();

                if ($form.valid())
                {
                    $.ajax({
                        url: $form.attr('action'),
                        data: $form.serialize(),
                        type: 'POST', dataType: 'json',
                        error: function(request, textStatus, errorThrown) {
                            $sect.find('.flash:not(.recaptcha_flash)')
                              .removeClass('notice').addClass('error')
                              .text($.t('screens.ds.dataset_contact.error_message')).show();
                        },
                        success: function(response) {
                            if(response['success'] == true) {
                                _.defer(function() {
                                    $sect.find('.flash:not(.recaptcha_flash)')
                                        .removeClass('error').addClass('notice')
                                        .text($.t('screens.ds.dataset_contact.success_message')).show();
                                    toggleContactActions();
                                });

                                $sect.find('.recaptcha_flash')
                                    .removeClass('error').fadeOut();
                            } else if (response['success'] == false) {
                                $sect.find('.recaptcha_flash')
                                    .removeClass('notice').addClass('error')
                                    .text($.t('recaptcha.errors.verification_failed')).fadeIn();
                            }
                        }
                    });
                }
            });

            $sect.find('.sendContactButton').click(function(event)
            {
                event.preventDefault();
                $form.submit();
            });
        }

        var form = $sect.find('.contactOwnerForm');
        form[0].reset();
        form.validate().resetForm();

        toggleContactActions();

        // Pre-populate message subject
        if (!_.isUndefined($this.attr('data-select')))
        {
           var $sel = $sect.find('#contactPurpose');
           $sel.val($this.attr('data-select'));
           contactPurposeChange();
           $.uniform.update($sel);
        }
    });
};

blist.datasetControls.getColumnTip = function(col)
{

    //Generate content for main information tooltip,
    //Event binding and usage pushed to the caller
    return '<div class="blist-th-tooltip ' +
        col.renderTypeName + '">' +
        '<p class="name">' +
        $.htmlEscape(col.name).replace(/ /, '&nbsp;') + '</p>' +
        (!$.isBlank(col.metadata.originalName) ?
            '<p class="originalName"><span class="title">' + $.t('screens.ds.column_tip.original_name') + ':</span> ' +
            '<span class="value">' +
                $.htmlEscape(col.metadata.originalName).replace(/ /, '&nbsp;') +
            '</span>' : '') +
        (col.description !== undefined ?
            '<p class="description">' + $.htmlEscape(col.description) +
            '</p>' : '') +
        '<p class="columnType">' +
        '<span class="blist-th-icon"></span>' +
        $.t('core.data_types.' + col.dataTypeName) +
        (col.format.grouping_aggregate !== undefined ?
            ' ' + $.t('screens.ds.column_tip.aggregate', { aggregate: $.t('core.aggregates.' + col.format.grouping_aggregate), data_type: $.t('core.data_types.' + col.dataTypeName) }) : '') +
        '</p>' +
        (col.fieldName !== undefined ? '<br/><p class="api-field">' + $.t('screens.ds.column_tip.field_name') + ': ' + $.htmlEscape(col.fieldName) + '</p>' : '')
        + '</div>';
};

blist.datasetControls.raReasonBox = function($reasonBox)
{
    var $i = $reasonBox.siblings('input');
    var $t = $reasonBox.children('textarea');
    $reasonBox.addClass('hide jsEnabled');
    $reasonBox.append($reasonBox.siblings('.button').clone());
    $reasonBox.append($.tag({tagName: 'a', href: '#Close', 'class': 'remove',
            contents: {tagName: 'span', 'class': 'icon'}}));

    // We don't really care about validation; but when we're in the About
    // sidebar, there is a higher-level form that has validation hooked up;
    // and if we don't hook up validation here, errors are thrown.
    $reasonBox.closest('form').validate();

    var closeForm = function()
    {
        $reasonBox.addClass('hide');
        // IE7 is dumb
        $reasonBox.closest('form').css('z-index', '');
        $t.blur();
    };

    $t.keydown(function(e)
    {
        if (e.which == 27) // ESC
        { closeForm(); }
    });
    $reasonBox.find('.remove').click(function(e)
    {
        e.preventDefault();
        closeForm();
    });

    $i.click(function(e)
    {
        if ($reasonBox.hasClass('hide'))
        {
            e.preventDefault();
            $reasonBox.removeClass('hide');
            // IE7 is dumb
            $reasonBox.closest('form').css('z-index', 10);
            $t.focus();
        }
    });
};

blist.datasetControls.editPublishedMessage = function()
{
    var id = 'editPublishedMessage' + _.uniqueId();
    var $container = $.tag({
        tagName: 'div',
        'class': 'editPublishedMessage',
        id: id, // bt is pretty retarded
        contents: {
            tagName: 'div',
            'class': 'throbber'
        }
    });

    var firstRun = true;
    var finish = function(data, copyInProgress)
    {
        var copyPending = blist.datasetControls.copyPending || copyInProgress;

        // depending on whether time has passed, we might not have been added
        // to dom yet. on the other hand, bt kind of blows, so we can't just
        // blindly use $container
        var $target = $('#' + id);
        if ($target.length === 0)
            $target = $container;

        if (($target.length === 0) || (!firstRun && ($target.closest('body').length === 0)))
            return; // if the node no longer exists, there's naught to do

        if ($target.find('.doneCopyingMessage').is(':visible'))
            return; // if the copy is done, there's no status checking to be done

        // actually do the message update
        $target
            .empty()
            .append($.renderTemplate('editAlertTemplate', data, {
                '.editPublished@class+': function()
                    { return copyPending ? 'hide' : ''; },
                '.editMessage': function()
                    { return datasetEditableMessage(data); },
                '.editMessage@class+': function()
                    { return copyPending ? 'hide' : ''; },
                '.copyingMessage': function()
                    { return $.t('screens.ds.dataset_status.copy_in_progress', { additional: data.message }); },
                '.copyingMessage@class+': function()
                    { return copyPending ? '' : 'hide'; }
            }));

        // bt is kind of a massive pile of shit
        // 1. doesn't figure out dom change and resize tip
        // 2. provides no method for resizing tips
        // 3. recycles the dom element so you can't grab it from self
        // so we grab the thing, grab that thing's thing, then
        // rewrite the thing so we can hide the thing, then reshow
        // the thing and restore the rewritten thing.
        // but that's all in socrata-messaging now, so this is a hollow
        // rant, isn't it?
        var $wrapperObj = $target.closest('.bt-wrapper');
        if ($wrapperObj.length > 0)
        {
            $origDomObj = $wrapperObj.data('socrataTip-$element');
            var tipObj = $origDomObj.data('socrataTip');
            tipObj.refreshSize();
        }

        // ping again in 30 seconds.
        if (!blist.dataset._unpublishedView)
        {
            window.setTimeout(function()
            {
                // TODO: If the user has more than one message open at once, dedupe request
                // (but n is <= 2 anyway so i'm not going to prioritize this)
                updateOperationStatus(); // blindly do this; start of this function will tell us whether to bail
            }, 30000);
        }

        firstRun = false;
    };

    var datasetEditableMessage = function(data) {
        if (blist.dataset.isImmutable()) {
            return $.t('screens.ds.dataset_status.immutable');
        } else {
            return $.t('screens.ds.dataset_status.needs_copy', {
                status: $.t('screens.ds.dataset_status.needs_copy_status.' + data.status)
            });
        }
    };

    var wasEverInProgress = false;
    var updateOperationStatus = function()
    {
        blist.dataset.getOperationStatuses(function(statuses)
        {
            var data = {};
            var copyInProgress = false;

            var dateify = function(timestamp)
            {
                return blist.util.humaneDate.getFromDate(new Date(timestamp * 1000));
            };

            switch (statuses.copying.copyStatus)
            {
                case 'finished':
                    data.status = wasEverInProgress ? 'available' : 'can_be_made';
                    break;
                case 'queued':
                    data.message = $.t('screens.ds.dataset_status.copy_in_progress_additional.queued', { time: dateify(statuses.copying.queuedAt), totalQueued: statuses.copying.totalQueued });
                    copyInProgress = true;
                    break;
                case 'processing':
                    data.message = $.t('screens.ds.dataset_status.copy_in_progress_additional.processing', { time: dateify(statuses.copying.startedAt) });
                    copyInProgress = true;
                    break;
                case 'failed':
                    data.status = 'can_be_made';
            }

            wasEverInProgress = wasEverInProgress || copyInProgress;
            finish(data, copyInProgress);
        });
    };

    blist.dataset.getUnpublishedDataset(function(workingCopy)
    {
        if ($.isBlank(workingCopy))
        {
            updateOperationStatus();
        }
        else
        {
            finish({ status: 'available' }, false);
        }
    });

    return $container;
};

blist.datasetControls.hookUpPublishing = function($container)
{
    $container.find('.unpublished').socrataTitleTip();
    $container.find('.snapshotted').socrataTitleTip();
    $container.find('.publish').click(function(e)
    {
        e.preventDefault();
        if ($(e.target).hasClass('disabled')) { return; }
        blist.dataset.publish(function(pubDS) { pubDS.redirectTo(); },
            function(http)
            {
                var error_message = $.t('screens.ds.dataset_status.error_publishing_html');
                if ((JSON.parse((http || {}).responseText) || {}).message == "Only unpublished datasets can be published.")
                { error_message = $.t('screens.ds.dataset_status.error_publishing_unpublished'); }

                $container.find('#datasetName').socrataTip({content: $.tag({tagName: 'p',
                    'class': 'errorMessage',
                    contents: error_message}),
                    showSpike: false, trigger: 'now'});
            });
    });

    blist.dataset.getPublishingAvailable(function(isAvail, unavailMsg)
    {
        var $pub = $container.find('.publish');
        if (!isAvail)
        { $pub.addClass('disabled').attr('title', unavailMsg); }
        $pub.socrataTitleTip();
    });

    if (!blist.dataset.isPublished())
    {
        blist.dataset.getPublishedDataset(function(pub)
        {
            if (!$.isBlank(pub))
            {
                $container.find('#publishedLink')
                    .attr('href', pub.url).find('.publishedName').text(pub.name);
            }
            else
            { $container.find('#publishedLink').hide(); }
        });
    }
};
