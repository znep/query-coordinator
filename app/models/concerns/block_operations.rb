module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      Block.for_story(self)
    end
  end
end
