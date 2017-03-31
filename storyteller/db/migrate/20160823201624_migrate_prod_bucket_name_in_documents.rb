# The purpose of this migration is to address issue, https://socrata.atlassian.net/browse/EN-9334.
# During the SEA1 -> AWS migration, we moved all uploaded files to a new bucket in us-east-1.
# We are updating all direct_upload_url columns that refer to the old bucket to point to the new bucket.
class MigrateProdBucketNameInDocuments < ActiveRecord::Migration
  OLD_PROD_BUCKET = 'sa-storyteller-cust-us-west-2-prod'.freeze
  NEW_PROD_BUCKET = 'sa-storyteller-cust-us-east-1-fedramp-prod'.freeze

  def up
    Document.where('direct_upload_url LIKE ?', "https://#{OLD_PROD_BUCKET}%").each do |document|
      new_url = document.direct_upload_url.sub(
        %r{^https://#{OLD_PROD_BUCKET}(.*)$},
        "https://#{NEW_PROD_BUCKET}#{$1}"
      )
      document.update_attribute(:direct_upload_url, new_url)
    end
  end

  def down
    # Nothing to do
  end
end
