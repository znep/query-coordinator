class Accounttier < Model
  def self.find
    parse(CoreServer::Base.connection.get_request("/account_tiers.json"))
  end

  def has_module?(mod_name)
    return accountModules.any? {|am| am.name == mod_name}
  end
end
