class LicenseConfig < ExternalConfig
  extend Forwardable

  def_delegators :@licenses, :each
  attr_reader :licenses

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

  def merged_licenses
    @merged_licenses ||= @licenses.reduce({}) do |merged, license|
      if license[:licenses].present?
        license[:licenses].each do |categorized_license|
          name = get_name_for categorized_license
          merged[name] = categorized_license[:id]
        end
      else
        name = get_name_for license
        merged[name] = license[:id]
      end
      merged
    end
  end

  private
  def get_name_for license
    license[:selector_name] || license[:name] || license[:display_name]
  end
end
