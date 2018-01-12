package_json_file = Rails.root.join('package.json')

# See also config/application.rb
# That is where the values in Rails.configuration.webpack are initialized.

if ENV.key?('WEBPACK_USE_MANIFEST')
  Rails.configuration.webpack[:use_manifest] = ENV['WEBPACK_USE_MANIFEST'].to_s.downcase == 'true'
end
if ENV.key?('WEBPACK_USE_DEV_SERVER')
  Rails.configuration.webpack[:use_dev_server] = ENV['WEBPACK_USE_DEV_SERVER'].to_s.downcase == 'true'
end

if File.exist?(package_json_file)
  package_json = JSON.parse(File.read(package_json_file)).with_indifferent_access
  Rails.configuration.webpack[:dev_server_port] = package_json[:config][:webpackDevServerPort]
end

if Rails.configuration.webpack[:use_manifest]
  if Rails.env.test?
    asset_manifest_path = Rails.root.join('spec', 'fixtures', 'webpack_manifest.json')
  else
    asset_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'manifest.json')
  end

  if File.exist?(asset_manifest_path)
    Rails.configuration.webpack[:asset_manifest] = JSON.parse(File.read(asset_manifest_path)).with_indifferent_access
  else
    raise RuntimeError.new("Unable to locate asset manifest: #{asset_manifest_path}")
  end

  Rails.logger.warn(Rails.configuration.webpack[:asset_manifest])
end
