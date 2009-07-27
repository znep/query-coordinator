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
                hideAllForms($commentPane);
            });

            $commentPane.find(config.topFormSelector
                + ':not(.' + config.skipActionClass + ')')
                .submit(function (e) { submitCommentRating($commentPane, e); });

            $commentPane.find(config.replySelector
                + ':not(.' + config.skipActionClass + ')')
                .submit(function (e) { submitReply($commentPane, e); });

            $commentPane.find(config.actionSelector
                + ':not(.' + config.skipActionClass + ')')
                .click(function (e) { actionClick($commentPane, e); });

            $commentPane.find(config.expanderSelector)
                .click(function (e) { expanderClick($commentPane, e); });

            $commentPane.find(config.commentListSelector)
                .pagination({paginationContainer:
                    $commentPane.find(config.paginationContainer),
                    previousText: 'Prev'});

            if (config.initialComment && config.initialComment != '')
            {
                $commentPane.find(config.commentListSelector)
                    .pagination().showItem($commentPane
                            .find('#comment_' + config.initialComment));
            }
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

            $commentPane.find(config.topFormSelector)
                .removeClass(config.hiddenClass)
                .find(config.focusSelector).focus()
                .end()[0].scrollIntoView();
            $(window).resize();
        };

        function hideAllForms($commentPane)
        {
            var config = $commentPane.data('config-infoPaneComments');
            $commentPane.find(config.clearableInputSelector).val('');
            $commentPane.find(config.ratingInputSelector).val(0);
            updateRating($commentPane.find(config.ratingUISelector), 0);
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
            rating = parseInt(rating) || 0;
            $ratingUI.removeClass(ratingClass(parseInt($ratingUI.text()) || 0))
                .attr('title', rating)
                .addClass(ratingClass(rating))
                .find("span").text(rating);
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
            var $form = $(event.currentTarget);
            if ($form.hasClass(config.disabledClass))
            {
                return;
            }

            if (blist.util.inlineLogin)
            {
                blist.util.inlineLogin.verifyUser(
                    function (isSuccess, didLogin) {
                        if (isSuccess)
                        {
                            doSubmitComment($commentPane, $form, didLogin);
                        }
                        else
                        {
                            $form.find(':text:first').focus();
                        }
                    }, 'You must have an account to comment or rate a dataset');
            }
            else
            {
                doSubmitComment($commentPane, $form);
            }
        };

        function doSubmitComment($commentPane, $form, redirectAfter)
        {
            var config = $commentPane.data('config-infoPaneComments');
            $form.addClass(config.disabledClass);
            $(window).resize();
            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "POST",
                dataType: "html",
                data: requestData,
                success: function(responseData)
                {
                    var $resp = $(responseData);
                    $form.removeClass(config.disabledClass);

                    // Update the summary header
                    $commentPane.find(config.headerSelector)
                        .replaceWith($resp.children(config.headerSelector));
                    $commentPane.find(config.showFormSelector).click(
                        function (e) { showFormClick($commentPane, e); });

                    // Add the new comment
                    var $newComment = $resp.children(config.commentSelector);
                    if ($newComment.length > 0)
                    {
                        $newComment
                            .prependTo(
                                $commentPane.find(config.commentListSelector)
                            )
                            .find(config.actionSelector
                            + ':not(.' + config.skipActionClass + ')')
                            .click(function (e) { actionClick($commentPane, e); })
                            .end()
                            .find(config.replySelector
                            + ':not(.' + config.skipActionClass + ')')
                            .submit(function (e) { submitReply($commentPane, e); })
                            .end()
                            .find(config.cancelSelector).click(function (e)
                            {
                                e.preventDefault();
                                hideAllForms($commentPane);
                            })
                            .end()
                            .find(config.expanderSelector)
                            .click(function (e) { expanderClick($commentPane, e); });
                        $commentPane.find(config.commentListSelector)
                            .pagination().update();
                    }

                    if ($commentPane.find(config.commentSelector).length > 0)
                    {
                        $commentPane.find(config.footerSelector)
                            .removeClass(config.hiddenClass);
                    }
                    hideAllForms($commentPane);

                    if (redirectAfter)
                    {
                        if ($newComment.length > 0)
                        {
                            var commentId = $newComment.attr('id').split('_')[1];
                        }
                        redirect($form, commentId);
                    }
                }
            });
        };

        function submitReply($commentPane, event)
        {
            var config = $commentPane.data('config-infoPaneComments');
            event.preventDefault();
            var $form = $(event.currentTarget);
            if ($form.hasClass(config.disabledClass))
            {
                return;
            }

            if (blist.util.inlineLogin)
            {
                blist.util.inlineLogin.verifyUser(
                    function (isSuccess, didLogin) {
                        if (isSuccess)
                        {
                            doSubmitReply($commentPane, $form, didLogin);
                        }
                        else
                        {
                            $form.find('textarea:first').focus();
                        }
                    }, 'You must have an account to comment or rate a dataset');
            }
            else
            {
                doSubmitReply($commentPane, $form);
            }
        };

        function doSubmitReply($commentPane, $form, redirectAfter)
        {
            var config = $commentPane.data('config-infoPaneComments');
            $form.addClass(config.disabledClass);
            $(window).resize();
            var requestData = $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "POST",
                dataType: "html",
                data: requestData,
                success: function(responseData)
                {
                    var $resp = $(responseData);
                    $form.removeClass(config.disabledClass);

                    // Update the summary header
                    $commentPane.find(config.headerSelector)
                        .replaceWith($resp.children(config.headerSelector));
                    $commentPane.find(config.showFormSelector).click(
                        function (e) { showFormClick($commentPane, e); });

                    // Add the new comment
                    var $newComment = $resp.children(config.childCommentSelector);
                    if ($newComment.length > 0)
                    {
                        var $parentComment = $form
                            .closest(config.childCommentSelector);
                        var $addedItem;
                        if ($parentComment.length > 0)
                        {
                            $addedItem = $newComment.insertAfter($parentComment);
                        }
                        else
                        {
                            $parentComment = $form.closest(config.commentSelector);
                            var $childContainer =
                                $parentComment.find(config.childContainerSelector);
                            $childContainer.removeClass(config.hiddenClass)
                                .children().removeClass('first');
                            $addedItem = $newComment.prependTo($childContainer)
                                .addClass('first');
                            $parentComment.find(config.expanderSelector)
                                .removeClass(config.hiddenClass);
                        }

                        $form.closest(config.commentSelector)
                            .find(config.expanderSelector)
                            .addClass(config.expandedClass)
                            .siblings(config.childContainerSelector)
                            .removeClass(config.collapsedClass);
                        $addedItem.find(config.actionSelector
                            + ':not(.' + config.skipActionClass + ')')
                            .click(function (e) { actionClick($commentPane, e); });
                    }

                    hideAllForms($commentPane);

                    if (redirectAfter)
                    {
                        if ($newComment.length > 0)
                        {
                            var commentId = $newComment.attr('id').split('_')[1];
                        }
                        redirect($form, commentId);
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

            var href = $link.attr('href');
            var hrefPieces = href.slice(href.indexOf('#') + 1).split('_');
            var $form = $link.closest('form');
            var reqObj = {'comment[id]': hrefPieces[1]};
            var isAjaxAction = true;
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
                case 'reply':
                    isAjaxAction = false;
                    $link.closest(config.commentSelector)
                        .find(config.replySelector)
                        .insertAfter($link.closest(config.replySiblingSelector))
                        .removeClass(config.hiddenClass)
                        .find(config.replyFocusSelector).focus().end()
                        .find(config.parentInputSelector).val(hrefPieces[1]);
                    $(window).resize();
                    break;
            }

            if (isAjaxAction)
            {
                if (blist.util.inlineLogin)
                {
                    blist.util.inlineLogin.verifyUser(
                        function (isSuccess, didLogin) {
                            if (isSuccess)
                            {
                                doAction($commentPane, $link, $form,
                                    reqObj, didLogin);
                            }
                        },
                        'You must have an account to flag or rate a comment');
                }
                else
                {
                    doAction($commentPane, $link, $form, reqObj);
                }
            }
        };

        function doAction($commentPane, $link, $form, reqObj, redirectAfter)
        {
            var config = $commentPane.data('config-infoPaneComments');
            $link.addClass(config.actionDoneClass);
            var requestData = $.param(reqObj) + "&" +
                $.param($form.find(":input"));
            $.ajax({
                url: $form.attr("action"),
                type: "PUT",
                dataType: "json",
                data: requestData,
                success: function()
                {
                    if (redirectAfter)
                    {
                        redirect($form, reqObj['comment[id]']);
                    }
                }
            });
        };

        function redirect($form, commentId)
        {
            var href = $form.attr('action')
                .match(/((\/[a-zA-Z0-9_\-]+){1,2}\/\w{4}-\w{4})/)[1];
            window.location = href +
                '?metadata_pane=tabComments' +
                (commentId ? '&comment=' + commentId : '')
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

        function expanderClick($commentPane, e)
        {
            var config = $commentPane.data('config-infoPaneComments');
            e.preventDefault();
            $(e.currentTarget).toggleClass(config.expandedClass)
                .siblings(config.childContainerSelector)
                .toggleClass(config.collapsedClass);
            $(window).resize();
        };
    };

     // default options
     $.fn.infoPaneComments.defaults = {
        actionDoneClass: 'actionDone',
        actionSelector: '.actions a',
        cancelSelector: 'a[href=#cancel_comment]',
        clearableInputSelector: 'input[type=text], textarea',
        childCommentSelector: '.childWrapper',
        childContainerSelector: '.childContainer',
        collapsedClass: 'collapsed',
        commentSelector: '.comment',
        commentListSelector: '.commentList',
        disabledClass: 'disabled',
        expandedClass: 'expanded',
        expanderSelector: '.expander',
        focusSelector: 'input[type=text]',
        formSelector: 'form.postComment',
        footerSelector: '.footer',
        headerSelector: '.infoContentHeader',
        hiddenClass: 'hidden',
        initialComment: null,
        infoTabsSelector: '.summaryTabs',
        paginationContainer: '.commentPagination',
        parentInputSelector: '.parentInput',
        ratingInputSelector: '.selfRating input',
        ratingUISelector: '.selfRating .rating',
        replySelector: '.replyComment',
        replyFocusSelector: 'textarea',
        replySiblingSelector: '.actions',
        skipActionClass: 'doFullReq',
        showFormSelector: 'a.postComment',
        topFormSelector: '.infoContent > form.postComment'
     };

})(jQuery);
