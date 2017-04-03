# The purpose of this migration is to address issue, https://socrata.atlassian.net/browse/EN-9334.
# During the SEA1 -> AWS migration, we moved all uploaded files to a new bucket in us-east-1.
# We are updating all components that refer to the old bucket to point to the new bucket.
class MigrateComponentsForProdBucketChage < ActiveRecord::Migration
  OLD_PROD_BUCKET = 'sa-storyteller-cust-us-west-2-prod'.freeze
  NEW_PROD_BUCKET = 'sa-storyteller-cust-us-east-1-fedramp-prod'.freeze

  def up
    component_types_to_migrate = %w( image hero author embeddedHtml )

    blocks_to_migrate = component_types_to_migrate.inject([]) do |blocks, component_type|
      blocks.concat(Block.with_component_type(component_type).order('created_at DESC'))
    end

    blocks_to_migrate.each do |block|
      # only update block if we have something to change
      updating_block = false

      new_components = block.components.clone
      new_components.each do |component|
        next unless component_types_to_migrate.include?(component['type'])

        # saving the last part of the URL
        old_bucket_url_regex = %r{^https://#{OLD_PROD_BUCKET}(.*)$}

        case component['type']
        when 'image', 'hero', 'embeddedHtml'
          if component['value']['url'] =~ old_bucket_url_regex
            component['value']['url'] = "https://#{NEW_PROD_BUCKET}#{$1}"
            updating_block = true
          end
        when 'author' # ☹️ author block has a different structure
          if component['value']['image']['url'] =~ old_bucket_url_regex
            component['value']['image']['url'] = "https://#{NEW_PROD_BUCKET}#{$1}"
            updating_block = true
          end
        end
      end

      if updating_block
        puts "Updating components on block, #{block.id}"
        block.update_columns(components: new_components, updated_at: Time.current)
      end
    end

  end

  def down
    # Nothing to do
  end
end
