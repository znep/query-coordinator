module AirbrakeHelper

  def airbrake_config_for_js
    # airbrake-js uses different names for configuration options
    key_mappings = {
      :project_id => :projectId,
      :api_key => :projectKey,
      :environment_name => :environment
    }

    relevant_config = Airbrake.configuration.to_hash.slice(:api_key, :project_id, :environment_name)

    # The airbrake gem does not export :project_id in the output from #to_hash   (╯°□°)╯︵ ┻━┻
    unless Airbrake.configuration.project_id.blank?
      relevant_config[:project_id] = Airbrake.configuration.project_id
    end

    Hash[relevant_config.map {|key, value| [key_mappings[key], value] }]
  end
end
