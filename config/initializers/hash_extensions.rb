class Hash

  # Recursively merges two hashes. When trying to merge two values that are not
  # both hashes, take the other's value, unless a block is given. If a block is
  # given, the value is the one given by the block. The block takes the pair of
  # values we're trying to merge, in (self, other) order.
  def deep_merge(other)
    result = self.dup

    other.each_key do |key|
      if (other[key].is_a?(Hash) && result[key].is_a?(Hash))
        if block_given?
          result[key] = result[key].deep_merge(other[key]) {|a, b| yield(a, b) }
        else
          result[key] = result[key].deep_merge(other[key])
        end
      else
        if block_given?
          result[key] = yield(result[key], other[key])
        else
          result[key] = other[key]
        end
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

  def merge_sum(other)
    result = self.dup

    other.each do |key, value|
      if result.has_key? key
        result[key] += value
      else
        result[key] = value
      end
    end

    result
  end

  # TODO This can probably be deprecated in favor of Hash#dig
  def deep_value_at(keys)
    current = self
    keys.each { |key| current = current[key] unless current.nil? }
    current
  end

  def to_core_param(namespace = nil)
    collect do |key, value|
      value.to_core_query(namespace ? "#{namespace}[#{key}]" : key)
    end.sort * '&'
  end

  def except(*blacklist)
    self.reject { |key| blacklist.include?(key) }
  end

  def only(*whitelist)
    self.reject { |key| !whitelist.include?(key) }
  end

  def fix_get_encoding!
    self.each { |_, v| v.fix_get_encoding! }
  end

  def fix_key_encoding
    encoded_attributes = {}
    self.each_pair do |k, v|
      unless k.is_a? Symbol
        key = k.dup
        key.force_encoding('UTF-8').encode!
      else
        key = k
      end
      encoded_attributes[key] = v.is_a?(Hash) ? v.fix_key_encoding : v
    end
    encoded_attributes
  end

  # Calls strip!() on anything responding to that message
  # in this hash or its children.
  def deep_string_strip!
    self.each_key do |key|
      if self[key].kind_of? String
        self[key].strip!
      end

      if self[key].respond_to?(:deep_string_strip!)
        self[key].deep_string_strip!
      end
    end
  end

  # deep set
  def bury(*to_bury, value)
    to_bury[0...-1].
      reduce(self) { |memo, layer| memo[layer] ||= self.class.new }.
      store(to_bury.last, value)
  end

  def camelize_keys!
    keys.each do |key|
      self[(key.to_s.camelize(:lower) rescue key) || key] = delete(key)
    end
    self
  end

end

module Hashie
  class Mash
    def camelize_keys!
      keys.each do |key|
        self[(key.to_s.camelize(:lower) rescue key) || key] = delete(key)
      end
      self
    end
  end
end
