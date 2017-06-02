class UpdateHeroComponentToIncludeValue < ActiveRecord::Migration
  def up
    Block.with_component_type('hero').each do |block|
      new_components = block.components.clone

      block.components.each_with_index do |component, index|
        next if component['type'] != 'hero' || component['value'].present?
        new_components[index]['value'] ||= {'html': ''}
      end

      block.update_column(:components, new_components)
    end
  end

  def down
  end
end
