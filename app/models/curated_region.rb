class CuratedRegion < Model

  def self.all
    find(:enabledOnly => false, :defaultOnly => false)
  end

  def self.find_enabled( options = {}, custom_headers = {}, batch = nil, is_anon = false )
    options[:enabledOnly] = true
    find(options, custom_headers, batch, is_anon)
  end

  def self.find_default( options = {}, custom_headers = {}, batch = nil, is_anon = false )
    options[:defaultOnly] = true
    find(options, custom_headers, batch, is_anon)
  end

  def default?
    defaultFlag
  end

  def enabled?
    enabledFlag
  end

  def disable!
    update_attributes(:enabledFlag => false)
    save!
  end

end
