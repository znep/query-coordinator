class Array

  def to_core_query(key)
    collect { |value| value.to_core_query(key) }.join '&'
  end

  def fix_get_encoding!
    self.each{ |elem| elem.fix_get_encoding! }
  end

  unless Array.instance_methods.include?(:pluck) || Array.new.respond_to?(:pluck)
    def pluck(key)
      map { |object| object.respond_to?(:key?) ? object[key] : nil }.compact
    end
  end

end
