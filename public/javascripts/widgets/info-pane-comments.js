// Using the plugin pattern from Mike Alsup. 
// http://www.learningjquery.com/2007/10/a-plugin-development-pattern
// Author: jeff.scherpelz@blist.com

// Protect $.
(function($)
{
    // Hook up all the behavior for the comments pane in the info pane
    $.fn.infoPaneComments = function(options)
    {
        var opts = $.extend({}, $.fn.infoPaneComments.defaults, options);

        return this.each(function()
        {
            var $commentPane = $(this);

            // Support for the Metadata Plugin.
            var config = $.meta ? $.extend({}, opts, $commentPane.data()) : opts;
            $commentPane.data('config-infoPaneComments', config);

            $commentPane.find(config.showFormSelector).click(
                function (e) { showFormClick($commentPane, e); });

            $commentPane.find(config.ratingUISelector)
                .mouseleave(function (e) { ratingMouseleave($commentPane, e); })
                .mousemove(function (e) { ratingMousemove($commentPane, e); })
                .click(function (e) { ratingClick($commentPane, e); });

            $commentPane.find(config.cancelSelector).click(function (e)
            {
                e.preventDefault();
                hideForm($commentPane);
            });

            $commentPane.find(config.formSelector)
                .submit(function (e) { submitCommentRating($commentPane, e); });

            $commentPane.find(config.commentSelector).find(config.actionSelector)
                .click(function (e) { actionClick($commentPane, e); });
        });

        // Private methods
        function showFormClick($commentPane, e)
        {
            var config = $commentPane.data('config-infoPaneComments');
            if (e)
            {
                e.preventDefault();
            }

            if (!$commentPane.hasClass('expanded'))
            {
                $commentPane.parent().find(config.infoTabsSelector)
                    .infoPaneNavigate().expandTabPanels(
                        function () { showFormClick($commentPane); });
                return;
            }

            $commentPane.find(config.formSelector)
                .removeClass(config.hiddenClass)
                .find(config.focusSelector).focus()
                .end()[0].scrollIntoView();
            $(window).resize();
        };

        function hideForm($commentPane)
        {
            var config = $commentPane.data('config-infoPaneComments');
            $commentPane.find(config.formSelector)
                .find(config.clearableInputSelector).val('');
            if ($commentPane.find(config.commentSelector).length > 0)
            {
                $commentPane.find(config.formSelector).addClass(config.hiddenClass);
                $(window).resize();
            }
        };

        function ratingMouseleave($commentPane, e)
        {
            var config = $commentPane.data('config-infoPaneComments');
            updateRating($(e.currentTarget),
                $commentPane.find(config.ratingInputSelector).val());
        };

        function ratingMousemove($commentPane, e)
        {
            var $this = $(e.currentTarget);
            updateRating($this, mousedOverRating($this, e));
        };

        function ratingClick($commentPane, e)
        {
            var $this = $(e.currentTarget);
            var config = $commentPane.data('config-infoPaneComments');
            var newRating = mousedOverRating($this, e);
            updateRating($this, newRating);
            $commentPane.find(config.ratingInputSelector).val(newRating);
        };

        function ratingClass(rating)
        {
            return ['zero', 'one', 'two', 'three', 'four', 'five'][rating];
        };

        function updateRating($ratingUI, rating)
        {
            $ratingUI.removeClass(ratingClass($ratingUI.text()))
                .attr('title', rating).text(rating)
                .addClass(ratingClass(rating));
        };

        function mousedOverRating($ratingUI, e)
        {
            return Math.ceil((e.pageX - $ratingUI.offset().left + 1)
                / ($ratingUI.width() + 1) * 5);
        };

        function submitCommentRating($commentPane, event)
        {
            var config = $commentPane.data('config-infoPaneComments');
            event.preventDefault();
            $form = $(event.currentTarget);
            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "POST",
                dataType: "html",
                data: requestData,
                success: function(responseData)
                {
                    var $resp = $(responseData);

                    // Update the summary header
                    $commentPane.find(config.headerSelector)
                        .replaceWith($resp.children(config.headerSelector));
                    $commentPane.find(config.showFormSelector).click(
                        function (e) { showFormClick($commentPane, e); });

                    // Update all ratings for this user
                    var $newRating = $resp.children('.rating[class*=user_rating_]');
                    if ($newRating.length > 0)
                    {
                        var matchClass = $newRating
                            .attr('class').match(/(user_rating_\w+-\w+)/)[0];
                        $commentPane.find('.' + matchClass).replaceWith($newRating);
                    }

                    // Add the new comment
                    var $newComment = $resp.children(config.commentSelector);
                    if ($newComment.length > 0)
                    {
                        $newComment.prependTo($commentPane
                                .find(config.commentListSelector))
                            .find(config.actionSelector)
                            .click(function (e) { actionClick($commentPane, e); });
                    }

                    hideForm($commentPane);
                    if ($commentPane.find(config.commentSelector).length > 0)
                    {
                        $commentPane.find(config.footerSelector)
                            .removeClass(config.hiddenClass);
                    }
                }
            });
        };

        function actionClick($commentPane, e)
        {
            var config = $commentPane.data('config-infoPaneComments');
            e.preventDefault();
            var $link = $(e.currentTarget);
            if ($link.hasClass(config.actionDoneClass))
            {
                return;
            }

            var hrefPieces = $link.attr('href').slice(1).split('_');
            var $form = $link.closest('form');
            var reqObj = {'comment[id]': hrefPieces[1]};
            switch (hrefPieces[0])
            {
                case 'flagComment':
                    reqObj['comment[flags]'] = ['flag'];
                    $link.text('Flagged');
                    break;
                case 'rateUp':
                    reqObj['comment[rating]'] = true;
                    updateCommentRating($commentPane, $link);
                    break;
                case 'rateDown':
                    reqObj['comment[rating]'] = false;
                    updateCommentRating($commentPane, $link);
                    break;
            }
            $link.addClass(config.actionDoneClass);
            var requestData = $.param(reqObj) + "&" + $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                dataType: "json",
                data: requestData,
                success: function(responseData)
                {
                }
            });
        };

        function updateCommentRating($commentPane, $link)
        {
            var config = $commentPane.data('config-infoPaneComments');
            var chosen = $link.attr('class').match(/rate(Up|Down)/)[1];
            var opposite = chosen == "Up" ? "Down" : "Up";
            $link.parent().find('.rate' + opposite)
                .addClass('disabled').addClass(config.actionDoneClass);
            var $ratingSpan = $link.parent().find('.rating' + chosen)
                .removeClass(config.hiddenClass);
            $ratingSpan.text($ratingSpan.text().match(/(\+|-)/)[1] +
                (parseInt($ratingSpan.text().match(/(\d+)/)[1]) + 1));
        };
    };

     // default options
     $.fn.infoPaneComments.defaults = {
        actionDoneClass: 'actionDone',
        actionSelector: '.actions a',
        cancelSelector: 'a[href=#cancel_comment]',
        clearableInputSelector: 'input[type=text], textarea',
        commentSelector: '.comment',
        commentListSelector: '.commentList',
        focusSelector: 'input[type=text]',
        formSelector: 'form.postComment',
        footerSelector: '.footer',
        headerSelector: '.infoContentHeader',
        hiddenClass: 'hidden',
        infoTabsSelector: '.summaryTabs',
        ratingInputSelector: '.selfRating input',
        ratingUISelector: '.selfRating .rating',
        showFormSelector: 'a[href=#post_comment]'
     };

})(jQuery);
