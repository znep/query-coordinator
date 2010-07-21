module V4Chrome
module Routing

  module RouteSetExtensions
    def self.included(base)
      base.alias_method_chain :extract_request_environment, :v4_dataset
    end

    def extract_request_environment_with_v4_dataset(request)
      env = extract_request_environment_without_v4_dataset(request)
      env.merge :has_v4_dataset => CurrentDomain.module_available?('new_datasets_page')
    end
  end

end
end
