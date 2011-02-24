class AccountTier < Model
  def has_module?(mod_name)
    if accountModules.nil?
      return false
    else
      return accountModules.any? {|am| am.name == mod_name}
    end
  end
end
