class Federation < Model

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
    self.update_attributes!(id, { "acceptedUserId" => User.current_user.oid })
  end

  def self.reject(id)
    self.update_attributes!(id, { "acceptedUserId" => nil })
  end

end
