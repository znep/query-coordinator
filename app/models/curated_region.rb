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

  def self.find_by_view_id(view_id)
    find({
      :method => 'getByViewUid',
      :viewUid => view_id
    })
  end

  def default?
    defaultFlag
  end

  def enabled?
    enabledFlag
  end

  def disabled?
    !enabledFlag
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
    CuratedRegion.geometry_label_columns(view)
  end

  def primary_key_columns
    CuratedRegion.primary_key_columns(view)
  end

  def self.geometry_label_columns(view)
    view.columns.select { |column| %w(text number boolean date).include?(column.dataTypeName) }
  end

  def self.primary_key_columns(view)
    view.columns.select { |column| column.dataTypeName == 'number' }
  end

  def as_json(options={})
    {
      :id => id,
      :enabledFlag => enabledFlag,
      :name => name,
      :featurePk => featurePk,
      :primaryKeyColumns => primary_key_columns,
      :geometryLabel => geometryLabel,
      :geometryLabelColumns => geometry_label_columns
    }
  end

end
