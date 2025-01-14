use std::{path::Path, process::Command};

const JS_DIST_DIR: &str = "js/dist";

fn main() {
  if !Path::new(JS_DIST_DIR).exists() {
    let status = Command::new("pnpm")
      .current_dir("js")
      .arg("init-repo")
      .status()
      .unwrap();
    if !status.success() {
      panic!("Failed to install/build JS")
    }
  }
}
