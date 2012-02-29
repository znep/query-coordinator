datasetControlsNS = blist.namespace.fetch('blist.datasetControls');

blist.datasetControls.hookUpShareMenu = function(view, $menu, overrides, hideEmail)
{
    var tweet = escape('Check out the ' + $.htmlEscape(view.name) +
        ' dataset on ' + blist.configuration.strings.company + ': ');
    var seoPath = view.fullUrl;
    var shortPath = view.shortUrl;
    var opts = {
        menuButtonContents: 'Socialize',
        menuButtonTitle: $.t('controls.browse.listing.share_this_dataset'),
        contents: [
            { text: 'Facebook', className: 'facebook', rel: 'external',
              href: 'http://www.facebook.com/share.php?u=' + seoPath },
            { text: 'Twitter', className: 'twitter', rel: 'external',
              href: 'http://twitter.com/?status=' + tweet + shortPath },
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

    $dialog.loadingSpinner({overlay: true});

    dialogObj._saveCallback = saveCallback;
    dialogObj._dontSaveCallback = dontSaveCallback;
    dialogObj._cancelCallback = cancelCallback;

    var saveView = function(isNew)
    {
        var $name = $dialog.find('.viewName');
        var name = $name.val();
        if (isNew && $.isBlank(name))
        {
            $dialog.find('.mainError').text('A view name is required');
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
        value: $star.attr('data-rating') || 0,
        enabled: enabled && !$.isBlank($star.data('rating-type')),
        onChange: function(value)
        {
            blist.util.doAuthedAction('rate this dataset', function(successCallback)
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
            subject = 'A visitor has sent you a message about your "' +
                  blist.dataset.name + '" ' +
                  blist.configuration.strings.company + ' dataset';
        }
        else
        {
            subject = 'Your dataset "' + blist.dataset.name + '" has been flagged ';
            switch (type)
            {
                case 'copyright_violation':
                    subject += 'for copyright violation';
                    break;
                case 'offensive_content':
                    subject += 'for offensive content';
                    break;
                case 'spam':
                    subject += 'as potential spam';
                    break;
                case 'personal_information':
                    subject += 'for containing personal information';
                    break;
            }
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
                    'type'   : 'You must select a purpose for this message.',
                    'subject': 'You must choose a subject for this message.',
                    'message': 'The message must have a body.',
                    'from_address': {
                        required: 'Your email address is required.'
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
                            $sect.find('.flash:not(.math_message)')
                              .removeClass('notice').addClass('error')
                              .text('There was an error sending feedback for this dataset. Please retry later.').show();
                        },
                        success: function(response) {
                            if(response['success'] == true) {
                                _.defer(function() {
                                    $sect.find('.flash:not(.math_message)')
                                        .removeClass('error').addClass('notice')
                                        .text('The dataset owner has been notified.').show();
                                    toggleContactActions();
                                });

                                $sect.find('.math_message')
                                    .removeClass('error').fadeOut();
                            } else if (response['success'] == false) {
                                $sect.find('.math_message')
                                    .removeClass('notice').addClass('error')
                                    .text('Incorrect answer, please try again.').fadeIn();
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

blist.datasetControls.columnTip = function(col, $col, tipsRef, initialShow)
{
    var cleanTip = function(tip)
    {
        if (tip.$dom.isSocrataTip())
        {
            tip.$dom.socrataTip().hide();
            tip.$dom.socrataTip().disable();
        }
        clearShowTimer(tip);
    };

    // Make sure this is bound only once
    $col.parent().unbind('rerender.columnTip');
    $col.parent().bind('rerender.columnTip', function()
    {
        _.each(tipsRef, function(tip) { cleanTip(tip); });
    });

    var clearShowTimer = function(item)
    {
        clearTimeout(item.timer);
        delete item.timer;
    };

    if (!$.isBlank(tipsRef[col.id]))
    {
        cleanTip(tipsRef[col.id]);
    }
    tipsRef[col.id] = {$dom: $col};

    var tooltipContent = '<div class="blist-th-tooltip ' +
        col.renderTypeName + '">' +
        '<p class="name">' +
        $.htmlEscape(col.name).replace(/ /, '&nbsp;') + '</p>' +
        (!$.isBlank(col.metadata.originalName) ?
            '<p class="originalName"><span class="title">Original Name:</span> ' +
            '<span class="value">' +
                $.htmlEscape(col.metadata.originalName).replace(/ /, '&nbsp;') +
            '</span>' : '') +
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
                '.editMessage@class+': function()
                    { return copyPending ? 'hide' : ''; },
                '.copyingMessage@class+': function()
                    { return copyPending ? '' : 'hide'; },
                '.workingCopyStatus': 'status',
                '.additionalCopyingMessage': 'message'
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
                    data.status = wasEverInProgress ? 'is available' : 'can be made';
                    break;
                case 'queued':
                    data.message = 'It is in line waiting to be processed ' +
                                   '(queued ' + dateify(statuses.copying.queuedAt) + '; ' +
                                   statuses.copying.totalQueued + ' total in line)';
                    copyInProgress = true;
                    break;
                case 'processing':
                    data.message = 'It is currently being processed ' +
                                   '(started ' + dateify(statuses.copying.startedAt) + ')';
                    copyInProgress = true;
                    break;
                case 'failed':
                    data.status = 'can be made';
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
            finish({ status: 'is available' }, false);
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
            function()
            {
                $container.find('#datasetName').socrataTip({content: $.tag({tagName: 'p',
                    'class': 'errorMessage',
                    contents: ['There was an error publishing your dataset. Please ',
                        {tagName: 'a', href: 'http://support.socrata.com', rel: 'external',
                        contents: ['contact Socrata support']}]}),
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
