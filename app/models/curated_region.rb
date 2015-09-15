class CuratedRegion < Model

  def self.get_all
    curated_regions = CuratedRegion.find.
      partition { |r| r.default? }

    default_curated_regions = curated_regions[0]
    custom_curated_regions = curated_regions[1]

    all_regions = default_curated_regions + custom_curated_regions
    available_count = all_regions.length
    enabled_count = all_regions.select {|r| r.enabled? }.length

    {
      :counts => {
        :available => available_count,
        :enabled => enabled_count
      },
      :custom => custom_curated_regions,
      :default => default_curated_regions
    }
  end

  def self.find_enabled( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    options ||= {}
    options[:enabledOnly] = true
    find(options, custom_headers, batch, is_anon)
  end

  def self.find_default( options = nil, custom_headers = {}, batch = nil, is_anon = false )
    options ||= {}
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
