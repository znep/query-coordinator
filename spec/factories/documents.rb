FactoryGirl.define do

  factory :document do
    story_uid             'four-four'
    direct_upload_url     "https://#{Rails.application.secrets.aws['s3_bucket_name']}.s3.amazonaws.com/uploads/random/the_filename.png"
    upload_file_name      'the_filename.png'
    upload_content_type   'image/png'
    upload_file_size      12345
    upload_updated_at     nil
    status                1
    created_by            'user-4x4x'

    factory :invalid_document do
      direct_upload_url 'https://example.com/somefile.exe'
    end
  end

end
