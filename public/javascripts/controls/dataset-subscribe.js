;(function($) {

    var dialogNS = blist.namespace.fetch('blist.dialog'),
        _initialized = false,
        cu = null,
        PublishEvent = 'MAIL.VIEW_PUBLISHED',
        $dialog = $('.subscribeToDataset'),
        $dsType = $dialog.find('.datasetTypeName'),
        $dsTypeUp = $dialog.find('.datasetTypeNameUpcase'),
        $checkbox = $dialog.find('.subscribeCheckbox');

    $checkbox.change(function(event) {
        var unsubscribing = $dialog.hasClass('subscribed');
        var finished = function() {
            $dialog.toggleClass('loading unsubscribed subscribed');
        };
        if (unsubscribing) {
            $dialog.addClass('loading');
            cu.removeEmailInterest(PublishEvent, blist.dataset.id, finished);
        }
        else {
            blist.util.doAuthedAction('subscribe to a dataset', function() {
                cu = new User(blist.currentUser);
                $dialog.addClass('loading');
                cu.addEmailInterest(PublishEvent, blist.dataset.id, finished);
            });
        }
    });
    dialogNS.subscribe = function(event) {
        if (!_initialized) {
            var displayName = blist.dataset.displayName;
            $dsType.text(displayName);
            $dsTypeUp.text(displayName.capitalize());
            $checkbox.uniform();

            var finished = function(interest) {
                if (interest) {
                    $dialog.removeClass('unsubscribed').addClass('subscribed');
                    $checkbox.prop('checked', true);
                }
                $dialog.removeClass('loading');

                _initialized = true;
            };
            if (blist.currentUser) {
                cu = new User(blist.currentUser);
                cu.getEmailInterest(PublishEvent, blist.dataset.id, finished);
            }
            else {
                finished();
            }
        }
        $dialog.jqmShow();
    };

})(jQuery);
