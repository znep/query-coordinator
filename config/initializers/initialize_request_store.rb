# Kick off the RequestStore once just so that the
# LocalCache has a record of what it is

ActiveSupport::Cache::RequestStore.new