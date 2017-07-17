/* eslint-env node */
var path = require('path');
var _ = require('lodash');

var common = require('./common');
var identifier = path.basename(__filename, '.config.js');

module.exports = _.defaultsDeep({
  context: path.resolve(common.frontendRoot, 'public/javascripts'),
  entry: {
    'base': [
      './plugins/date.js',
      './plugins/jqModal.js',
      './plugins/jquery.bt.js',
      './plugins/jquery.cookies.2.1.0.min.js',
      './plugins/jquery.example.js',
      './plugins/json2.js',
      './plugins/jquery.sizes.min.js',
      './plugins/jquery.tache.js',
      './plugins/jquery.uniform.js',
      './plugins/jquery.validate.js',
      './plugins/jquery.validate.additional-methods.js',
      './plugins/pure.js',
      './plugins/jquery-ui-1.8.23.custom.js',
      './plugins/lodash.js',
      './plugins/moment-with-locales.js',
      './plugins/moment-timezone-with-data-2012-2022.js',
      './plugins/jstz.js',
      './util/namespace.js',
      './plugins/ua-parser.min.js',
      './util/compat.js',
      './plugins/inheritance.js',
      './controls/base-control.js',
      './controls/loading-spinner.js',
      './util/util.js',
      './util/load-translations.js',
      './util/humane-number.js',
      './util/humane-date.js',
      './util/color.js',
      './util/events.js',
      './util/base-model.js',
      './util/socrata-server.js',
      './util/page.js',
      './util/caret.js',
      './util/markup.js',
      './util/alert-override.js',
      './util/google-analytics.js',
      './util/user.js',
      './util/domain/configuration.js',
      './util/dataset/column-container.js',
      './util/dataset/column.js',
      './util/dataset/row-set.js',
      './util/dataset/dataset.js',
      './util/dataset/calendar.js',
      './util/dataset/chart.js',
      './util/dataset/form.js',
      './util/dataset/map.js',
      './util/view-cache.js',
      './util/styles.js',
      './util/templates.js',
      './util/filter.js',
      './util/datatypes.js',
      './util/a11y.js',
      './controls/modal-dialogs.js',
      './plugins/awesomemarkup.js',
      './controls/socrata-messaging.js',
      './controls/text-prompt.js',
      './controls/values.js',
      './controls/dropdown-menu.js',
      './controls/menu.js',
      './util/socrata-analytics.js',
      './screens/all-screens.js',
      './controls/session-timeout-modal.js'
    ],
    'new-base': [
      './plugins/awesomemarkup.js',
      './plugins/backbone.js',
      './util/backbone-exts.js',
      './plugins/backbone.orderable.js',
      './screens/govstat/goals/models.js'
    ],
    'shared-editors': [
      './controls/editors/editor-base.js',
      './controls/editors/text-editor.js',
      './plugins/datepicker.js',
      './controls/editors/date-editor.js',
      './plugins/jquery.maskedinput.js',
      './controls/editors/number-editor.js',
      './controls/editors/percent-editor.js',
      './controls/editors/money-editor.js',
      './controls/editors/email-editor.js',
      './controls/editors/url-editor.js',
      './controls/editors/phone-editor.js',
      './controls/editors/location-editor.js',
      './controls/editors/wkt-editor.js',
      './controls/combo.js',
      './controls/editors/lookupList-editor.js',
      './controls/editors/checkbox-editor.js',
      './controls/editors/stars-editor.js',
      './tiny_mce/tiny_mce_src.js',
      './controls/editors/html-editor.js',
      './plugins/ajaxupload.js',
      './controls/upload-dialog.js',
      './controls/editors/blob-editor.js',
      './controls/editors/document-editor.js',
      './controls/editors/photo-editor.js'
    ],
    'canvas': [
      './plugins/lab.js',
      './plugins/waypoints-2.0.5.js',
      './util/asset-loading.js',
      './component/util/style-config.js',
      './component/data-context.js',
      './util/string-substitute.js',
      './component/component.js',
      './component/comp-container.js',
      './component/configurator-hook.js',
      './component/functional/event-connector.js',
      './component/content/list-item-container.js',
      './component/content/paged-container.js',
      './component/content/carousel-container.js',
      './component/content/multi-paged-container.js',
      './component/content/catalog.js',
      './component/content/comments.js',
      './component/content/fixed-container.js',
      './component/content/grid-container.js',
      './component/content/menu.js',
      './component/content/picture.js',
      './component/content/header.js',
      './component/content/text.js',
      './component/content/formatted-text.js',
      './component/content/safe-html.js',
      './component/content/title.js',
      './component/data/charts.js',
      './component/data/govstat.js',
      './component/data/map.js',
      './component/data/map-layer.js',
      './component/data/repeater.js',
      './component/data/simple-table.js',
      './component/data/table.js',
      './component/data/tabular-export.js',
      './component/data/visualization.js',
      './component/actions/button.js',
      './component/actions/download.js',
      './component/actions/print.js',
      './component/actions/select.js',
      './component/actions/share.js',
      './component/input/dataset-list-filter.js',
      './component/input/geolocator.js',
      './component/input/inline-filter.js',
      './component/input/pager.js',
      './component/input/search.js',
      './component/input/sort.js'
    ],
    'configurator': [
      './plugins/awesomemarkup.js',
      './plugins/jquery.colorPicker.js',
      './plugins/colorpicker.js',
      './plugins/jquery.awesomecomplete.js',
      './controls/full-screen.js',
      './controls/panes/base-pane.js',
      './plugins/rangy-core.js',
      './plugins/rangy-textrange.js',
      './plugins/rangy-selectionsaverestore.js',
      './controls/native-draggable.js',
      './controls/native-drop-target.js',
      './controls/grid-sidebar.js',
      './component/configurator/configurator.js',
      './component/configurator/properties-editor.js',
      './component/configurator/properties-palette.js',
      './component/configurator/component-palette.js',
      './component/configurator/cf-edit-log.js',
      './component/configurator/cf-side.js',
      './component/configurator/cf-property.js',
      './component/configurator/template.js',
      './component/context-picker.js',
      './component/configurator/edit-actions/cf-edit-add.js',
      './component/configurator/edit-actions/cf-edit-move.js',
      './component/configurator/edit-actions/cf-edit-remove.js',
      './component/configurator/edit-actions/cf-edit-properties.js',
      './component/design/partial-text.js',
      './component/functional/string-resolver.js'
    ],
    'sanitize-html': [
      './plugins/uri.js',
      './plugins/html4-defs.js',
      './plugins/html-sanitizer.js',
      './component/util/html-sanitizer-utils.js'
    ],
    'markdown-render': [
      './plugins/showdown.js',
      './component/util/markdown-utils.js'
    ],
    'markdown-create': [
      './plugins/rangy-core.js',
      './plugins/rangy-textrange.js',
      './plugins/rangy-selectionsaverestore.js',
      './plugins/hallo.js',
      './controls/hallo-plugins.js',
      './plugins/hallo.betterlink.js',
      './plugins/html2markdown.js',
      './plugins/htmldomparser.js',
      './component/util/markdown-utils.js'
    ],
    'autolink-html': [
      './component/util/autolinker.js'
    ],
    'template-instantiator': [
      './controls/wizard.js',
      './screens/template-instantiation.js'
    ],
    'base-control': [
      './plugins/jquery.colorPicker.js',
      './controls/panes/base-pane.js'
    ],
    'shared-calendar': [
      './plugins/fullcalendar.js',
      './controls/rich-render-library.js',
      './controls/base-visualization.js',
      './controls/calendars/default-calendar.js'
    ],
    'shared-table-render': [
      './plugins/wellknown.js',
      './controls/table/model.js',
      './controls/table/table.js',
      './controls/table/table_nav.js',
      './controls/scrollable.js',
      './controls/column-menu.js',
      './controls/dataset-controls.js',
      './controls/table/dataset-grid.js',
      './controls/table/socrata-viz-dataset-grid.js'
    ],
    'shared-map': [
      './plugins/OpenLayers.js',
      './plugins/proj4js.js',
      './plugins/heatmap.js',
      './plugins/heatmap-openlayers.js',
      './controls/rich-render-library.js',
      './controls/base-visualization.js',
      './controls/maps/map-wrapper.js',
      './controls/maps/base-datalayer.js',
      './controls/maps/ol-extensions.js',
      './controls/maps/boundary-map.js',
      './controls/maps/clustered-map.js',
      './controls/maps/mondara-map.js',
      './controls/maps/external-esri-map.js',
      './controls/maps/rastermap-map.js'
    ],
    'shared-map-configuration': [
      './controls/panes/map-config.js'
    ],
    'shared-chart': [
      './controls/panes/chart-config.js',
      './controls/base-visualization.js',
      './controls/rich-render-library.js',
      './controls/charts/base-chart.js',
      './controls/charts/highcharts.js',
      './controls/charts/jit.js',
      './controls/charts/d3-impl/d3.base.js',
      './controls/charts/d3-impl/d3.base.dynamic.js',
      './controls/charts/d3-impl/d3.base.seriesGrouping.js',
      './controls/charts/d3-impl/d3.base.legend.js',
      './controls/charts/d3-impl/d3.virt.scrolling.js',
      './controls/charts/d3-impl/d3.impl.bar.js',
      './controls/charts/d3-impl/d3.impl.line.js',
      './controls/charts/d3-impl/d3.layout-utils.js',
      './controls/charts/d3-impl/d3.impl.pie.js',
      './controls/charts/d3-impl/d3.impl.bubble.js',
      './controls/charts/d3-impl/d3.impl.timeline.js'
    ],
    'shared-visualization': [
      './controls/render-type-manager.js'
    ],
    'shared-richRenderers': [
      './controls/dataset-controls.js',
      './controls/navigation.js',
      './controls/rich-render-library.js',
      './controls/scrollable.js',
      './controls/column-menu.js',
      './controls/fatrow-render-type.js',
      './controls/page-render-type.js'
    ],
    'shared-blob': [
      './controls/blob-dataset.js'
    ],
    'browse-select-dataset': [
      './screens/browse-select-dataset.js'
    ],
    'browse-select-georegion': [
      './screens/browse-select-georegion.js'
    ],
    'admin-canvas-pages': [
      './plugins/jquery.tablesorter.js',
      './controls/combination-list.js',
      './screens/admin-canvas-pages-screen.js'
    ],
    'admin-datasets': [
      './plugins/jquery.dropdown.js',
      './util/serialize.js',
      './screens/admin-config-common.js',
      './screens/admin-datasets.js'
    ],
    'admin-browse-widget': [
      './plugins/jquery.colorPicker.js',
      './plugins/colorpicker.js',
      './controls/panes/base-pane.js',
      './controls/grid-sidebar.js',
      './screens/admin-customizer.js',
      './screens/admin-browse-widget-create.js'
    ],
    'admin-users': [
      './controls/admin-buttons.js',
      './plugins/jquery.tablesorter.js',
      './controls/combination-list.js',
      './screens/admin-users-screen.js'
    ],
    'admin-home': [
      './util/serialize.js',
      './controls/admin-buttons.js',
      './plugins/jquery.tablesorter.js',
      './plugins/ajaxupload.js',
      './controls/combination-list.js',
      './controls/image-uploader.js',
      './screens/admin-config-common.js',
      './screens/admin-home.js'
    ],
    'admin-metadata': [
      './plugins/jquery.awesomereorder.js',
      './controls/editable-list.js',
      './controls/admin-buttons.js',
      './screens/admin-metadata-screen.js'
    ],
    'admin-moderation': [
      './plugins/jquery.tablesorter.js',
      './controls/combination-list.js',
      './screens/admin-moderation.js'
    ],
    'admin-metrics': [
      './screens/sitewide-analytics-shared.js',
      './screens/admin-metrics.js'
    ],
    'admin-routing-approval': [
      './util/approval.js',
      './util/dataset/approval-history.js',
      './controls/expander.js',
      './plugins/jquery.awesomecomplete.js',
      './controls/user-picker.js',
      './controls/dataset-controls.js',
      './screens/admin-routing-approval.js'
    ],
    'admin-sdp-templates': [
      './controls/admin-buttons.js',
      './plugins/jquery.tablesorter.js',
      './controls/combination-list.js',
      './screens/admin-sdp-templates.js'
    ],
    'admin-sdp-template': [
      './plugins/jquery.colorPicker.js',
      './plugins/colorpicker.js',
      './plugins/ajaxupload.js',
      './controls/upload-dialog.js',
      './controls/panes/base-pane.js',
      './controls/grid-sidebar.js',
      './screens/admin-customizer.js',
      './screens/admin-sdp-template.js'
    ],
    'admin-site-appearance': [
      './screens/site-appearance.js'
    ],
    'admin-story': [
      './plugins/colorpicker.js',
      './screens/admin-story.js'
    ],
    'admin-stories-appearance': [
      './plugins/jquery.colorPicker.js',
      './plugins/colorpicker.js',
      './controls/panes/base-pane.js',
      './controls/grid-sidebar.js',
      './controls/stories.js',
      './screens/admin-customizer.js',
      './screens/admin-stories-appearance.js'
    ],
    'admin-federation': [
      './controls/admin-buttons.js',
      './plugins/jquery.tablesorter.js',
      './controls/combination-list.js',
      './screens/admin-federation-screen.js'
    ],
    'admin-collapse-nav': [
      './screens/admin-collapse-nav.js'
    ],
    'browse-control': [
      './plugins/jquery.tagcloud.js',
      './controls/dataset-controls.js',
      './controls/expander.js',
      './controls/stars.js',
      './controls/rich-render-library.js',
      './controls/row-search-render-type.js',
      './screens/browse.js'
    ],
    'browse2-control': [
      './controls/dataset-controls.js',
      './screens/browse2.js'
    ],
    'screen-nominations': [
      './plugins/ajaxupload.js',
      './util/base-model.js',
      './util/socrata-server.js',
      './util/nomination.js',
      './screens/nominations-shared.js',
      './screens/nominations.js'
    ],
    'screen-nomination': [
      './util/serialize.js',
      './util/base-model.js',
      './util/socrata-server.js',
      './util/nomination.js',
      './controls/feed-list.js',
      './screens/nominations-shared.js',
      './screens/nomination.js'
    ],
    'screen-internal': [
      './plugins/jquery.awesomecomplete.js',
      './screens/internal.js',
      './plugins/ZeroClipboard.js'
    ],
    'screen-videos': [
      './plugins/jquery.quicksand.js',
      './screens/videos.js'
    ],
    'widgets-show': [
      './plugins/jquery.tablesorter.js',
      './controls/full-screen.js',
      './controls/combination-list.js',
      './controls/embed-form.js',
      './plugins/lab.js',
      './util/asset-loading.js',
      './controls/dataset-controls.js',
      './controls/feed-list.js',
      './controls/stars.js',
      './controls/scrollTabs.js',
      './controls/form-inliner.js',
      './controls/render-type-manager.js',
      './screens/widget.js'
    ],
    'dataset-about-full': [
      './plugins/lab.js',
      './util/asset-loading.js',
      './controls/stars.js',
      './controls/dataset-controls.js',
      './controls/blob-dataset.js',
      './controls/full-screen.js',
      './screens/dataset-about.js'
    ],
    'dataset-new': [
      './util/serialize.js',
      './util/datasync.js',
      './util/interpolator.js',
      './plugins/ajaxupload.js',
      './plugins/fileuploader.js',
      './plugins/blist.fileuploader.js',
      './plugins/jquery.awesomereorder.js',
      './controls/attachments-editor.js',
      './controls/wizard.js',
      './screens/import-pane.js',
      './screens/dataset-new.js',
      './screens/edit-license.js'
    ],
    'dataset-new-dsmui': [
      './screens/dataset-new-dsmui.js'
    ],
    'dataset-edit': [
      './util/datasync.js',
      './plugins/ajaxupload.js',
      './plugins/fileuploader.js',
      './plugins/blist.fileuploader.js',
      './plugins/jquery.awesomereorder.js',
      './controls/wizard.js',
      './screens/import-pane.js',
      './screens/dataset-edit.js',
      './util/interpolator.js'
    ],
    'dataset-metrics': [
      './screens/dataset-metrics.js'
    ],
    'dataset-show': [
      './plugins/jquery.colorPicker.js',
      './plugins/jquery.awesomecomplete.js',
      './plugins/jquery.awesomereorder.js',
      './plugins/jquery.tablesorter.js',
      './plugins/iscroll.js',
      './plugins/ajaxupload.js',
      './plugins/lab.js',
      './plugins/ZeroClipboard.js',
      './util/asset-loading.js',
      './controls/combination-list.js',
      './controls/wizard-prompt.js',
      './controls/popup-select.js',
      './controls/form-inliner.js',
      './controls/expander.js',
      './controls/feed-list.js',
      './controls/stars.js',
      './controls/content-indicator.js',
      './controls/user-picker.js',
      './controls/panes/base-pane.js',
      './controls/grid-sidebar.js',
      './controls/panes/about-dataset.js',
      './controls/panes/add-column.js',
      './controls/panes/api.js',
      './controls/panes/append-replace.js',
      './controls/panes/backups.js',
      './controls/panes/calendar-create.js',
      './controls/panes/chart-config.js',
      './controls/panes/chart-create.js',
      './controls/panes/column-order.js',
      './controls/panes/column-properties.js',
      './controls/panes/conditional-formatting.js',
      './controls/panes/data-lens-create.js',
      './controls/panes/delete-dataset.js',
      './controls/panes/download-dataset.js',
      './controls/panes/edit-redirect.js',
      './controls/panes/embed-sdp.js',
      './controls/panes/feed.js',
      './controls/panes/form-create.js',
      './controls/panes/map-config.js',
      './controls/panes/map-create.js',
      './controls/panes/odata.js',
      './controls/panes/permissions.js',
      './controls/panes/plagiarize-dataset.js',
      './controls/panes/print-dataset.js',
      './controls/panes/share-dataset.js',
      './controls/panes/show-hide.js',
      './controls/panes/sort-rollUp.js',
      './controls/panes/unified-filter.js',
      './controls/panes/unified-filter-sidebar.js',
      './controls/panes/view-list.js',
      './controls/dataset-controls.js',
      './controls/dataset-email.js',
      './controls/dataset-subscribe.js',
      './controls/embed-form.js',
      './controls/full-screen.js',
      './controls/format-options.js',
      './controls/pill-buttons.js',
      './controls/render-type-manager.js',
      './screens/dataset-show.js'
    ],
    'dataset-edit-metadata': [
      './plugins/ajaxupload.js',
      './controls/attachments-editor.js',
      './controls/image-uploader.js',
      './screens/dataset-edit-metadata.js',
      './screens/edit-license.js'
    ],
    'dataset-edit-rr': [
      './plugins/jquery.colorPicker.js',
      './controls/navigation.js',
      './controls/rich-render-library.js',
      './controls/panes/base-pane.js',
      './controls/grid-sidebar.js',
      './controls/dataset-controls.js',
      './controls/pill-buttons.js',
      './screens/dataset-edit-rr.js'
    ],
    'screen-dataset-thumbnail': [
      './plugins/jquery.imgareaselect.js',
      './screens/dataset-thumbnail.js'
    ],
    'screen-classic-visualization': [
      './controls/full-screen.js',
      './controls/dataset-controls.js',
      './plugins/lab.js',
      './util/asset-loading.js',
      './controls/render-type-manager.js',
      './screens/classic-visualization.js'
    ],
    'render-view-minimum': [
      './controls/dataset-controls.js',
      './plugins/lab.js',
      './util/asset-loading.js',
      './controls/render-type-manager.js'
    ],
    'shared-metrics': [
      './plugins/daterangepicker.jquery.js',
      './plugins/jquery.tablesorter.js',
      './plugins/highcharts.src.js',
      './plugins/vis/raphael.js',
      './plugins/vis/d34raphael.js',
      './plugins/vis/ie8compat.js',
      './controls/charts/metric-charts.js',
      './controls/metrics-shared.js',
      './controls/metrics.js'
    ],
    'internal-metrics': [
      './screens/internal-metrics.js'
    ],
    'screen-login-signup': [
      './plugins/lab.js',
      './util/asset-loading.js',
      './screens/login-shared.js',
      './screens/signup-screen.js'
    ],
    'screen-login-auth0': [
      './screens/login-auth0.js'
    ],
    'screen-forgot-password': [
      './screens/forgot-password-screen.js'
    ],
    'screen-reset-password': [
      './screens/reset-password-screen.js'
    ],
    'screen-profile': [
      './plugins/jquery.dropdown.js',
      './util/serialize.js',
      './screens/profile-screen.js'
    ],
    'screen-profile-edit': [
      './plugins/ajaxupload.js',
      './controls/image-uploader.js',
      './screens/profile-screen-edit.js'
    ],
    'screen-govstat-goals': [
      './plugins/rangy-core.js',
      './plugins/rangy-textrange.js',
      './plugins/rangy-selectionsaverestore.js',
      './plugins/hallo.js',
      './controls/hallo-plugins.js',
      './plugins/hallo.betterlink.js',
      './plugins/datepicker.js',
      './plugins/waypoints-2.0.5.js',
      './plugins/jquery.awesomereorder.js',
      './plugins/jquery.awesomecomplete.js',
      './controls/global-indicator.js',
      './plugins/ajaxupload.js',
      './controls/image-uploader.js',
      './controls/popup-select.js',
      './controls/icon-picker.js',
      './screens/govstat/goals/show.js',
      './screens/govstat/goals/markup.js',
      './screens/govstat/goals/views.js'
    ],
    'screen-govstat-dashboard': [
      './screens/govstat/dashboard.js'
    ],
    'screen-govstat-goal-page': [
      './plugins/jquery.columnizer.js',
      './screens/govstat/goal-page.js'
    ],
    'screen-govstat-manage': [
      './controls/global-indicator.js',
      './screens/govstat/manage.js'
    ],
    'odysseus-edit-base': [
      './plugins/rangy-core.js',
      './plugins/rangy-textrange.js',
      './plugins/rangy-selectionsaverestore.js',
      './plugins/hallo.js',
      './controls/hallo-plugins.js',
      './plugins/hallo.betterlink.js',
      './plugins/waypoints2.js',
      './plugins/colorpicker.js',
      './plugins/ajaxupload.js',
      './controls/icon-picker.js',
      './plugins/jquery.awesomereorder.js',
      './plugins/jquery.awesomebubble.js',
      './plugins/jquery.awesomecomplete.js'
    ],
    'unified-filter': [
      './controls/popup-select.js',
      './controls/panes/base-pane.js',
      './controls/panes/unified-filter.js',
      './controls/panes/unified-filter-sidebar.js'
    ],
    'feed-list': [
      './controls/feed-list.js'
    ],
    'share-dialogs': [
      './controls/dataset-email.js',
      './controls/dataset-subscribe.js'
    ],
    'download-inline': [
      './controls/form-inliner.js'
    // these can be removed with canvas 1.0, i thin
    ],
    'stories': [
      './controls/stories.js'
    ],
    'featured_views': [
      './controls/featured_views.js'
    ],
    'ticker-layout': [
      './controls/ticker_layout.js'
    ],
    'stars': [
      './controls/stars.js'
    ],
    'embed-form': [
      './controls/embed-form.js'
    // end remov
    ],
    'public-analytics': [
      './screens/sitewide-analytics-shared.js',
      './screens/public-analytics.js'
    ],
    'debug': [
      './util/debug.js'
    ],
    'errors': [
      './util/errors.js'
    ],
    'highcharts': [
      './plugins/highcharts.src.js'
    ],
    'jit': [
      './plugins/jit.js'
    ],
    'd3': [
      './plugins/vis/raphael.js',
      './plugins/vis/d34raphael.js',
      './plugins/vis/ie8compat.js'
    ],
    'd3-new': [
      './plugins/vis/d3.v3.js'
    ],
    'd3-iecompat': [
      './plugins/vis/r2d3.v3.js'
    ],
    'dotdotdot': [
      './plugins/jquery.dotdotdot.js'
    ],
    'dompurify': [
      './plugins/purify.min.js',
      './util/dompurify-extensions.js'
    ],
    'excanvas': [
      './plugins/excanvas.compiled.js'
    ],
    'oldie': [
      './screens/oldie.js'
    ],
    'ace': [
      './plugins/ace/ace.js',
      './plugins/ace/theme-idle_fingers.js',
      './plugins/ace/mode-json.js',
      './plugins/ace/mode-css.js',
      './plugins/ace/mode-html.js'
    ],
    'waypoints': [
      './plugins/waypoints-2.0.5.js'
    ],
    'content-editable': [
      './plugins/rangy-core.js',
      './plugins/rangy-textrange.js',
      './controls/content-editable.js'
    ],
    'image-uploader': [
      './plugins/ajaxupload.js',
      './controls/image-uploader.js'
    ],
    'awesomecomplete': [
      './plugins/jquery.awesomecomplete.js'
    ],
    'columnizer': [
      './plugins/jquery.columnizer.js'
    ],
    'tagcloud': [
      './plugins/jquery.tagcloud.js'
    ]
  },
  module: {
    preLoaders: null, // Disable eslint-loader for this bundle

    loaders: [
      {
        test: /plugins\//,
        loader: 'imports?define=>undefined,require=>undefined,module=>undefined,exports=>undefined,this=>window'
      }
    ],

    // Note that some 3rd party libraries cause problems with webpack because they support AMD/UMD
    // and try to require other modules.  To solve this, we disable webpack's moduling on these
    // files.  If a 3rd party library is erroring with something like "Could not find module X",
    // then try adding its regex to this list.
    noParse: [
      /plugins\//
    ]
  },
  output: common.getOutput(identifier),
  plugins: common.plugins.concat(common.getManifestPlugin(identifier))
}, require('./base'));
