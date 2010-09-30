module DatasetsHelper
 
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

  safe_helper :font_select_options, :font_size_select_options, :seo_render
end
