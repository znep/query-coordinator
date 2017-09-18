class LicenseConfig < ExternalConfig
  extend Forwardable

  def_delegators :@licenses, :each

  def filename
    @filename ||= "#{Rails.root}/config/licenses.yml"
  end

  def update!
    Rails.logger.info("Config Update [#{uniqId}] from #{filename}")

    @licenses = YAML.load_file(filename) || []
    @licenses.each do |license|
      license.symbolize_keys!
      license[:licenses].collect(&:symbolize_keys!) if license[:licenses]
    end

    # Invalidate cache vars.
    @merged_licenses = nil
  end

  def find_by_id license_id
    @licenses.reduce(nil) do |found_license, license|
      found_license ||= if license[:id] == license_id
                          license
                        elsif license[:licenses].present?
                          license[:licenses].find do |categorized_license|
                            categorized_license[:id] == license_id
                          end
                        end
    end
  end

  # This is for the no_js path; we provide a flattened list of all licenses.
  # This is called by datasets_helper and is the default rendered state.
  def merged_licenses
    @merged_licenses ||= @licenses.reduce({}) do |merged, license|
      if license[:licenses].present?
        license[:licenses].each do |categorized_license|
          name = get_name_for categorized_license, license
          merged[name] = categorized_license[:id]
        end
      elsif license[:hide_selector] != true
        name = get_name_for license
        merged[name] = license[:id]
      end
      merged
    end
  end

  # This is for the js_enabled path; we provide a hierarchical list of all licenses.
  # This is dumped into the Javascript and consumed by edit-license.js.
  def licenses
    @licenses.
      reject { |license| license[:hide_selector] }.
      map { |license|
        license[:name] = I18n.t('core.see_terms_of_use') if license[:id] == 'SEE_TERMS_OF_USE'
        license
      }.
      unshift(no_license)
  end

  private
  def get_name_for license, category = {}
    name = license[:selector_name]
    name ||= [category[:name], license[:name]].compact.join(' ') unless license[:name].nil?
    name ||= license[:display_name]
    name
  end

  def no_license
    { id: '', name: "-- #{I18n.t 'core.no_license'} --" }
  end
end
