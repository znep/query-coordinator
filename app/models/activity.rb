class Activity < Model

  def self.find(opts = nil)
    path = "/activities.json"
    if (opts)
      path += "?#{opts.to_param}"
    end
    parse(CoreServer::Base.connection.get_request(path))
  end

  def self.find_for_user(user, opts = nil)
    path = "/users/#{user.id}/activities.json"
    if (opts)
      path += "?#{opts.to_param}"
    end
    parse(CoreServer::Base.connection.get_request(path))
  end

end
