class AccountModule < Model
  def self.find
    @modules ||= super.sort { |a, b| a.name <=> b.name }
  end

  def self.include?(module_name)
    find.pluck('name').include?(module_name)
  end
end
