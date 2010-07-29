class DataFederation < Model

  def self.create(attributes)
    path = "/federations"
    return parse(CoreServer::Base.connection.create_request(path, attributes.to_json))
  end

  def self.find( options = nil, custom_headers = {})
    if options.nil?
      options = Hash.new
    end
    path = nil
    if options.is_a? String
      path = "/federations/#{options}.json"
    elsif options.respond_to?(:to_param)
      path = "/federations.json"
      path += "?#{options.to_param}" unless options.to_param.blank?
    end

    parse(CoreServer::Base.connection.get_request(path, custom_headers))
  end

  def self.accept(id)
    path = "/federations/#{id}.json"
    parse(CoreServer::Base.connection.update_request(path, {"acceptedUserId" => User.current_user.oid }.to_json))
  end

  def self.reject(id)
    path = "/federations/#{id}.json"
    parse(CoreServer::Base.connection.update_request(path, {"acceptedUserId" => nil}.to_json))
  end

  def self.delete(id)
    path = "/federations/#{id}.json"
    parse(CoreServer::Base.connection.delete_request(path, nil))
  end

end
