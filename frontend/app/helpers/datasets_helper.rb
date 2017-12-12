module DatasetsHelper

  attr_reader :view

  def options_for_limit_to(column, current = nil)
    options = [['No Filter', '']]
    options += column.possible_filter_conditions.
      collect{|c_hash| [c_hash[:label], c_hash[:operator]]}
    options_for_select(options, current)
  end

  def options_for_sort_by(columns, current = nil)
    options = [['No Sort', '']]
    options += columns.select{|c| c.is_sortable?}.
      collect{|column| [column.name, column.id]}
    options_for_select(options, current)
  end

  def flatten_category_tree
    View.category_tree.values.sort_by { |o| o[:text] }.
      map do |o|
        children = (o[:children] || []).map do |cc|
          text = if cc[:value] then cc[:text] else I18n.t('core.no_category') end
          { text: ' -- ' + text, value: cc[:value] }
        end
        [o].concat(children)
      end.flatten.map { |o| [o[:text], o[:value]] }
  end

  def category_select_options(selected_category = nil)
    options = flatten_category_tree.uniq
    if selected_category.present?
      option_keys = options.map { |n| n[1] }
      if option_keys.include?(selected_category)
        options_for_select(options, selected_category)
      else
        completeOptions = options + [[selected_category, selected_category]]
        options_for_select(completeOptions, selected: selected_category, disabled: selected_category)
      end
    else
      options_for_select(options, selected_category)
    end
  end

  def license_options(selected_license = '')
    licenses = ExternalConfig.for(:license).merged_licenses
    licenses["-- #{t 'core.licenses.no_license'} --"] = ''

    options_for_select(licenses.sort_by(&:first), selected_license)
  end

  def licenses()
    licenses = ExternalConfig.for(:license).merged_licenses
    licenses["-- #{t 'core.licenses.no_license'} --"] = ''
    licenses.to_a.sort_by(&:first)
  end

  def socialize_menu_options(view)
    {
     :facebook => { 'href' => "http://www.facebook.com/share.php?u=#{h(short_view_url(view))}"},
     :twitter  => { 'href' => "http://twitter.com/?status=#{tweetable_link(view)}"}
    }
  end

  # Create a drop down menu of formatting fonts
  # Pass a font name to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_select_options(selected_font = nil)
    out = ""
    {'Helvetica' => 'helvetica,arial,sans serif',
      'Courier' => 'courier,monospace',
      'Times' => 'times,serif'
    }.sort { |a,b| a[0] <=> b[0] }.each do |font|
      selected = selected_font == font[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{font[1]}\"#{selected}>#{font[0]}</option>"
    end
    out.html_safe
  end

  # Create a drop down menu of formatting font sizes
  # Pass a font size to select it by default.
  # TODO: This sucks keeping it in sync with our text editor; better place to
  # code this?
  def font_size_select_options(selected_font_size = nil)
    out = ""
    {8 => 6, 10 => 8, 12 => 10, 14 => 12, 18 => 16, 24 => 22,
      36 => 34}.sort {|a,b| a[0] <=> b[0]}.
      each do |size|
      selected = selected_font_size == size[0] ?
        " selected=\"selected\" class=\"default\"" : ""
      out += "<option value=\"#{size[1]}\"#{selected}>#{size[0]}</option>"
    end
    out.html_safe
  end

  def seo_render(cell, column)
    return '' if cell.nil?

    case column.renderTypeName
    when 'calendar_date', 'date'
      if column.renderTypeName == 'calendar_date'
        value = Time.parse(cell)
      else
        value = Time.at(cell.to_i)
      end
      ret = value.strftime('%c')

    when 'drop_down_list', 'dataset_link'
      if column.dropDown
        column.dropDown.values.each do |option|
          if option['id'] == cell
            ret = h(option['description'])
          end
        end
      end

    when 'document'
      name_i = column.sub_type_index('filename')
      size_i = column.sub_type_index('size')
      type_i = column.sub_type_index('content_type')
      is_new = column.sub_type_index('id').nil?
      id_i = column.sub_type_index(is_new ? 'file_id' : 'id')

      if cell[id_i].present?
        params = []
        params << "filename=#{URI::escape(cell[name_i])}" if cell[name_i].present?
        params << "content_type=#{URI::escape(cell[type_i])}" if cell[type_i].present?
        ret = "<a href='/views/#{view.id}/" <<
          # TODO Clean up this barf
          (is_new ?  '' : 'obsolete_') + "files/" + cell[id_i] +
          (is_new && params.length > 0 ? '?' + params.join('&') : '') + "'>" +
          h(cell[name_i]) + "</a>" +
          "(" + number_to_human_size(cell[size_i], {:locale => 'en'}) + ")" +
          "(" + cell[type_i] + ")"
      end

    when 'photo'
      url = "/views/#{view.id}/files/#{cell}"
      ret = %Q{<a href="#{url}">Image</a>}

    when 'location'
      human_address = cell[column.sub_type_index('human_address')]
      pieces = []

      if !human_address.nil?
        address = JSON.parse(human_address)

        if !address['address'].blank?
          pieces << h(address['address'])
        end

        csz = h([[address['city'], address['state']].compact.join(', '),
                address['zip']].compact.join(' '))
        pieces << csz if !csz.blank?
      end

      lat = cell[column.sub_type_index('latitude')]
      long = cell[column.sub_type_index('longitude')]
      if !lat.blank? || !long.blank?
        pieces << '(' + (lat || '') + '&deg;, ' + (long || '') + '&deg;)'
      end

      ret = pieces.compact.join('<br />')

    else
      ret = h(cell.to_s)
    end

    ret.html_safe if ret
  end

  def stars_control(extra_class = '', value = nil)
    ('<div class="starsControl ' + extra_class + '" title="' +
      t('controls.common.stars.tooltip', { number: value.to_i }) + '">' +
      %Q(<span class="accessibleValue">Current value: #{value.to_i} out of 5</span>) +
      (0..5).map do |i|
        %Q(<span class="starsLabel value-#{i} #{'currentValue' if value.to_i == i}"></span>)
      end.join('') +
    '</div>').html_safe
  end

  def stars_control_interactive(rating_type, value, view, extra_class = '')
    @@stars_id ||= 1
    id = 'stars_' + (@@stars_id += 1).to_s
    form_tag(update_rating_dataset_path(view, :id => id), :id => id, :method => :post,
             :class => "starsControl blueStars enabled #{extra_class}",
             :'data-rating' => value.to_i.to_s,
             :'data-rating-type' => rating_type,
             :title => t('controls.common.stars.tooltip', { number: value.to_i })) do
      content_tag(:div, "Current value: #{value.to_i}", :class => 'accessibleValue')
      content_tag :div do
        hidden_field_tag('ratingType', rating_type)
        hidden_field_tag('authenticity_token', form_authenticity_token)
        (0..5).each do |i|
          c_id = "id_#{i}"
          concat(radio_button_tag('starsRating', i.to_s, value.to_i == i, :class => 'noUniform', :id => c_id))
          concat(label_tag(c_id, "#{i}/5", :class => 'starsLabel'))
        end
        submit_tag('Save')
      end
    end
  end

  # include only url and text column types.
  # In the future, we may allow people to have
  # a namespace attached to a view and the subject column
  # content does not have to contain full uri.
  def rdf_subject_select_options(cols, selected_rdf_subject)
    options = []
    sel = nil
    options.push(['--None--', 0])
    use_field_name = (selected_rdf_subject.to_i == 0)
    cols.each do |m|
      if (m.renderTypeName == 'text' ||
          m.renderTypeName == 'url'  ||
          m.renderTypeName == 'calendar_date' ||
          m.renderTypeName == 'date' ||
          m.renderTypeName == 'number')
        options.push([m.name, use_field_name ?  m.fieldName : m.id])
        if (use_field_name)
          if (m.fieldName == selected_rdf_subject)
            sel = m.fieldName
          end
        else
          if (m.id.to_s() == selected_rdf_subject)
            sel = m.id
          end
        end
      end
    end
    options_for_select(options, sel)
  end

  # used to require meta custom data predefined at domain level.
  # now, display meta custom data as long as they have the keys in lenses.metadata
  # This is done by merging the fields
  def merge_custom_metadata(view)
    domain_metadata = CurrentDomain.property(:fieldsets, :metadata) || []
    if view.merged_metadata['custom_fields'].present?
      domain_metadata = domain_metadata.clone
      view_metadata = view.merged_metadata['custom_fields']
      view_metadata.each do |field_set, fields|
        if domain_metadata.none? { |e| e.name == field_set }
          h = {:name => field_set, :fields => []}
          if (fields.kind_of? Hash) # protect against top key w/o subkey
            fields.keys.each do |sub_field_name|
              h[:fields].push({:name => sub_field_name})
            end
          end
          m = Hashie::Mash.new(h)
          domain_metadata.push(m)
        else  # domain already has top key, but still may have to add sub-keys
          h = (domain_metadata.find { |e| e.name == field_set })
          if (fields.kind_of? Hash) # protect against top key w/o subkey
            if (h[:fields].nil?)
              h[:fields] = Array.new
            end
            fields.keys.each do |sub_field_name|
              if h[:fields].none? { |f| f.name == sub_field_name }
                h[:fields].push(Hashie::Mash.new({:name => sub_field_name}))
              end
            end
          end
        end
      end
    end

    domain_metadata
  end

  def browse_facet_option(facet_option, param, options, use_icon = false)
    cp = options[:user_params].dup
    if options[:strip_params] && options[:strip_params][param.to_sym]
      cp.delete_if{ |k, v| options[:strip_params][param.to_sym][k.to_sym] }
    end
    cp[param] = facet_option[:value]
    ret = '<li><a href="' + options[:base_url] + '?' + cp.to_param + '" class="' +
      (facet_option[:class] || '') +
      (options[param] == facet_option[:value] ? ' active' : '') +'">'
    if use_icon
      # use legacy icon sprite, or new icon font (e.g. .icon-cards)
      if facet_option[:icon_font_class]
        ret << %Q(<span aria-hidden="true" class="#{facet_option[:icon_font_class]}"></span>)
      elsif options[:view_type] == 'listing'
        ret << %Q(<span aria-hidden="true" class="asset-icon" data-display-type="#{facet_option[:value]}"></span>)
      else
        ret << '<span aria-hidden="true" class="icon"></span>'
      end
    elsif !facet_option[:icon].nil?
      ret += '<img class="customIcon" src="' + theme_image_url(facet_option[:icon]) + '" alt="" />'
    end
    ret += h(facet_option[:text])
    ret += '</a>'

    if facet_option[:help_link]
      ret << %Q{<a class="help-link" href="#{facet_option[:help_link][:href]}" target="_blank">
        #{facet_option[:help_link][:text]}
      </a>}
    end

    if facet_option[:help_text]
      ret << %Q{<span class="help-text">#{facet_option[:help_text]}</span>}
    end

    if options[param] == facet_option[:value] && !(facet_option[:children] || []).empty? ||
      (facet_option[:children] || []).any? { |cc| cc[:value] == options[param] }
      ret += '<ul class="childList">' +
        facet_option[:children].map { |child|
          browse_facet_option(child, param, options, use_icon) }.join('') +
        '</ul>'
    end
    ret += '</li>'
    ret.html_safe
  end

  def force_editable?
    params.fetch('$$force_editable', 'false') == 'true'
  end

  def row_identifier_select_tag(disabled = false)
    select_tag(
      'view[metadata[rowIdentifier]]',
      rdf_subject_select_options(view.columns, h(view.metadata.try(:rowIdentifier).to_s)),
      :disabled => disabled
    )
  end

  def show_save_as_button?
    [ view.is_published?,
      !view.is_api?,
      [ !view.new_backend?,
        view.dataset?,
        FeatureFlags.derive(view, request).reenable_ui_for_nbe
      ].any?
    ].all?
  end

  def api_foundry_url_tag(url)
    link_to(t('screens.ds.grid_sidebar.api.api_docs'), url, :class => 'button', :rel => 'external')
  end

  def endpoint_url_tag(url, options = {})
    if options[:name]
      name = options[:name]

      content_tag('div', nil, class: 'labeledEndpointWrapper') do
        label_tag(name, name) <<
          text_field_tag(name, url, :readonly => 'readonly', :type => 'text', :onclick => 'this.select();')
      end
    else
      text_field_tag(nil, url, :readonly => 'readonly', :type => 'text', :onclick => 'this.select();')
    end
  end

  def format_link_tag(format)
    translated_title = t("screens.ds.bar.format.#{format}")
    span = content_tag(:span, translated_title, :class => 'icon')
    span = 'Link' if format == 'link' # Goddamnit Jeff!
    # Heavy sigh...
    css_class = { 'bullet' => 'bulletedList', 'number' => 'numberedList' }.fetch(format, format)
    link = { 'bullet' => 'unorderedList', 'strike' => 'strikethrough', 'number' => 'orderedList' }.fetch(format, format)
    content_tag(
      :a, span, :href => "#format_#{link}", :title => translated_title, :class => "button #{css_class} toggleButton"
    )
  end

  def sidebar_link(pane, include_alert_icon = false)
    translated_title = t("screens.ds.grid_sidebar.tabs.#{pane.underscore}")
    link = "##{pane[0].capitalize}#{pane[1..-1]}"
    span = content_tag(:span, '', :class => 'icon') << translated_title
    span << content_tag(:span, '', :class => 'alertIcon') if include_alert_icon
    pane = 'feed' if pane == 'discuss' # Goddamnit Jeff!
    if pane == 'more' # Goddamnit Jeff!
      aria_label = t('screens.ds.grid_sidebar.tabs.more_asset_actions')
      content_tag(:a, span, :href => link, :title => translated_title, :class => 'other', :'aria-label' => aria_label)
    else
      content_tag(:a, span, :href => link, :title => translated_title, :class => pane, 'data-paneName' => pane)
    end
  end

  # Code in public/javascripts/controls/panes/download-dataset.js relies on the values here. If these ever
  # get localized correctly, make sure to update that code as well.
  def normal_download_types
    ['CSV', 'CSV for Excel', 'CSV for Excel (Europe)', 'JSON', 'RDF', 'RSS', 'TSV for Excel', 'XML']
  end

  def display_dataset_landing_page_link
    view.has_landing_page? && dataset_landing_page_enabled?
  end

  def configuration
    Hashie::Mash.new.tap do |hash|
      hash.newChartsEnabled = true
      hash.newMapsEnabled = module_enabled?(:new_maps)
      hash.oldChartsForced = module_enabled?(:old_charts)
      hash.newCharts!.newBarChart = module_enabled?(:newBarChart)
      hash.newCharts!.newLineChart = module_enabled?(:newLineChart)
      hash.inDatasetSearchQueryTimeoutSeconds = CurrentDomain.domain.
        default_configuration('nbe_query_timeouts').try(:properties).try(:in_dataset_search) || '30'
    end
  end

  def sidebar_hidden
    hash = Hashie::Mash.new

    hash.moreViews!.views = hide_more_views_views?
    hash.moreViews!.snapshots = hide_more_views_snapshots?
    hash.moreViews!.backups = hide_more_views_backups?

    hash.edit!.appendReplace = hide_append_replace?
    hash.edit!.addColumn = hide_add_column?
    hash.edit!.editColumn = hide_edit_column?
    hash.edit!.addRow = hide_add_row?
    hash.edit!.updateColumn = hide_edit_update_column?
    hash.edit!.redirect = hide_redirect?

    hash.manage!.updateColumn = hide_update_column?
    hash.manage!.showHide = hide_show_hide_columns?
    hash.manage!.sharing = hide_sharing?
    hash.manage!.permissions = hide_permissions?
    hash.manage!.plagiarize = hide_plagiarize?
    hash.manage!.deleteDataset = hide_delete_dataset?

    hash.columnProperties = view.non_tabular?

    hash.filter!.filterDataset = hide_filter_dataset?
    hash.filter!.conditionalFormatting = hide_conditional_formatting?

    hash.visualize!.calendarCreate = hide_calendar_create?
    hash.visualize!.chartCreate = hide_chart_create?
    hash.visualize!.dataLensCreate = hide_data_lens_create?
    hash.visualize!.mapCreate = hide_map_create?

    hash.embed!.formCreate = hide_form_create?
    hash.embed!.sdp = hide_embed_sdp?

    hash.exportSection!.print = hide_export_section?(:print)
    hash.exportSection!.download = hide_export_section?(:download)
    hash.exportSection!.api = hide_export_section?(:api)
    hash.exportSection!.odata = hide_export_section?(:odata)
    hash.exportSection!.subscribe = hide_export_section?(:subscribe)

    hash.feed!.discuss = hide_discuss?

    hash.about = hide_about?

    hash
  end

  def row_label
    view.metadata.try(:rowLabel)
  end

  # All of the hide_* methods are invoked only by sidebar_hidden. There _were_ private, but are no longer.

  # After derived_view_publication is stabilized in production.  This feature check should be removed and always on.
  def derived_view_publication_enabled?
    CurrentDomain.configuration('feature_set').try(:properties).try(:derived_view_publication)
  end

  def hide_redirect?
    return false if force_editable?

    [
      !view.is_published?,
      !view.is_blist? && !derived_view_publication_enabled?,
      !view.is_tabular? && derived_view_publication_enabled?,
      !view.can_edit?,
      current_user.blank?,
      view.is_immutable?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_add_column?
    [
      !view.is_unpublished?,
      !view.is_blist?,
      !view.has_rights?(ViewRights::ADD_COLUMN),
      view.is_immutable?,
      view.geoParent.present?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_edit_column?
    [
      !view.is_unpublished?,
      !enable_2017_grid_view_refresh_for_current_request?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_add_row?
    [
      !view.is_unpublished?,
      !enable_2017_grid_view_refresh_for_current_request?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_append_replace?
    # If the dataset is new_backend, it will never be blobby.
    #  It will not (yet) be geo. It will not (yet) be unpublished.
    [
      !view.is_unpublished? && !view.is_geo? && !view.is_blobby?,
      hide_append_replace_for_nbe_geo?,
      view.is_href?,
      !view.flag?('default') && !view.is_geo?, # Allow Mondara maps to be editable.
      view.geoParent.present?,
      !view.has_rights?(ViewRights::ADD),
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_append_replace_for_nbe_geo?
    return false unless view.new_backend?
    !view.is_geo? && FeatureFlags.derive(view, request).ingress_strategy == 'obe'
  end

  def hide_export_section?(section)
    return true if view.geoParent.present?

    case section
      when :print
        [
          !view.can_print?,
          view.new_backend?
        ].any?
      when :download
        [
          view.non_tabular? && !view.is_geo?,
          view.is_form?
        ].any?
      when :api
        view.non_tabular? && !view.is_geospatial?
      when :odata
        [
          view.non_tabular?,
          view.is_alt_view?
        ].any?
      when :subscribe
        [
          !view.is_published?,
          view.non_tabular?,
          view.is_api?,
          view.is_form?
        ].any?
    end
  end

  def hide_embed_sdp?
    [
      !view.is_published?,
      view.is_api?,
      view.geoParent.present?,
      view.new_backend? && !FeatureFlags.derive(view, request).enable_embed_widget_for_nbe
    ].any?
  end

  def hide_conditional_formatting?
    [
      view.is_unpublished? && !derived_view_publication_enabled?,
      view.non_tabular?,
      view.is_form?,
      view.is_api?,
      view.geoParent.present?,
      view.is_api_geospatial?
    ].any?
  end

  def hide_form_create?
    current_user_does_not_own = [
      !view.owned_by?(current_user),
      view.parent_dataset && !view.parent_dataset.owned_by?(current_user)
    ].any?

    [
      !view.is_published?,
      view.non_tabular? && !view.is_form?,
      view.is_api?,
      view.geoParent.present?,
      view.is_api_geospatial?,
      view.is_grouped?,
      current_user_does_not_own && !CurrentDomain.user_can?(current_user, UserRights::EDIT_OTHERS_DATASETS)
    ].any?
  end

  # Note: This controls visibility of columnOrder, not to be confused with the aptly named "manage.columnOrder" config. :-/
  def hide_update_column?
    [
      view.is_snapshotted?,
      view.non_tabular?,
      view.is_form?,
      view.is_api?,
      view.geoParent.present?,
      view.is_api_geospatial?,
      enable_2017_grid_view_refresh_for_current_request?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_edit_update_column?
    [
      !view.is_unpublished?,
      !enable_2017_grid_view_refresh_for_current_request?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_show_hide_columns?
    [
      view.is_snapshotted?,
      view.non_tabular?,
      view.is_form?,
      view.is_geo?,
      view.is_api_geospatial?,
      enable_2017_grid_view_refresh_for_current_request?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_sharing?
    [
      # when this flag is on, sharing is done via the access manager modal
      FeatureFlags.derive(nil, request).enable_access_manager_modal,
      view.is_snapshotted?,
      !view.has_rights?(ViewRights::GRANT),
      view.geoParent.present?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_permissions?
    [
      view.is_snapshotted?,
      !view.has_rights?(ViewRights::UPDATE_VIEW),
      view.geoParent.present?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_plagiarize?
    [
      # when this flag is on, sharing is done via the access manager modal
      FeatureFlags.derive(nil, request).enable_access_manager_modal,
      !CurrentDomain.user_can?(current_user, UserRights::CHOWN_DATASETS),
      view.geoParent.present?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_delete_dataset?
    [
      !view.has_rights?(ViewRights::DELETE_VIEW),
      view.geoParent.present?,
      view.is_activity_feed_dataset?
    ].any?
  end

  def hide_filter_dataset?
    [
      view.non_tabular?,
      view.is_form?,
      view.is_insecure_arcgis?,
      view.geoParent.present?,
      view.is_api_geospatial?
    ].any?
  end

  def hide_calendar_create?
    [
      view.is_unpublished? && !derived_view_publication_enabled?,
      # !view.is_unpublished? && derived_view_publication_enabled?, # uncomment to disallow editing on published copy.
      view.is_alt_view? && !view.available_display_types.include?('calendar'),
      view.geoParent.present?,
      view.is_api_geospatial?
    ].any?
  end

  def hide_chart_create?
    [
      view.is_unpublished? && !derived_view_publication_enabled?,
      # !view.is_unpublished? && derived_view_publication_enabled?, # uncomment to disallow editing on published copy.
      view.is_alt_view? && !view.available_display_types.include?('chart'),
      view.geoParent.present?,
      view.is_api_geospatial?
    ].any?
  end

  def hide_map_create?
    [
      view.is_unpublished? && !derived_view_publication_enabled?,
      view.is_alt_view? && !view.available_display_types.include?('map'),
      view.is_grouped?,
      view.geoParent.present?
    ].any?
  end

  def hide_data_lens_create?
    return true unless current_user

    if view.dataset?
      is_ineligible_view = false
    # show this option for filtered or grouped views, excluding visualizations.
    elsif view.is_derived_view? && !(view.classic_visualization? || view.is_calendar? || view.is_form?)
      is_ineligible_view = !FeatureFlags.derive(view, request)[:enable_data_lens_using_derived_view]
    else
      is_ineligible_view = true
    end

    [
      current_user.rights.blank?,
      view.is_unpublished?,
      is_ineligible_view,
      view.is_api_geospatial?,
      view.geoParent.present?
    ].any?
  end

  def hide_discuss?
    [
      !view.is_published?,
      view.is_api?,
      view.geoParent.present?
    ].any?
  end

  def hide_about?
    [
      view.is_href?,
      view.is_blobby? && view.display.display_type == 'link'
    ].any?
  end

  def hide_more_views_views?
    [
      !view.is_published?,
      view.non_tabular? && !view.is_geo?,
      view.geoParent.present?,
      view.is_href?
    ].any?
  end

  def hide_more_views_snapshots?
    [
      view.new_backend?,
      view.is_unpublished?,
      !view.flag?('default'),
      view.is_arcgis?,
      view.is_geo?,
      view.is_api_geospatial?,
      view.is_href?
    ].any?
  end

  def hide_more_views_backups?
    [
      !view.new_backend?, # NBE only
      view.is_unpublished?,
      !view.flag?('default'),
      view.is_arcgis?,
      view.is_geo?,
      view.is_api_geospatial?,
      view.is_href?
    ].any?
  end

  #  See browse2_helper for related helper methods
  def dataset_provenance_tag
    return unless FeatureFlags.derive.show_provenance_facet_in_catalog

    provenance = normalized_provenance(@view.provenance)
    return if provenance.blank? || disable_authority_badge?(provenance)

    (@svg_file ||= {})[provenance] ||= File.read(File.expand_path("public/images/#{provenance}.svg"))

    content_tag(:span, :class => "tag-provenance tag-#{provenance}") do
      @svg_file[provenance].html_safe +
      t("controls.browse.listing.provenance.#{provenance}")
    end
  end

  def render_socrata_visualizations_translations
    translations = json_escape(LocaleCache.render_translations([LocalePart.shared]).to_json)
    javascript_tag("var translations = #{translations};", :id => 'translations')
  end
end
