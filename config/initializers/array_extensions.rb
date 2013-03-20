class Array
  def to_core_query(key)
    collect { |value| value.to_core_query(key) }.join '&'
  end

  def fix_get_encoding!
    self.each{ |elem| elem.fix_get_encoding! }
  end
end
