module BlockOperations
  extend ActiveSupport::Concern

  included do

    def blocks
      Block.for_story(self)
    end

    def blocks_with_component_type(type)
      blocks = Block.for_story(self)
      blocks.select do |block|
        block.components.any? { |component| component['type'] == type }
      end
    end

    def block_images
      blocks = blocks_with_component_type('image')
      images = blocks.map do |block|
        block.components.map do |component|
          component['value']['url']
        end
      end
      images.flatten
    end
  end
end
