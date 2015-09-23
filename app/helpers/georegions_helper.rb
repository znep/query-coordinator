module GeoregionsHelper
  def can_view_georegions_admin?(current_user)
    feature_flag?(:enable_spatial_lens_admin, request) &&
      (user_can?(current_user, :edit_others_datasets) ||
        user_can?(current_user, :edit_site_theme))
  end
end
