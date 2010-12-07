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
    options_for_select(View.categories.invert.sort { |a, b| a.first <=> b.first },
                       selected_category)
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
    tweet = CGI::escape("Check out the #{h(view.name)} dataset on #{CurrentDomain.strings.company} - ")
    seo_path = "#{request.protocol + request.host_with_port + view.href}"
    short_path = "#{request.protocol + request.host_with_port.gsub(/www\./, '') +
      view.short_href}"

    [{'text' => 'Delicious',
      'href' => "http://del.icio.us/post?url=#{seo_path}&title=#{h(view.name)}"},

    {'text' => 'Digg',
      'href' => "http://digg.com/submit?phase=2&url=#{seo_path}&title=#{h(view.name)}"},

    {'text' => 'Facebook',
      'href' => "http://www.facebook.com/share.php?u=#{h(seo_path)}"},

    {'text' => 'Twitter',
      'href' => "http://www.twitter.com/home?status=#{tweet + short_path}"}]
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
    out
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
    out
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
      column.dropDown.values.each do |option|
      if option['id'] == cell
        ret = h(option['description'])
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

    ret
  end

  # include only url and text column types.
  # In the future, we may allow people to have
  # a namespace attached to a view and the subject column
  # content does not have to contain full uri.
  def rdf_subject_select_options(cols, selected_rdf_subject)
    options = []
    sel = nil
    options.push(['--None--', 0])
    cols.each do |m|
      if (m.renderTypeName == 'text' || m.renderTypeName == 'url')
        options.push([m.name, m.id])
        if (m.id.to_s() == selected_rdf_subject)
          sel = m.id
        end
      end
    end
    options_for_select(options, sel)
  end

  # used to require meta custom data predefined at domain level.
  # now, display meta custom data as long as they have the keys in lenses.metadata
  # This is done by merging the fields
  def merge_custom_metadata(view)
    domain_metadata = CurrentDomain.custom_dataset_metadata || []
    if (!view.metadata.nil? && !view.metadata.custom_fields.nil?)
      domain_metadata = domain_metadata.clone
      view_metadata = view.metadata.custom_fields
      view_metadata.each do |field|
        name = field[0]
        name_in_domain = domain_metadata.find { |e| e.name == name}
        if (name_in_domain.nil?)
          h = {:name => name, :fields => []}
          field[1].keys.each do |sub_field_name|
            h[:fields].push({:name => sub_field_name})
          end
          m = Hashie::Mash.new(h)
          domain_metadata.push(m)
        end
      end
    end
    domain_metadata
  end

  safe_helper :font_select_options, :font_size_select_options, :seo_render
end
