class LocalePart
  def self.method_missing(method)
    LocalePart.new(method.to_s)
  end

  def method_missing(method)
    LocalePart.new(method.to_s, self)
  end

  # traverse to subhash; nil if anything dies along the way
  def get?(hash)
    hash = self.parent.get?(hash) if self.parent
    return hash[self.part] rescue nil
  end

  # traverse to subhash, creating hashes if necessary
  def get!(hash)
    hash = self.parent.get!(hash) if self.parent
    hash[self.part] = {} unless hash.has_key? self.part
    return hash[self.part]
  end

  def set!(hash, value)
    hash = self.parent.get!(hash) if self.parent
    hash[self.part] = value
  end

  def to_s
    return @_to_s ||= "#{self.parent.to_s if self.parent}.#{self.part}"
  end

  def ==(other)
    self.to_s == other.to_s
  end
  alias :eql? :== # ruby standard says you're not supposed to do this, but stdlib does it
                  # *all the fucking time*. essentially, this results in set equality.

protected
  attr_accessor :parent, :part

  def initialize(part, parent = nil)
    self.part, self.parent = part, parent
  end
end
