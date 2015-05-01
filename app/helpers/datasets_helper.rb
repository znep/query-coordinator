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

  def category_select_options(selected_category = nil)
    cats = View.category_tree.values.sort_by { |o| o[:text] }.
      map { |o| [o].concat((o[:children] || []).map { |cc|
        { text: ' -- ' + cc[:text], value: cc[:value] } }) }.flatten.map { |o| [o[:text], o[:value]] }
    options_for_select(cats, selected_category)
  end

  def license_select_options(selected_license = nil)
    if selected_license.include?("CC")
      selected_license = "CC"
    end
    options_for_select(View.licenses.invert.sort { |a, b| a.first <=> b.first },
                       selected_license)
  end

  def creative_commons_select_options(selected_option = nil)
    options_for_select(View.creative_commons.invert.sort { |a, b|
      a.first <=> b.first }, selected_option)
  end

  def merged_license_select_options(selected_license = nil)
    options_for_select(View.merged_licenses.invert.sort { |a, b|
      a.first <=> b.first }, selected_license)
  end

  def socialize_menu_options(view)
    seo_path = view_url(view)

    {
     :facebook => { 'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}"},
     :twitter  => { 'href' => "http://twitter.com/?status=#{view.tweet}"}
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

    when 'drop_down_list', 'picklist', 'dataset_link'
      if column.dropDown
        column.dropDown.values.each do |option|
          if option['id'] == cell
            ret = h(option['description'])
          end
        end
      end

    when 'document', 'document_obsolete'
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

    when 'photo', 'photo_obsolete'
      url = "/views/#{view.id}/#{(column.dataTypeName == 'photo_obsolete' ? 'obsolete_' : '')}files/#{cell}"
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
      t('controls.common.stars.tooltip', { number: (value || 0) }) + '">' +
      '<span class="accessibleValue">Current value: ' + (value || 0).to_s + ' out of 5</span>' +
      (0..5).map do |i|
      '<span class="starsLabel value-' + i.to_s + (value.to_i == i || (i == 0 && value.nil?) ? ' currentValue' : '') + '"></span>'
      end.join('') +
    '</div>').html_safe
  end

  def stars_control_interactive(rating_type, value, view, extra_class = '')
    @@stars_id ||= 1
    id = 'stars_' + (@@stars_id += 1).to_s
    ('<form id="' + id + '" method="POST" action="' + update_rating_dataset_path(view) +
     '" class="starsControl blueStars enabled ' + extra_class +
     '" data-rating="' + (value || 0).to_s +
     '" data-rating-type="' + rating_type +
     '" title="' + t('controls.common.stars.tooltip', { number: (value || 0) }) + '">' +
      '<span class="accessibleValue">Current value: ' + (value || 0).to_s + ' out of 5</span>' +
      '<input type="hidden" name="ratingType" value="' + rating_type + '" />' +
      '<input type="hidden" name="authenticity_token" value="' +
        form_authenticity_token + '" />' +
      (0..5).map do |i|
        c_id = id + '_' + i.to_s
        '<input type="radio" class="noUniform" id="' + c_id + '" name="starsRating" value="' + i.to_s + '" ' +
          (value.to_i == i || (i == 0 && value.nil?) ? 'checked="checked" ' : '') + '/>' +
        '<label for="' + c_id + '" class="starsLabel">' + i.to_s + '/5</label>'
      end.join('') +
      '<input type="submit" value="Save" /></form>').html_safe
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
        ret << %Q(<span class="#{facet_option[:icon_font_class]}"></span>)
      else
        ret << '<span class="icon"></span>'
      end
    elsif !facet_option[:icon].nil?
      ret += '<img class="customIcon" src="' + theme_image_url(facet_option[:icon]) + '" alt="icon" />'
    end
    ret += h(facet_option[:text])
    ret += '</a>'

    if facet_option[:help_link]
      ret << %Q{<a class="help-link" href="#{facet_option[:help_link][:href]}" target="_blank">
        #{facet_option[:help_link][:text]}
      </a>}
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

  def hide_redirect?
    return false if force_editable?

    !view.is_published? || !view.is_blist? || !view.can_edit? || current_user.blank? || view.is_immutable?
  end

  def hide_add_column?
    !view.is_unpublished? || !view.is_blist? || !view.has_rights?('add_column') || view.is_immutable?
  end

  def hide_append_replace?
    # If the dataset is new_backend, it will never be blobby.
    #  It will not (yet) be geo. It will not (yet) be unpublished.
    (!view.is_unpublished? && !view.is_geo? && !view.is_blobby?) ||
      (view.new_backend? && !FeatureFlags.derive(@view, request).default_imports_to_nbe) ||  view.is_href? ||
      (!view.flag?('default') && !view.is_geo?) || # Allow Mondara maps to be editable.
      !view.has_rights?('add')
  end

  def hide_export_section?(section)
    case section
      when :print then !view.can_print? || view.new_backend?
      when :download then (view.non_tabular? && !view.is_geo?) || view.is_form?
      when :api then view.non_tabular?
      when :odata then view.non_tabular? || view.is_alt_view? || view.new_backend?
      when :subscribe then !view.is_published? || view.non_tabular? || view.is_api? || view.is_form?
      else false
    end
  end

  def hide_embed_sdp?
    !view.is_published? || view.is_api? || view.new_backend?
  end

  def row_identifier_select_tag
    select_tag(
      'view[metadata[rowIdentifier]]',
      rdf_subject_select_options(view.columns, h(view.metadata.try(:rowIdentifier).to_s)),
      {}
    )
  end

  def hide_conditional_formatting?
    view.is_unpublished? || view.non_tabular? || view.is_form? || view.is_api?
  end

  # LOLWUT
  def hide_form_create?
    !view.is_published? || (view.non_tabular? && !view.is_form?) || view.is_api? ||
    view.is_grouped? ||
    (
      (
        !view.owned_by?(current_user) || view.parent_dataset.nil? || !view.parent_dataset.owned_by?(current_user)
      ) &&
      !CurrentDomain.user_can?(current_user, :edit_others_datasets)
    )
  end

  def hide_api_foundry?
    # CORE-3871: michael.chui@socrata.com was too lazy to actually rip out all the appropriate pieces.
    if FeatureFlags.derive(view, request).enable_api_foundry_pane
      !module_enabled?(:api_foundry) || (!view.is_blist? && !view.is_api?) ||
        !view.is_published? || !view.has_rights?('update_view') || !view.can_publish? ||
        view.new_backend? || view.is_arcgis?
    else
      true
    end
  end

  # Note: This controls visibility of columnOrder, not to be confused with the aptly named "manage.columnOrder" config. :-/
  def hide_update_column?
    view.is_snapshotted? || view.non_tabular? || view.is_form? || view.is_api?
  end

  def hide_show_hide_columns?
    view.is_snapshotted? || view.non_tabular? || view.is_form? || view.is_geo?
  end

  def hide_filter_dataset?
    view.non_tabular? || view.is_form? || view.is_insecure_arcgis?
  end

  def hide_calendar_create?
    view.is_unpublished? || view.is_alt_view? && !view.available_display_types.include?('calendar')
  end

  def hide_chart_create?
    view.is_unpublished? || view.is_alt_view? && !view.available_display_types.include?('chart')
  end

  def hide_map_create?
    [ view.is_unpublished?,
      view.is_alt_view? && !view.available_display_types.include?('map'),
      view.is_grouped?,
      view.new_backend? && !FeatureFlags.derive(view, request).use_soql_for_clustering
    ].any?
  end

  def hide_cell_feed?
    !view.module_enabled?('cell_comments') || !view.is_published? || view.is_api?
  end

  def hide_discuss?
    !@view.is_published? || @view.is_api?
  end

  def hide_about?
    view.is_href? || view.is_blobby? && view.display.display_type == 'link'
  end

  def hide_more_views_views?
    !view.is_published? || (view.non_tabular? && !view.is_geo?)
  end

  def hide_more_views_snapshots?
    view.new_backend? || view.is_unpublished? || !view.flag?('default') || view.is_arcgis? || view.is_geo?
  end

  def show_save_as_button?
    view.is_published? && !view.is_api? && (view.new_backend? ? view.dataset? : true)
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
      content_tag(:a, span, :href => link, :title => translated_title, :class => 'other')
    else
      content_tag(:a, span, :href => link, :title => translated_title, :class => pane, 'data-paneName' => pane)
    end
  end

  def configuration
    hash = Hashie::Mash.new

    hash.newChartsEnabled = true
    hash.newMapsEnabled = module_enabled?(:new_maps)
    hash.oldChartsForced = module_enabled?(:old_charts)
    hash.newChartConfig = true
    hash.oldChartConfigForced = module_enabled?(:old_chart_config)
    hash.newCharts!.newBarChart = module_enabled?(:newBarChart)
    hash.newCharts!.newLineChart = module_enabled?(:newLineChart)

    hash
  end

  def sidebar_hidden
    hash = Hashie::Mash.new

    hash.moreViews!.views = hide_more_views_views?
    hash.moreViews!.snapshots = hide_more_views_snapshots?

    hash.edit!.appendReplace = hide_append_replace?
    hash.edit!.addColumn = hide_add_column?
    hash.edit!.redirect = hide_redirect?

    hash.manage!.updateColumn = hide_update_column?
    hash.manage!.showHide = hide_show_hide_columns?
    hash.manage!.sharing = view.is_snapshotted? || !view.has_rights?('grant')
    hash.manage!.permissions = view.is_snapshotted? || !view.has_rights?('update_view')
    hash.manage!.plagiarize = !CurrentDomain.user_can?(current_user, :chown_datasets)
    hash.manage!.deleteDataset = !view.has_rights?('delete_view') || view.new_backend?
    hash.manage!.api_foundry = hide_api_foundry?

    hash.columnProperties = view.non_tabular?

    hash.filter!.filterDataset = hide_filter_dataset?
    hash.filter!.conditionalFormatting = hide_conditional_formatting?

    hash.visualize!.calendarCreate = hide_calendar_create?
    hash.visualize!.chartCreate = hide_chart_create?
    hash.visualize!.mapCreate = hide_map_create?

    hash.embed!.formCreate = hide_form_create?
    hash.embed!.sdp = hide_embed_sdp?

    hash.exportSection!.print = hide_export_section?(:print)
    hash.exportSection!.download = hide_export_section?(:download)
    hash.exportSection!.api = hide_export_section?(:api)
    hash.exportSection!.odata = hide_export_section?(:odata)
    hash.exportSection!.subscribe = hide_export_section?(:subscribe)

    hash.feed!.discuss = hide_discuss?
    hash.feed!.cellFeed = hide_cell_feed?

    hash.about = hide_about?

    hash
  end

end
