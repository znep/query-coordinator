(function($) {
  var PAGE_SIZE = 20;

  var renderViews = function(cpObj) {
    if (cpObj._viewList.length < 1) {
      cpObj._$section.addClass('noResults');
      return null;
    }

    var items = cpObj._viewList;
    if (!$.isBlank(cpObj._currentShow) && cpObj._currentShow != 'all') {
      items = _.select(items, function(v) {
        if (cpObj._currentShow === 'data_lens') {
          return v.type === 'data_lens' || v.type === 'visualization';
        } else {
          return v.type === cpObj._currentShow;
        }
      });
    }

    if (!$.isBlank(cpObj._currentSearch)) {
      items = _.select(items, function(v) {
        return v.name.toLowerCase().indexOf(cpObj._currentSearch) >= 0 ||
          v.owner.displayName.toLowerCase().indexOf(cpObj._currentSearch) >= 0;
      });
    }

    var $ul = cpObj._$section.find('.itemsContent ul.itemsList');
    $ul.empty();

    if (items.length < 1) {
      cpObj._$section.addClass('emptySearch');
      return;
    }
    cpObj._$section.removeClass('emptySearch');

    items = _.sortBy(items, function(v) {
      if (cpObj._currentSort.startsWith('date')) {
        return Math.max(v.viewLastModified, v.createdAt) *
          (cpObj._currentSort == 'dateDescending' ? -1 : 1);
      } else if (cpObj._currentSort == 'alphaAscending') {
        return v.name.toLowerCase();
      } else if (cpObj._currentSort == 'popularity') {
        var vc = v.viewCount || 0;
        var len = 10;
        while (vc.length < len) {
          vc = '0' + vc;
        }
        return (v.owner.id == v.tableAuthor.id ? 'a' : 'z') +
          vc + v.name.toLowerCase();
      } else if (cpObj._currentSort == 'publicationDate') {
        return (v.publicationDate || 0) * -1;
      }
    });

    var rendered = 0;
    var remaining = items.length;
    cpObj._renderBlock = function(skipAnimation) {
      if (remaining <= 0) {
        return;
      }
      _.each(items.slice(rendered, rendered + PAGE_SIZE), function(v) {
        var $li = $.renderTemplate('viewItemContainer', {
          view: v,
          typeClass: cpObj._typeClass
        }, {
          '.viewIcon@title': function(a) {
            return a.context.view.displayName.capitalize();
          },
          '.viewIcon@class+': function(a) {
            var styleClass = a.context.view.styleClass;
            styleClass = styleClass.replace('Visualization', 'Data_lens');
            return 'type' + styleClass;
          },
          '.icon@class+': function(a) {
            var styleClass = a.context.view.styleClass;
            styleClass = styleClass.replace('Visualization', 'Data_lens');
            if (styleClass === 'Data_lens') {
              return 'icon-cards';
            } else {
              return '';
            }
          },
          '.nameLink@href': 'view.url',
          '.name': 'view.name!',
          '.name@title': 'view.name',
          '.pubDate': function(a) {
            return moment((a.context.view.publicationDate || 0) * 1000).format('LLL');
          },
          '.authorLine .date': function(a) {
            var date = new Date(
              // See also View#last_activity
              1000 * Math.max(
                a.context.view.viewLastModified || 0,
                a.context.view.createdAt || 0,
                a.context.view.rowsUpdatedAt || 0
              )
            );
            // See also common/dates.js
            var dateFormat = (blist.locale === 'en' || blist.locale === '') ? 'MMMM D, YYYY' : 'LL';
            return moment(date).format(dateFormat);
          },
          '.description': function(a) {
            if ($.isBlank(a.context.view.description)) {
              return '';
            }

            // We have an HTML-string problem. The about/edit-metadata page
            // accepts HTML strings (and expects some tags to be rendered),
            // and the rich-text editor also does the same. However, they
            // are encoded in different ways. The net effect is that we
            // are forced to jump through some serious hoops in order to
            // render a description safely; it may not be trivially possible
            // to ensure that same content is rendered in both contexts.
            // Fortunately, according to current AC, all we want to do here
            // is keep links - no other formatting needs to be preserved.
            var sanitizeSettings = {
              ALLOWED_TAGS: ['a'],
              ALLOWED_ATTR: ['href', 'rel', 'target']
            };
            var strippedContent = DOMPurify.sanitize(a.context.view.description, sanitizeSettings);

            // Because of the above issue, we need to try a little harder
            // to ensure that things we want to be links are, in fact, links.
            var nodeText = [];
            var linkifyNodeText = function() {
              if (this.nodeType === 3) {
                nodeText.push(this.textContent.linkify('rel="nofollow noreferrer external"'));
              } else {
                var $node = $(this);
                if ($node.is(':not(a)')) {
                  $node.contents().each(linkifyNodeText);
                } else {
                  nodeText.push(this.outerHTML);
                }
              }
            };

            // In effect, we sanitize twice and only linkify when we're not
            // already inside a link.
            $('<p>' + strippedContent + '</p>').contents().each(linkifyNodeText);
            return DOMPurify.sanitize(nodeText.join(''), sanitizeSettings);
          },
          '.deleteViewLink@class+': function(a) {
            var hasDeleteRight = _.include(a.context.view.rights, blist.rights.view.DELETE_VIEW);
            return hasDeleteRight ? '' : 'hide';
          },
          '.viewItem@class+': 'typeClass'
        });

        $li.data('view', v);

        if (v.id == cpObj._view.id) {
          $li.addClass('current');
        }

        if (v.owner.id == v.tableAuthor.id) {
          $li.addClass('ownerItem');
        }

        // Need to wait until this is visible so the height measures
        // correctly
        _.defer(function() {
          $li.expander({
            contentSelector: '.description'
          });
        });

        $ul.append($li);
      });

      var $moreLink = cpObj._$section.find('.moreLink');
      rendered += PAGE_SIZE;
      remaining -= PAGE_SIZE;
      if (remaining > 0) {
        $moreLink.removeClass('hide');
        if (remaining == 1) {
          $moreLink.text($.t('screens.ds.grid_sidebar.view_list.pagination.last'));
        } else {
          $moreLink.text($.t('screens.ds.grid_sidebar.view_list.pagination.next', {
            count: Math.min(remaining, PAGE_SIZE)
          }));
        }
      } else {
        $moreLink.addClass('hide');
      }

      if (!skipAnimation) {
        var $scrollContainer = cpObj._$section.closest('.scrollContent');
        $scrollContainer.animate({
          scrollTop: Math.min(
            // either the height of the appended elements,
            cpObj._$section.outerHeight(true) - $scrollContainer.height(),
            // or the height of the scroll container.
            $scrollContainer.scrollTop() + $scrollContainer.height() -
            $moreLink.outerHeight(true))
        }, 'slow');
      }
    };
    cpObj._renderBlock(true);
  };

  var defaultSorts = [{
    text: $.t('screens.ds.grid_sidebar.view_list.sort.popularity'),
    name: 'popularity'
  }, {
    text: $.t('screens.ds.grid_sidebar.view_list.sort.dateDescending'),
    name: 'dateDescending'
  }, {
    text: $.t('screens.ds.grid_sidebar.view_list.sort.dateAscending'),
    name: 'dateAscending'
  }, {
    text: $.t('screens.ds.grid_sidebar.view_list.sort.alphaAscending'),
    name: 'alphaAscending'
  }];

  var setupSection = function(cpObj) {
    var $sortMenu = cpObj._$section.find('.sortMenu');
    $sortMenu.menu({
      menuButtonContents: $.t('screens.ds.grid_sidebar.view_list.sort_title'),
      menuButtonTitle: $.t('screens.ds.grid_sidebar.view_list.sort_title'),
      noFlip: true,
      contents: _.map(defaultSorts, function(s) {
        return {
          text: s.text,
          href: '#' + s.name,
          className: 'none' + (s.name == cpObj._currentSort ? ' checked' : '')
        };
      })
    });

    $sortMenu.find('.menuDropdown a').click(function(e) {
      e.preventDefault();
      var $a = $(this);
      if ($a.closest('li').is('.checked')) {
        return;
      }

      $a.closest('.menuDropdown').find('.checked').removeClass('checked');
      $a.closest('li').addClass('checked');

      cpObj._currentSort = $.hashHref($a.attr('href'));
      renderViews(cpObj);
    });

    var $showMenu = cpObj._$section.find('.showMenu');
    if (!$showMenu.hasClass('hide')) {

      var typeOptions = _.map(['chart', 'map', 'calendar', 'filter', 'data_lens', 'api', 'grouped', 'form'], function(type) {
        return {
          text: $.t('core.view_types_plural.' + type),
          className: type.replace(/^(.)(.+)/, function(_match, firstLetter, remainder) {
            return 'type' + firstLetter.toUpperCase() + remainder;
          }),
          href: '#' + type,
          onlyIf: _.any(cpObj._viewList, function(view) {
            return view.type === type;
          })
        };
      });

      $showMenu.menu({
        menuButtonContents: $.t('screens.ds.grid_sidebar.view_list.filter_title'),
        menuButtonTitle: $.t('screens.ds.grid_sidebar.view_list.filter_title'),
        contents: [{
          text: $.t('screens.ds.grid_sidebar.view_list.filter.all'),
          className: 'none checked',
          href: '#all'
        }].concat(typeOptions)
      });

      // styling for the data lens icon is done differently because our sprite
      // is out of date and it's not clear that we're going to update it
      $showMenu.find('.menuDropdown .typeData_lens .icon').addClass('icon-cards');

      $showMenu.find('.menuDropdown a').click(function(e) {
        e.preventDefault();
        var $a = $(this);
        if ($a.closest('li').is('.checked')) {
          return;
        }

        cpObj._currentShow = $.hashHref($a.attr('href'));

        var $old = $a.closest('.menuDropdown').find('.checked');
        $old.removeClass('checked').addClass('type' + $.hashHref($old.children('a').attr('href')).capitalize());
        $a.closest('li').addClass('checked').removeClass('type' + cpObj._currentShow.capitalize());

        renderViews(cpObj);
      });
    }

    cpObj._$section.find('.textPrompt').example(function() {
      return $(this).attr('title');
    });

    var $search = cpObj._$section.find('.viewSearch');
    var $clearSearch = cpObj._$section.find('.clearViewSearch');

    var doSearch = function() {
      var s = $search.val().toLowerCase();
      if ($search.is('.prompt')) {
        s = '';
      }
      $clearSearch.toggle(!$.isBlank(s));

      cpObj._currentSearch = s;
      renderViews(cpObj);
    };

    $clearSearch.click(function(e) {
      e.preventDefault();
      $search.val('');
      $search.focus().blur();
      doSearch();
    });

    $search.blur(function() {
        _.defer(doSearch);
      }).
      closest('form').submit(function(e) {
        e.preventDefault();
        _.defer(doSearch);
      });

    cpObj._$section.find('.moreLink').click(function(e) {
      e.preventDefault();
      if (_.isFunction(cpObj._renderBlock)) {
        cpObj._renderBlock();
      }
    });

    renderViews(cpObj);
  };



  $.Control.extend('pane_viewList', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);

      cpObj._typeClass = 'view';
      cpObj._currentSort = 'popularity';
      cpObj._currentShow = 'all';

      cpObj.$dom().delegate('.deleteViewLink', 'click', function(e) {
        e.preventDefault();

        var $li = $(this).closest('li');
        var v = $li.data('view');
        if (confirm($.t('screens.ds.grid_sidebar.view_list.delete_confirm', {
            name: v.name
          }))) {
          var redirDS;
          var deletedCallback = function() {
            $li.remove();
            cpObj._viewList.splice(_.indexOf(cpObj._viewList, v), 1);
            if (!$.isBlank(blist.datasetPage)) {
              blist.datasetPage.$moreViewsTab.contentIndicator().setText(cpObj._viewList.length);
            }

            if (!$.isBlank(redirDS)) {
              redirDS.redirectTo();
            }
          };

          if (cpObj._view.id == v.id) {
            cpObj._view.getParentDataset(function(parDS) {
              if (!$.isBlank(parDS)) {
                redirDS = parDS;
              }
            });
          }
          v.remove(deletedCallback);
        }
      });
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.view_list.views.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.view_list.views.subtitle');
    },

    _getSections: function() {
      return [{
        customContent: {
          template: 'itemsListBlock',
          data: {
            resultType: 'view'
          },
          callback: function($s) {
            var cpObj = this;
            cpObj._startProcessing();
            cpObj._$section = $s;

            cpObj._view.getRelatedViews(
              function(v) {
                cpObj._finishProcessing();

                cpObj._viewList = v;

                setupSection(cpObj);
              });
          }
        }
      }];
    }
  }, {
    name: 'viewList'
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.moreViews) || !blist.sidebarHidden.moreViews.views) {
    $.gridSidebar.registerConfig('moreViews.viewList', 'pane_viewList', 1);
  }


  $.Control.extend('pane_snapshotList', {
    _init: function() {
      var cpObj = this;
      cpObj._super.apply(cpObj, arguments);

      cpObj._typeClass = 'snapshot';
      cpObj._currentSort = 'publicationDate';
      cpObj._currentShow = 'all';

      cpObj.$dom().delegate('.deleteViewLink', 'click', function(e) {
        e.preventDefault();

        var $li = $(this).closest('li');
        var v = $li.data('view');
        if (confirm($.t('screens.ds.grid_sidebar.view_list.delete_snapshot_confirm', {
            name: v.name,
            date: new Date((v.publicationDate || 0) * 1000).format('F d, Y g:ia')
          }))) {
          var redirDS;
          var deletedCallback = function() {
            $li.remove();
            cpObj._viewList.splice(_.indexOf(cpObj._viewList, v), 1);

            if (!$.isBlank(redirDS)) {
              redirDS.redirectTo();
            }
          };

          if (cpObj._view.id == v.id) {
            cpObj._view.getPublishedDataset(function(pubDS) {
              if (!$.isBlank(pubDS)) {
                redirDS = pubDS;
              }
            });
          }
          v.remove(deletedCallback);
        }
      });
    },

    getTitle: function() {
      return $.t('screens.ds.grid_sidebar.view_list.snapshots.title');
    },

    getSubtitle: function() {
      return $.t('screens.ds.grid_sidebar.view_list.snapshots.subtitle');
    },

    _getSections: function() {
      return [{
        customContent: {
          template: 'itemsListBlock',
          directive: {
            '.sortMenu@class+': 'hide',
            '.showMenu@class+': 'hide'
          },
          data: {
            resultType: 'dataset',
            hide: 'hide'
          },
          callback: function($s) {
            var cpObj = this;
            cpObj._startProcessing();
            cpObj._$section = $s;

            cpObj._view.getSnapshotDatasets(
              function(sd) {
                cpObj._finishProcessing();

                cpObj._viewList = sd;

                setupSection(cpObj);
              });
          }
        }
      }];
    }
  }, {
    name: 'snapshotList'
  }, 'controlPane');

  if ($.isBlank(blist.sidebarHidden.moreViews) || !blist.sidebarHidden.moreViews.snapshots) {
    $.gridSidebar.registerConfig('moreViews.snapshotList', 'pane_snapshotList', 2);
  }

})(jQuery);
