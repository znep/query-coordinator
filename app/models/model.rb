class Model

  attr_accessor :data

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  def self.find( id )
    http = Net::HTTP.new(self.url.host, self.url.port)
    result = http.send('get', "/service/#{self.name}s/get_#{self.name}?id=#{id}")

    model = self.new
    model.data = ActiveSupport::JSON.decode(result.body)

    if !result.is_a?(Net::HTTPSuccess)
      raise 'Error:' + model.data['code'] + ', message:' + model.data['message']
    end

    model
  end

  def method_missing(method_symbol, *args)
    method_name = method_symbol.to_s

    assign_key = method_name.sub!(/=$/,"")
    if assign_key
      data[assign_key] = args[0]
    else
      value = data[method_name]
      if value.is_a?(Hash)
        klass = Object.const_get(method_name.capitalize.to_sym)
        model = klass.new
        model.data = value
        return model
      elsif value.is_a?(Array)
        klass = Object.const_get(method_name.singularize.capitalize.to_sym)
        items = Array.new
        value.each do | item |
          model = klass.new
          model.data = item
          items.push(model)
        end
        return items
      else
        return value
      end
    end
  end

  def to_s
    data.to_json
  end

  private

  cattr_accessor :url

  def self.init
    config = YAML.load( IO.read(::RAILS_ROOT + "/config/coreservice.yml") )
    self.url = URI.parse( config[::RAILS_ENV]["site"])
  end

  self.init
end
