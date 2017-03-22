module ProvenanceHelper
  extend self

  def disable_authority_badge?(provenance)
    [ 'all', normalized_provenance(provenance) ].include?(FeatureFlags.derive.disable_authority_badge)
  end

  def normalized_provenance(value)
    provenance = value.to_s
    provenance == 'official' ? 'official2' : provenance
  end

  def show_provenance_badge_in_old_catalog?(view)
    view.data_lens? ? FeatureFlags.derive.enable_data_lens_provenance : !disable_authority_badge?(view.provenance)
  end

  def show_official_badge_in_catalog?(view)
    FeatureFlags.derive.show_provenance_badge_in_catalog && view.is_official? && !disable_authority_badge?(view.provenance)
  end

  def show_community_badge_in_catalog?(view)
    FeatureFlags.derive.show_provenance_badge_in_catalog && view.is_community? && !disable_authority_badge?(view.provenance)
  end

end
