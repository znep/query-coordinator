package_json_file = Rails.root.join('package.json')

if File.exist?(package_json_file)
  package_json = JSON.parse(File.read(package_json_file)).with_indifferent_access
  Rails.configuration.webpack[:dev_server_port] = package_json[:config][:webpackDevServerPort]
end

if Rails.configuration.webpack[:use_manifest]
  asset_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'manifest.json')
  datalens_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'data-lens-manifest.json')
  datalens_mobile_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'data-lens-mobile-manifest.json')
  dataset_landing_page_manifest_path = Rails.root.join('public', 'javascripts', 'build', 'dataset-landing-page-manifest.json')

  asset_manifest = {}
  datalens_manifest = {}
  datalens_mobile_manifest = {}
  dataset_landing_page_manifest = {}

  if File.exist?(asset_manifest_path)
    asset_manifest = JSON.parse(File.read(asset_manifest_path)).with_indifferent_access
  end

  if File.exist?(datalens_manifest_path)
    datalens_manifest = JSON.parse(File.read(datalens_manifest_path)).with_indifferent_access
  end

  if File.exist?(datalens_mobile_manifest_path)
    datalens_mobile_manifest = JSON.parse(File.read(datalens_mobile_manifest_path)).with_indifferent_access
  end

  if File.exist?(dataset_landing_page_manifest_path)
    dataset_landing_page_manifest = JSON.parse(File.read(dataset_landing_page_manifest_path)).with_indifferent_access
  end

  Rails.configuration.webpack[:asset_manifest] = asset_manifest.
    merge(datalens_manifest).
    merge(datalens_mobile_manifest).
    merge(dataset_landing_page_manifest)

  Rails.logger.warn(Rails.configuration.webpack[:asset_manifest])
end
