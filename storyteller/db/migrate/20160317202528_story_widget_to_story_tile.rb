class StoryWidgetToStoryTile < ActiveRecord::Migration
  def up
    migrate_type('story.widget', 'story.tile')
  end

  def down
    migrate_type('story.tile', 'story.widget')
  end

  def migrate_type(from, to)
    Block.with_component_type(from).each do |block|
      new_components = block.components.clone

      block.components.each_with_index do |component, index|
        next if component['type'] != from
        new_components[index]['type'] = to
      end

      block.update_column(:components, new_components)
    end
  end
end
