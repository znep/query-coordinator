# Jammit does not provide the option to selectively minify assets.
# This poses a problem to Angular apps, as function param names
# can be significant to the injector. This module provides a way to
# include the unminified code packages. Note that for this to work
# correctly in production mode, the unminified packages must have
# been built by running rake assets:unminified. These packages
# live in #{Jammit.package_path/unminified/}
module UnminifiedAssetsHelper

  def include_javascripts_unminified(*packages)
    # This is adapted from Jammit's Jammit::Helper.include_javascripts
    if Rails.env.development? || !Jammit.package_assets
      include_javascripts(*packages);
    else
      tags = packages.map do |pack|
        unminified_asset_url(pack, :js)
      end
      html_safe(javascript_include_tag(tags.flatten))
    end
  end

  private

  def unminified_asset_url(package, extension, suffix=nil, mtime=nil)
    # This is adapted from Jammit's Jammit::Jammit.asset_url
    timestamp = mtime ? "?#{mtime.to_i}" : ''
    "/#{Jammit.package_path}/unminified/#{Jammit.filename(package, extension, suffix)}#{timestamp}"
  end

end
