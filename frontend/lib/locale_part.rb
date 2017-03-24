class LocalePart

  def self.method_missing(method)
    LocalePart.new(method.to_s)
  end

  def self.from_array(parts)
    return if parts.blank?

    result = nil
    parts.each{ |part| result = LocalePart.new(part, result) }
    result
  end

  def method_missing(method, *arguments)
    LocalePart.new(method.to_s, self)
  end

  # traverse to subhash; nil if anything dies along the way
  def get?(hash)
    hash = parent.get?(hash) if parent
    return hash[part] rescue nil
  end

  # traverse to subhash, creating hashes if necessary
  def get!(hash)
    hash = parent.get!(hash) if parent
    hash[part] = {} unless hash.has_key?(part)
    return hash[part]
  end

  def set!(hash, value)
    hash = parent.get!(hash) if parent
    hash[part] = value
  end

  def to_s
    @_to_s ||= "#{parent.to_s if parent}.#{part}"
  end

  def ==(other)
    to_s == other.to_s
  end
  alias :eql? :== # ruby standard says you're not supposed to do this, but stdlib does it
                  # *all the fucking time*. essentially, this results in set equality.

  protected

  attr_accessor :parent, :part

  def initialize(part, parent = nil)
    @part, @parent = part, parent
  end

end
