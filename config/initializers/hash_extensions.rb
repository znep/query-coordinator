# Add all of these  R E C U R S I V E  methods to Hash!

class Hash
  def deep_symbolize_keys!
    self.symbolize_keys!
    self.values.select{ |value| value.is_a? Hash }.each{ |hash| hash.deep_symbolize_keys! }
  end

  def deep_merge(other)
    result = self.dup

    other.each_key do |key|
      if other[key].is_a?(Hash) && self[key].is_a?(Hash)
        result[key] = result[key].deep_merge(other[key])
      else
        result[key] = other[key]
      end
    end

    result
  end

  def deep_merge!(other)
    other.each_key do |key|
      if self[key].is_a?(Hash) && other[key].is_a?(Hash)
        self[key].deep_merge!(other[key])
      else
        self[key] = other[key]
      end
    end
  end

  def deep_value_at(keys)
    current = self
    keys.each{ |key| current = current[key] unless current.nil? }
    return current
  end
end
