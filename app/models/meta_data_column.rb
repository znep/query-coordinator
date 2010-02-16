class MetaDataColumn
  def initialize(hash = {})
    hash.each_pair do |key, value|
      attribute_name = key.underscore
      self.class.send :attr_accessor, attribute_name
      send "#{attribute_name}=".to_sym, value
    end
  end  
end