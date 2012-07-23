;(function($) {

    var dialogNS = blist.namespace.fetch('blist.dialog'),
        _initialized = false,
        cu = null,
        PublishEvent = 'MAIL.VIEW_PUBLISHED',
        $dialog,
        $dsType,
        $dsTypeUp,
        $checkbox;

    dialogNS.subscribe = function(dataset)
    {
        if (!_initialized)
        { doSetup(); }

        dataset = dataset || blist.dataset;
        $dialog.data('dataset', dataset);

        var displayName = dataset.displayName;
        $dsType.text(displayName);
        $dsTypeUp.text(displayName.capitalize());
        $dialog.find('.datasetName').text(dataset.name);

        var rssUrl = dataset.apiUrl + '/rows.rss';
        $dialog.find('.rssSection a.rss').attr('href', rssUrl);
        $dialog.find('.rssSection a.greader').attr('href', 'http://fusion.google.com/add?feedurl=' + rssUrl);
        $dialog.find('.rssSection a.feed').attr('href', 'feed:' + rssUrl);

        var finished = function(interest)
        {
            if (interest)
            {
                $dialog.removeClass('unsubscribed').addClass('subscribed');
                $.uniform.update($checkbox.prop('checked', true));
            }
            $dialog.removeClass('loading');
        };
        if (blist.currentUser)
        {
            cu = new User(blist.currentUser);
            cu.getEmailInterest(PublishEvent, dataset.id, finished);
        }
        else
        { finished(); }

        $dialog.jqmShow();
    };

    var doSetup = function()
    {
        $dialog = $('.subscribeToDataset');
        $dsType = $dialog.find('.datasetTypeName');
        $dsTypeUp = $dialog.find('.datasetTypeNameUpcase');
        $checkbox = $dialog.find('.subscribeCheckbox');

        $checkbox.uniform();

        $checkbox.change(function(event)
        {
            var dataset = $dialog.data('dataset');
            var unsubscribing = $dialog.hasClass('subscribed');
            var finished = function()
            { $dialog.toggleClass('loading unsubscribed subscribed'); };

            if (unsubscribing)
            {
                $dialog.addClass('loading');
                cu.removeEmailInterest(PublishEvent, dataset.id, finished);
            }
            else
            {
                if (!cu)
                { $.uniform.update($checkbox.prop('checked', false)); }

                blist.util.doAuthedAction('subscribe to a dataset', function()
                {
                    cu = new User({id: blist.currentUserId});
                    $dialog.addClass('loading');
                    cu.addEmailInterest(PublishEvent, dataset.id, finished);

                    $.uniform.update($checkbox.prop('checked', true));
                });
            }
        });

        _initialized = true;
    };

})(jQuery);
