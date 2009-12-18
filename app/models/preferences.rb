class Preferences < Model
  attr_accessor :data

  # since this is always really a key-value store and not a
  # 'real object' might as well add a convenience helper.
  def [](key)
    self.data[key]
  end
end
