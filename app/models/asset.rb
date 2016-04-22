class Asset < Model
  def self.create(file)
    parse(CoreServer::Base.connection.multipart_post_file('/assets', file))
  end
end
