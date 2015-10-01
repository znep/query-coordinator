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

  # we get a partial view object from the curated_region API, this gets the whole view
  def view
    @view ||= View.find(@data['view']['id'])
  end

  def geometry_label_columns
    view.columns.select { |column| %w(text number boolean date).include?(column.dataTypeName) }
  end

  def primary_key_columns
    view.columns.select { |column| column.dataTypeName == 'number' }
  end

end
