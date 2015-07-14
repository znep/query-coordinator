Rails.application.config.zookeeper = OpenStruct.new(
  core_server_path: 'com.socrata/soda/services/core',
  ensemble: nil
)

# The pattern that is set in apps marathon has the ZOOKEEPER_ENSEMBLE env var
# set to a string like "[\"10.92.2.4\", \"10.92.2.5\", \"10.92.2.6\"]".
# Instead of doing an eval, we just clean it up and split it up.
if ENV['ZOOKEEPER_ENSEMBLE'].present?
  ensemble = ENV['ZOOKEEPER_ENSEMBLE'].
    gsub(/\s+/, '').
    gsub(/\\"/, '').
    gsub(/\\'/, '').
    gsub(/"/, '').
    gsub(/'/, '').
    gsub(/\[/, '').
    gsub(/\]/, '').
    split(',')

  Rails.application.config.zookeeper.ensemble = ensemble
end
