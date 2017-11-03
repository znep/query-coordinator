revision_file = File.join(Rails.root, 'REVISION')

begin
  Storyteller::REVISION_NUMBER = File.read(revision_file).chomp
  Storyteller::BUILD_TIMESTAMP = File.stat(revision_file).mtime.to_i
rescue
  Storyteller::REVISION_NUMBER = 'deadca1f'
  Storyteller::BUILD_TIMESTAMP = Time.now.to_i
end

cheetah_revision_file = File.join(Rails.root, 'CHEETAH_REVISION')
Storyteller::CHEETAH_REVISION_NUMBER = File.exist?(cheetah_revision_file) && File.read(cheetah_revision_file).chomp || ''

# `cache_key_prefix` used for socrata_site_chrome gem
Rails.application.config.cache_key_prefix = Storyteller::REVISION_NUMBER.to_s[0..7]
Rails.application.config.theme_cache_key_prefix = ENV['THEME_CACHE_KEY_PREFIX'] || Rails.application.config.cache_key_prefix

