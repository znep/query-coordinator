module V4Chrome
module Routing

  module RouteExtensions
    def self.included(base)
      base.alias_method_chain :recognition_conditions, :v4_dataset
    end

    def recognition_conditions_with_v4_dataset
      result = recognition_conditions_without_v4_dataset
      result << "conditions[:has_v4_dataset] === env[:has_v4_dataset]" if conditions[:has_v4_dataset]
      result
    end
  end

end
end
