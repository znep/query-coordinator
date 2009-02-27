class Model

  attr_accessor :data

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options )
    path = nil
    if options.is_a? Hash
      path = "/#{self.name.pluralize.downcase}.json?" + options_string(options)
    else
      path = "/#{self.name.pluralize.downcase}/#{options}.json"
    end

    send_request(path)
  end

  def self.options_string(options)
    return options.collect{ |k,v|
      if v.is_a? Array
        v.collect{ |a|
          k + '=' + a.to_s
        }
      else
        k + '=' + v.to_s
      end
    }.join('&')
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

  def flag?(flag_name)
    !flags.nil? && flags.any? {|f| f.data == flag_name}
  end

  protected

  def self.send_request(path)
    http = Net::HTTP.new(self.url.host, self.url.port)

    #headers = {'Cookie' => ApplicationController.cookies}
    result = http.send('get', path )
    

    #this is just temporary until we hook up the login via the client
    #this needs to be set on the response object going back to the client
    #then pulled off of the request on each future request.
    #model.cookie = result['Set-Cookie'] if !result['Set-Cookie'].nil?

    data = ActiveSupport::JSON.decode(result.body)
    if data.is_a?(Array)
      model = data.collect do | item |
        m = self.new
        m.data = item
        m
      end
    else
      model = self.new
      model.data = data
    end

    if !result.is_a?(Net::HTTPSuccess)
      raise 'Error:' + model.data['code'] + ', message:' + model.data['message']
    end

    model
  end

  private

  cattr_accessor :url

  def self.init
    config = YAML.load( IO.read(::RAILS_ROOT + "/config/coreservice.yml") )
    self.url = URI.parse( config[::RAILS_ENV]["site"])
  end

  self.init
end
