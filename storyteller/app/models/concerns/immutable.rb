module Immutable
  extend ActiveSupport::Concern

  included do

    def readonly?
      persisted?
    end
  end
end
