module BlockOperations
  extend ActiveSupport::Concern

  included do

    def retrieve_blocks()
      Block.for_story(self)
    end
  end
end
