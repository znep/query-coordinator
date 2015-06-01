module BlockOperations
  extend ActiveSupport::Concern

  included do

    def retrieve_blocks
      # The order in which block rows are returned from the database is not
      # guaranteed to match the order in which the ids were supplied to the
      # select query, so we need to apply the story's ordering of the blocks
      # to the query result before returning it.
      block_objects = Block.for_story(self)
      ordered_block_objects = []

      self.block_ids.each do |block_id|
        ordered_block_objects << block_objects.detect { |block_object|
          block_object.id == block_id
        }
      end

      ordered_block_objects
    end
  end
end
