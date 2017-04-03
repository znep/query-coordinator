#
# This migration was necessary to handle migrating to a new bucket in s3. It happens that we
# store the url of the image/embeddedHtml component within the block. We have access to the
# original Document record that this component belongs to, and we can generate the correct
# url with the new bucket name by calling the `document.upload.url` method. We then save this
# back to the component config.
#
class UpdateUploadComponentUrlFromDocument < ActiveRecord::Migration
  def up
    component_types_to_migrate = %w( embeddedHtml image )

    blocks_to_migrate = component_types_to_migrate.inject([]) do |blocks, component_type|
      blocks.concat(Block.with_component_type(component_type).order('created_at DESC'))
    end

    blocks_to_migrate.each do |block|
      new_components = block.components.clone
      new_components.each do |component|
        next unless component_types_to_migrate.include?(component['type']) && component['value']['documentId'].present?

        document = Document.find(component['value']['documentId'])
        puts "Updating document #{document.id} upload url to #{document.upload.url}..."
        component['value']['url'] = document.upload.url
      end

      block.update_column(:components, new_components)
    end
  end

  def down
    # Nothing to do here
  end
end
