use crate::save;

#[tauri::command]
pub fn save_game_state(app: tauri::AppHandle, state_json: String) -> Result<(), String> {
    save::write_save(&app, "autosave.json", &state_json)
}

#[tauri::command]
pub fn load_game_state(app: tauri::AppHandle) -> Result<String, String> {
    save::read_save(&app, "autosave.json")
}

#[tauri::command]
pub fn export_match_log(log_json: String, path: String) -> Result<(), String> {
    std::fs::write(path, log_json).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn import_match_log(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn clear_save(app: tauri::AppHandle) -> Result<(), String> {
    save::delete_save(&app, "autosave.json")
}

#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
