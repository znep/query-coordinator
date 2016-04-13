(function($)
{
    var PAGE_SIZE = 10;

    var renderSection = function(cpObj) {
      cpObj._$section.removeClass('noResults'); // If we go from 0 to 1 results!
      if (cpObj._backupList.length < 1) {
        cpObj._$section.addClass('noResults');
        return;
      }
      var $ul = cpObj._$section.find('.itemsContent ul.itemsList');
      $ul.empty();

      var rendered = 0;
      var remaining = cpObj._backupList.length;
      cpObj._renderBlock = function(skipAnimation) {

        if (remaining <= 0) { return; }

        _.each(cpObj._backupList.slice(rendered, rendered + PAGE_SIZE), function(backup) {
          var $li = $.renderTemplate('backupItemContainer', { backup: backup }, {
            '.backupLink@href': 'backup.downloadLinks.csv',
            '.backupTime': function(a) {
              // I have no idea what 'a' is, but it has a context!
              return a.context.backup.moment.format('llll');
            }
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
            $moreLink.text(
              $.t('screens.ds.grid_sidebar.view_list.pagination.next',
                { count: Math.min(remaining, PAGE_SIZE) })
            );
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

      cpObj._$section.find('.moreLink').click(function(e) {
        e.preventDefault();
        if (_.isFunction(cpObj._renderBlock)) {
          cpObj._renderBlock();
        }
      });
    };

    $.Control.extend('pane_backupList', {
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
              '.showMenu@class+': 'hide',
              '.searchWrapper@class+': 'hide'
            },
            data: {
              resultType: 'dataset',
              hide: 'hide'
            },
            callback: function($s) {
              var cpObj = this;
              var processing = true;
              cpObj._startProcessing();
              cpObj._$section = $s;

              var fetchBackups = function() {
                cpObj._view.getBackups(function(sd) {
                  if (processing) {
                    cpObj._finishProcessing();
                    processing = false;
                  }

                  cpObj._backupList = sd;

                  renderSection(cpObj);
                });
              };

              cpObj._$section.find('.createBackup').
                removeClass('hide').
                click(function() {
                  cpObj._view.makeBackup(fetchBackups);
                });

              fetchBackups();
            }
          }
        }];
      }
    }, { name: 'backupList' }, 'controlPane');

    if ($.isBlank(blist.sidebarHidden.moreViews) || !blist.sidebarHidden.moreViews.backups)
    { $.gridSidebar.registerConfig('moreViews.backupList', 'pane_backupList', 3); }

})(jQuery);
