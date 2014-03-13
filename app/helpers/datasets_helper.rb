module DatasetsHelper

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

    [{'text' => 'Facebook',
      'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}"},

    {'text' => 'Twitter',
      'href' => "http://twitter.com/?status=#{view.tweet}"}]
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

      if !cell[id_i].nil?
        params = []
        params << 'filename=' + URI::escape(cell[name_i]) if !cell[name_i].blank?
        params << 'content_type=' +
          URI::escape(cell[type_i]) if !cell[type_i].blank?
        ret = "<a href='/views/" + @view.id + "/" +
          (is_new ?  '' : 'obsolete_') + "files/" + cell[id_i] +
          (is_new && params.length > 0 ? '?' + params.join('&') : '') + "'>" +
          h(cell[name_i]) + "</a>" +
          "(" + number_to_human_size(cell[size_i], {:locale => 'en'}) + ")" +
          "(" + cell[type_i] + ")"
      end

    when 'photo', 'photo_obsolete'
      url = '/views/' + @view.id + '/' + (column.dataTypeName == 'photo_obsolete' ?
                'obsolete_' : '') + 'files/' + cell
      ret = "<a href='" + url + "'>Image</a>"

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
    if !view.merged_metadata['custom_fields'].nil?
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
      ret += '<span class="icon"></span>'
    elsif !facet_option[:icon].nil?
      ret += '<img class="customIcon" src="' + theme_image_url(facet_option[:icon]) + '" alt="icon" />'
    end
    ret += h(facet_option[:text])
    ret += '</a>'
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

    !@view.is_published? || !@view.is_blist? || !@view.can_edit? || current_user.blank? || @view.is_immutable?
  end

  def hide_add_column?
    !@view.is_unpublished? || !@view.is_blist? || !@view.has_rights?('add_column') || @view.is_immutable?
  end

  def hide_append_replace?
    (!@view.is_unpublished? && !@view.is_geo? && !@view.is_blobby?) || @view.newBackend? ||
      @view.is_href? || !@view.flag?('default') || !@view.has_rights?('add')
  end

end
