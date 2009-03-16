class Column < Model
  def text_format
    format_elem = REXML::Document.new(blistFormat).
      elements['blist_format/formatting_option']
    format_elem.nil? ? 'Plain' : format_elem.text
  end

  def aggregate
    format_elem = REXML::Document.new(viewFormat).
      elements['lens_format/aggregate']
    format_elem.nil? ? 'none' : format_elem.text
  end

  def is_blist_in_blist
    dataType.type.downcase == 'blist_in_blist'
  end

  def is_list
    if is_blist_in_blist
      list_elem = REXML::Document.new(viewFormat).elements['lens_format/isList']
      return !list_elem.nil? && 'true' == list_elem.text
    end
    false
  end
end
