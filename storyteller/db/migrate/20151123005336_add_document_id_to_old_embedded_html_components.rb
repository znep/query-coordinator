class AddDocumentIdToOldEmbeddedHtmlComponents < ActiveRecord::Migration
  def up
    Block.with_component_type('embeddedHtml').each do |block|
      new_components = block.components.clone
      block.components.each_with_index do |component, index|
        next if component['type'] != 'embeddedHtml' || component['value']['documentId'].present?

        # Looking for the '000/000/001/' part in 'https://sa-storyteller-dev-us-west-2-staging.s3.amazonaws.com/documents/uploads/000/000/001/original/IMG_2358.JPG?1443023294'
        document_id = $1 if component['value']['url'] =~ /documents\/uploads\/(([0-9]+\/){3})/
        document_id = document_id.gsub('/', '').to_i
        puts "Updating Block(id: #{block.id}).component[#{index}]['value']['documentId'] to #{document_id}..."
        new_components[index]['value']['documentId'] = document_id
      end

      block.update_column(:components, new_components)
    end
  end

  def down
    # Nothing to down
  end
end
