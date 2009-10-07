# Determine which environments to do asset packaging for.
# By default, it's only in production, but we want to run it in staging 
# (test.socrata.com) as well.
Synthesis::AssetPackage.merge_environments = ['production', 'staging']

# Uncomment to also run in development (for local testing)
# You'll also want to run:
#   rake asset:packager:delete_all
#   rake asset:packager:build_all
# To rebuild the list of assets.
#
#Synthesis::AssetPackage.merge_environments << 'development'
