;blist.namespace.fetch('blist.nominations');

$(function()
{
    var nom = blist.nomination;
    blist.nominations.map = {};
    blist.nominations.map[nom.id] = nom;

    blist.nominations.updateNomination = function()
    {
        blist.util.railsFlash($.t('controls.nominate.suggestion_updated'));
        window.location.reload();
    };

    var $actions = $('.nomActions');
    var ratedNom;
    $actions.find('.rateLink').click(function(event)
    {
        event.preventDefault();
        var $t = $(this);
        if ($t.hasClass('rateUp') == ratedNom) { return; }

        blist.nominations.rate(nom.id, $t,
            $actions, function (isUp) {
                ratedNom = isUp;
            });
    });

    $moderation = $actions.find('.nomModerationContainer');
    var nomStatus = blist.nominations.friendlyStatus(nom);
    $moderation.find('.currentStatus').text(nomStatus.capitalize());
    $('.nomModerationContainer').addClass(nomStatus);

    $('.editNomButton').click(function(event)
    {
        event.preventDefault();
        blist.nominations.showNomDialog(nom.id, nom.title, nom.description);
    });

    $('.nominateDialog').attr('data-editId', nom.id);

    $('.nomComments').append($.renderTemplate('feedList'));

    nom.getComments(function callback(comments)
    {
        $('.nomComments .feed').feedList({
            actionDelegate: function() { return nom; },
            comments: comments,
            filterCategories: null,
            highlightCallback: function(feedItem) {
                return _.include(feedItem.user.rights || [], 'approve_nominations');
            },
            mainView: nom
        });
    });

    var $contactDialog = $('.contactNominatorDialog');
    $('.notifyNominatorButton').click(function(event)
    {
        event.preventDefault();
        $contactDialog.jqmShow();
    });

    $contactDialog.find('.submitAction').click(function(event)
    {
        event.preventDefault();
        $contactDialog.find('.prompt').val('');
        $contactDialog.find('.mainError').text('');
        if (!$contactDialog.find('form').valid())
        {
            $contactDialog.find('.mainError').text($.t('controls.nominate.form_error'));
            return;
        }
        nom.contactOwner($contactDialog.find('form').serializeObject(),
            function greaterSuccess() {
                $contactDialog.jqmHide();
                flash($.t('controls.nominate.greater_success'));
            },
            function greatSadness() {
                $contactDialog.jqmHide();
                flash($.t('controls.nominate.great_sadness'), 'error');
            });
    });

    $contactDialog.find('form').validate({errorElement: 'span'});

    $('.nomModerationContainer .moderateLink').click(function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var status = $t.attr('data-status');

        blist.nominations.moderate(nom.id, status, $('.nomModerationContainer'));
    });

    $('.nomModerationContainer .delete').click(function(e)
    {
        e.preventDefault();
        var $t = $(this);
        var status = $t.attr('data-status');
        blist.nominations.remove(nom.id, function() {
            window.location = $.path('/nominate');
        });
    });

    var flash = function(message, level)
    {
        level || (level = 'notice');
        $('.nomFlash .flash').removeClass('notice error')
            .addClass(level)
            .text(message)
            .fadeIn();
    }
});
