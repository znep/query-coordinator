class GettyImagesApi
  @@client = ConnectSdk.new(
    Rails.application.secrets.getty['api_key'],
    Rails.application.secrets.getty['api_secret']
  )
end
