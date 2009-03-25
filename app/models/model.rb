class Model

  attr_accessor :data

  # Override super.id and return the id of the model
  def id
    data['id']
  end

  #options - the primary lookup of the model object.  Usually id except for users where it is login
  #options could also be a hash of parameters.  see: user_test.rb
  def self.find( options = nil )
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/#{self.name.pluralize.downcase}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/#{self.name.pluralize.downcase}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    get_request(path)
  end

  def self.find_under_user(options = nil)
    if options.nil?
      options = Hash.new
    end
    user_id = User.current_user.id
    if !options['userId'].nil?
      user_id = options['userId']
      options.delete('userId')
    end

    path = nil
    if options.is_a? String
      path = "/#{self.name.pluralize.downcase}/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/users/#{user_id}/#{self.name.pluralize.downcase}.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    get_request(path)
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
  
  def set_flag(flag)
    data["flags"] << flag
  end
  
  def unset_flag(flag)
    data["flags"].delete(flag)
  end
  
  def update_attributes(attributes)
    path = "/#{self.class.name.pluralize.downcase}/#{self.id}.json"
    return self.class.update_request(path, ActiveSupport::JSON.encode(attributes))
  end
  
  def self.update_attributes(id, attributes)
    path = "/#{self.name.pluralize.downcase}/#{id}.json"
    return self.update_request(path, ActiveSupport::JSON.encode(attributes))
  end

  def self.parse(data)
    json_data = ActiveSupport::JSON.decode(data)
    if json_data.is_a?(Array)
      model = json_data.collect do | item |
        m = self.new
        m.data = item
        m
      end
    else
      model = self.new
      model.data = json_data
    end

    model
  end

protected

  def self.get_request(path)
    result_body = Rails.cache.read(path)
    if result_body.nil?
      result_body = generic_request(Net::HTTP::Get.new(path)).body
      Rails.cache.write(path, result_body)
    end

    parse(result_body)
  end

  def self.create_request(path, payload = "")
    parse(generic_request(Net::HTTP::Post.new(path), payload).body)
  end

  def self.update_request(path, payload = "")
    parse(generic_request(Net::HTTP::Put.new(path), payload).body)
  end

  def self.delete_request(path, payload = "")
    parse(generic_request(Net::HTTP::Delete.new(path), payload).body)
  end

private

  def self.generic_request(request, payload = nil)
    requestor = User.current_user
    if requestor && requestor.session_token
      request['Cookie'] = requestor.session_token.cookie
    end
    if (!payload.nil?)
      request.set_form_data(payload)
    end

    result = Net::HTTP.start(CORESERVICE_URI.host, CORESERVICE_URI.port) do |http|
      http.request(request)
    end

    if !result.is_a?(Net::HTTPSuccess)
      parsed_body = self.parse(result.body)
      raise "Error: #{request.method} #{CORESERVICE_URI.to_s}#{request.path} - " +
        "#{parsed_body.data['code']}, " +
        "message: #{parsed_body.data['message']}"
    end

    result
  end

end
