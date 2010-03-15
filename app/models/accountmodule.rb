class Accountmodule < Model
  def self.find
    parse(CoreServer::Base.connection.get_request("/account_modules.json"))
  end
end
