use std::path::PathBuf;
use tauri::Manager;

fn save_path(app: &tauri::AppHandle, file_name: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join(file_name))
}

pub fn write_save(app: &tauri::AppHandle, file_name: &str, content: &str) -> Result<(), String> {
    let path = save_path(app, file_name)?;
    std::fs::write(path, content).map_err(|err| err.to_string())
}

pub fn read_save(app: &tauri::AppHandle, file_name: &str) -> Result<String, String> {
    let path = save_path(app, file_name)?;
    std::fs::read_to_string(path).map_err(|err| err.to_string())
}

pub fn delete_save(app: &tauri::AppHandle, file_name: &str) -> Result<(), String> {
    let path = save_path(app, file_name)?;
    if path.exists() {
        std::fs::remove_file(path).map_err(|err| err.to_string())?;
    }
    Ok(())
}
