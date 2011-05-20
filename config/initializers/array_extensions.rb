class Array
  def to_core_query(key)
    collect { |value| value.to_core_query(key) }.join '&'
  end
end