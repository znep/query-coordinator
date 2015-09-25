module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      Block.for_story_in_order(self)
    end

    def block_images
      blocks = Block.for_story(self).with_component_type('image')
      ordered_blocks = Block.in_story_order(blocks, self).compact

      ordered_blocks.map do |block|
        block.components.
          select { |component| component['type'] == 'image'}.
          map { |component| component['value']['url'] }
      end.flatten
    end
  end
end
