class AddSkipThumbnailGenerationToDocuments < ActiveRecord::Migration
  def change
    add_column :documents, :skip_thumbnail_generation, :boolean
  end
end
