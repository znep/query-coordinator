class RemoveComfyTables < ActiveRecord::Migration
  def up
    drop_table :comfy_cms_blocks, force: :cascade
    drop_table :comfy_cms_categories, force: :cascade
    drop_table :comfy_cms_categorizations, force: :cascade
    drop_table :comfy_cms_files, force: :cascade
    drop_table :comfy_cms_layouts, force: :cascade
    drop_table :comfy_cms_pages, force: :cascade
    drop_table :comfy_cms_revisions, force: :cascade
    drop_table :comfy_cms_snippets, force: :cascade
    drop_table :comfy_cms_sites, force: :cascade
  end

  def down
    # NO RETURN
  end
end
