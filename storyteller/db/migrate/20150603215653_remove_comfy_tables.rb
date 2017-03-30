class RemoveComfyTables < ActiveRecord::Migration
  def up
    drop_table :comfy_cms_blocks, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_blocks'
    drop_table :comfy_cms_categories, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_categories'
    drop_table :comfy_cms_categorizations, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_categorizations'
    drop_table :comfy_cms_files, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_files'
    drop_table :comfy_cms_layouts, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_layouts'
    drop_table :comfy_cms_pages, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_pages'
    drop_table :comfy_cms_revisions, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_revisions'
    drop_table :comfy_cms_snippets, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_snippets'
    drop_table :comfy_cms_sites, force: :cascade if ActiveRecord::Base.connection.table_exists? 'comfy_cms_sites'
  end

  def down
    # We're not going to reverse this migration even if the current deployment fails...
    # Since a previous sprint deployment has made these tables obsolete, we're completely sure they're no longer used.
    # There's no need to recreate them in the event of a rollback just so they can be DROPped again when the current
    # deployment succeeds.
  end
end
