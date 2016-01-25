class Tag < Model

  # TODO Refactor this to remove the constructor that breaks the Model API
  def initialize()
    self.data = Hash.new
    self.update_data = Hash.new
  end

  def self.find(opts)
    path = "/tags"
    if (opts)
      path += "?#{opts.to_param}"
    end
    parse(CoreServer::Base.connection.get_request(path))
  end

end
