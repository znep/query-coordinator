package_json_file = Rails.root.join('package.json')

if File.exist?(package_json_file)
  package_json = JSON.parse(File.read(package_json_file)).with_indifferent_access
  Rails.configuration.webpack[:dev_server_port] = package_json[:config][:webpackDevServerPort]
end

if Rails.configuration.webpack[:use_manifest]
  asset_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'manifest.json')

  if File.exist?(asset_manifest_path)
    Rails.configuration.webpack[:asset_manifest] = JSON.parse(File.read(asset_manifest_path)).with_indifferent_access
  end

  Rails.logger.warn(Rails.configuration.webpack[:asset_manifest])
end
