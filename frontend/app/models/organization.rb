class Organization < Model
  def empty?
    self.domains.blank?
  end

  def self.update_name(id, name)
    path = "/organizations/#{id}.json?method=updateName&newName=#{CGI.escape(name)}"
    CoreServer::Base.connection.update_request(path)
  end
end
