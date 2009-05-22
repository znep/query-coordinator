class Column < Model
  def text_format
    (self.format.nil? || self.format.formatting_option.nil?) ? 'Plain' :
      self.format.formatting_option
  end

  def aggregate
    (self.format.nil? || self.format.aggregate.nil?) ? 'none' :
      self.format.aggregate
  end

  def is_blist_in_blist
    dataType.type.downcase == 'nested_table'
  end

  def is_list
    if is_blist_in_blist
      return !self.format.nil? && self.format.isList
    end
    false
  end
end
