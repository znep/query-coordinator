// Toggles the checkbox for the reapproval process
export const TOGGLE_REAPPROVAL = 'TOGGLE_REAPPROVAL';
export const toggleReapproval = () => ({ type: TOGGLE_REAPPROVAL });

// Call out to core to get all the settings for the assigned asset
export const FETCH_SETTINGS = 'FETCH_SETTINGS';
export const fetchSettings = () => ({ type: FETCH_SETTINGS });

// Settings were fetched sucessfully from core
export const FETCH_SETTINGS_SUCCESS = 'FETCH_SETTINGS_SUCCESS';
export const fetchSettingsSuccess = settings => ({ type: FETCH_SETTINGS_SUCCESS, settings });

// There was an error fetching the settings
export const FETCH_SETTINGS_FAIL = 'FETCH_SETTINGS_FAIL';
export const fetchSettingsFail = error => ({ type: FETCH_SETTINGS_FAIL, error });

// Change the presetState for either 'community' or 'official' tasks
export const UPDATE_TASK_PRESET_STATE = 'UPDATE_TASK_PRESET_STATE';
export const updateTaskPresetState = (taskScope, newPresetState) => ({ type: UPDATE_TASK_PRESET_STATE, taskScope, newPresetState });
