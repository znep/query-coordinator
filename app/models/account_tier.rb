class AccountTier < Model
  def self.find_by_name(name)
    find.find { |tier| tier.name == name }
  end

  def has_module?(mod_name)
    data['accountModules'].try(:any?) { |am| am['name'] == mod_name.to_s }
  end
end
