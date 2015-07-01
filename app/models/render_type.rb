class RenderType
  include ActionView::Helpers::NumberHelper

  attr_accessor :type

  def initialize(_type)
    self.type = _type
  end

  def cell_html(cell, column, dataset, options = {})
    return '' if cell.nil?

    case self.type
    when 'text'
      ret = CGI.escapeHTML(cell.to_s)

    when 'html'
      ret = cell.to_s

    when 'url'
      url = cell['url']
      url = 'http://' + url if (!url.blank? && url.index('/') != 0 && !url.match(/^([a-z]+):/i))
      desc = CGI.escapeHTML(cell['description'] || url || '')

      ret = '<a href="' + url.to_s + '">' + desc + '</a>' if !url.blank? || !desc.blank?

    when 'email'
      ret = '<a href="mailto:' + CGI.escape(cell) + '">' + CGI.escapeHTML(cell) + '</a>'

    when 'phone'
      ret = CGI.escapeHTML(cell['phone_number'] || '')
      phone_type = cell['phone_type']
      ret += '(' + phone_type + ')' if !phone_type.nil?

    when 'drop_down_list', 'picklist'
      column.dropDown.values.each do |option|
        ret = CGI.escapeHTML(option['description'] || '') if option['id'] == cell
      end

    when 'number'
      if !column.precision.nil?
        precision = '.' + column.precision
        precision_style = 'f'
      end
      precision_style = 'e' if column.precision_style == 'scientific'
      if !precision_style.nil?
        ret = "%#{precision}#{precision_style}" % cell
      else
        ret = cell.to_s
      end
      ret = ret.sub(/\./, column.format.decimalSeparator) if !column.format.decimalSeparator.nil? &&
        !column.format.decimalSeparator.blank?

    when 'percent'
      if !column.precision.nil?
        ret = "%.#{column.precision}f" % cell
      else
        ret = cell.to_s
      end
      ret += '%'
      ret = ret.sub(/\./, column.format.decimalSeparator) if !column.format.decimalSeparator.nil? &&
        !column.format.decimalSeparator.blank?

    when 'money'
      ret = column.currency_symbol + "%.#{column.precision || 2}f" % cell
      ret = ret.sub(/\./, column.format.decimalSeparator) if !column.format.decimalSeparator.nil? &&
        !column.format.decimalSeparator.blank?

    when 'calendar_date', 'date'
      if self.type == 'calendar_date'
        value = Time.parse(cell)
      else
        value = Time.at(cell.to_i)
      end
      tz_str = self.type == 'date' ? ' %Z' : ''
      ret = case column.format_view
            when 'date'          then value.strftime('%m/%d/%Y')
            when 'date_time'     then value.strftime('%m/%d/%Y %I:%M:%S' + tz_str)
            when 'date_dmy'      then value.strftime('%d/%m/%Y')
            when 'date_dmy_time' then value.strftime('%d/%m/%Y %I:%M:%S' + tz_str)
            when 'date_ymd'      then value.strftime('%Y/%m/%d')
            when 'date_ymd_time' then value.strftime('%Y/%m/%d %I:%M:%S' + tz_str)
            when 'date_monthdy'  then value.strftime('%B %d, %Y')
            when 'date_monthdy_shorttime'  then value.strftime('%B %d, %Y %I:%M')
            when 'date_monthdy_time'  then value.strftime('%B %d, %Y %I:%M:%S')
            when 'date_shortmonthdy'  then value.strftime('%b %d, %Y')
            when 'date_shortmonthdy_shorttime'  then value.strftime('%b %d, %Y %I:%M')
            when 'date_dmonthy'  then value.strftime('%d %B %Y')
            when 'date_ymonthd'  then value.strftime('%Y %B %d')
            else                      value.strftime('%m/%d/%Y %I:%M:%S' + tz_str)
            end || value.strftime('%c')

    when 'document', 'document_obsolete'
      name_i = 'filename'
      size_i = 'size'
      type_i = 'content_type'
      is_new = column.sub_type_index('id').nil?
      id_i = is_new ? 'file_id' : 'id'

      if !cell[id_i].nil?
        params = []
        params << 'filename=' + URI::escape(cell[name_i]) if !cell[name_i].blank?
        params << 'content_type=' + URI::escape(cell[type_i]) if !cell[type_i].blank?
        ret = '<a href="/views/' + dataset.id + '/' +
          (is_new ? '' : 'obsolete_') + 'files/' + cell[id_i] +
          (is_new && params.length > 0 ? '?' + params.join('&') : '') + '">' +
          CGI.escapeHTML(cell[name_i] || '') + '</a>'
        if !cell[size_i].nil?
          ret +=
            ' (' + number_to_human_size(cell[size_i], {:locale => 'en'}) + ')'
        end
        if !cell[type_i].nil?
          ret += ' (' + CGI.escapeHTML(cell[type_i] || '') + ')'
        end
      end

    when 'photo', 'photo_obsolete'
      url = '/views/' + dataset.id + '/' +
        (self.type == 'photo_obsolete' ? 'obsolete_' : '') + 'files/' + cell
      ret = '<a href="' + url + '">' +
        '<img width="20" height="20" alt="User-uploaded image" src="' + url + '" />' +
        '</a>'

    when 'location'
      human_address = cell['human_address']
      pieces = []

      if !human_address.blank?
        address = JSON.parse(human_address)

        pieces << CGI.escapeHTML(address['address']) if !address['address'].blank?

        csz = CGI.escapeHTML([[address['city'],
                address['state']].compact.join(', '),
                address['zip']].compact.join(' '))
        pieces << csz if !csz.blank?
      end

      lat = cell['latitude']
      long = cell['longitude']
      pieces << '(' + (lat || '').to_s + '&deg;, ' + (long || '').to_s + '&deg;)' if !lat.blank? || !long.blank?

      ret = pieces.compact.join('<br />')

    when 'nested_table'
      if cell.length > 0
        ret = RenderType.table_html(options[:parent_id] + '_nested_table_' + options[:row_index].to_s,
                                    column.viewable_children, cell, dataset)
      end

    else
      ret = CGI.escapeHTML(cell.to_s)
    end

    return (ret || '').html_safe
  end

  def self.table_html(t_id, vis_cols, rows, ds, page_adjust = 0, aggregates = nil)
    return unless vis_cols
    t = '<table class="dataTable" id="' + t_id + '" summary="The data in the table can be sorted, filtered, searched, and saved using the form controls located below the table."><thead><tr>'
    t << '<th scope="col" id="' + t_id + '_header_row_number" class="rowNumber">Row number</th>'
    vis_cols.each do |column|
      t << '<th scope="col" id="' + t_id + '_header_' + column.fieldName + '" class="' +
        column.dataTypeName + '"' +
        (column.is_nested_table ? ' colspan="' + (column.viewable_children.length + 1).to_s + '"' : '') +
        '>' + CGI.escapeHTML(column.name) + '</th>'
    end
    t << '</tr></thead><tbody>'
    rows.each_with_index do |r, i|
      t << '<tr class="' + (i % 2 == 0 ? 'odd' : 'even') + '">'
      row_index = i + 1 + page_adjust
      t << '<th scope="row" headers="' + t_id + '_header_row_number" class="row_number">' +
        row_index.to_s + '</th>'
      vis_cols.each do |column|
        t << '<td headers="' + t_id + '_header_' + column.fieldName +
          '" class="type_' + column.client_type + '"' +
          (column.is_nested_table ? ' colspan="' +
           (column.viewable_children.length + 1).to_s + '"' : '') + '>'
        cell = r[column.id.to_s]
        t << column.render_type.cell_html(cell, column, ds, {parent_id: t_id, row_index: row_index})
        t << '</td>'
      end
      t << '</tr>'
    end
    t << '</tbody>'
    unless aggregates.nil? or aggregates.none?
      t << '<tfoot><tr>'
      t << footer_html(aggregates, vis_cols)
      t << '</tr></tfoot>'
      end
    t << '</table>'
  end

  def self.footer_html(aggregates, vis_cols, skip_title = false)
    return unless vis_cols
    t = '<th>'
    t << 'Totals' if !skip_title
    t << '</th>'
    vis_cols.each do |column|
      if column.is_nested_table
        t << footer_html(aggregates, column.viewable_children, true)
      else
        t << '<th>'
        agg = aggregates.find{|aggregate| aggregate['columnId'] == column.id}
        t << CGI.escapeHTML(agg['value'].to_s) if !agg.nil?
        t << '</th>'
      end
    end
    t
  end
end
