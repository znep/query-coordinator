module CommonMetadataTransitionMethods

  def metadata_transition_phase
    FeatureFlags.derive(nil, nil)[:metadata_transition_phase].to_s.downcase
  end

  def metadata_transition_phase_0?
    metadata_transition_phase == '0' || metadata_transition_phase == 'false'
  end

  def metadata_transition_phase_1?
    metadata_transition_phase == '1'
  end

  def metadata_transition_phase_2?
    metadata_transition_phase == '2'
  end

end
