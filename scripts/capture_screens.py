#!/usr/bin/env python3
"""Render manual examples from the current firmware HMI using its existing preview.

Usage: CMAKE_BIN=/path/to/native/cmake python3 scripts/capture_screens.py /path/to/pump_dispenser
Requires macOS on Apple Silicon, Xcode command line tools and ARM Homebrew SDL2.
Only a temporary copy of the preview fixtures is changed; firmware stays untouched.
"""
import os
import platform
import re
import shutil
import struct
import subprocess
import sys
import tempfile
from pathlib import Path

SCENARIOS = (
    "dispense", "confirm", "progress", "paused", "result", "wait", "main",
    "calibration", "calibration-fixed-running", "calibration-fixed-input",
    "calibration-note", "calibration-beaker", "calibration-ready", "calibration-model",
    "calibration-point-input", "calibration-selection", "calibration-verify-result",
    "stage53-total-before", "settings-reservoir-replace-input",
    "settings-dispense", "settings-system", "settings-pump", "recovery",
)


def run(*args, **kwargs):
    return subprocess.run(args, check=True, text=True, **kwargs)


def replace_once(path, before, after):
    text = path.read_text()
    assert text.count(before) == 1, f"Preview source changed: {path.name}"
    path.write_text(text.replace(before, after))


def main():
    assert platform.system() == "Darwin" and platform.machine() == "arm64"
    firmware = Path(sys.argv[1]).resolve()
    header = firmware / "firmware/controller/components/product_metadata/firmware_version.h"
    version = re.search(r'#define FIRMWARE_VERSION "(\d+\.\d+\.\d+)"', header.read_text())[1]
    output = Path(__file__).resolve().parents[1] / "admin" / version / "images"
    assert output.parent.is_dir(), "Create the matching version of the manual first"
    cmake = os.environ.get("CMAKE_BIN", str(Path.home() / ".espressif/tools/cmake/3.30.2/CMake.app/Contents/bin/cmake"))
    cc = run("xcrun", "--find", "cc", capture_output=True).stdout.strip()
    for executable in (cmake, cc, "/usr/bin/make", "/usr/bin/sips", "/opt/homebrew/opt/sdl2/lib/libSDL2.dylib"):
        assert "arm64" in run("file", "-L", executable, capture_output=True).stdout, executable

    with tempfile.TemporaryDirectory(prefix="refill-guide-capture-") as temporary:
        preview = Path(temporary) / "preview"
        shutil.copytree(firmware / "tools/ui_preview", preview, ignore=shutil.ignore_patterns(".build", "__pycache__"))
        replace_once(preview / "CMakeLists.txt", "set(PROJECT_ROOT ${PREVIEW_ROOT}/../..)", f'set(PROJECT_ROOT "{firmware}")')
        # Use supported display settings in the example fixture. No HMI source or pixels are edited.
        replace_once(preview / "src/preview_app_stubs.c", "void preview_app_configure_hmi(void)\n{", """void preview_app_configure_hmi(void)
{
    s_status.hidden_settings_menus = (1U << CONTROLLER_SETTINGS_SCALE) |
                                     (1U << CONTROLLER_SETTINGS_WIRELESS);
    s_status.amount_unit = CONTROLLER_AMOUNT_GRAMS;""")
        stub = preview / "src/preview_app_stubs.c"
        stub.write_text(stub.read_text().replace('"UI Preview"', f'"{version}"'))
        # The existing model example has six saved samples. Also capture an empty profile.
        replace_once(stub, '    if (strncmp(name, "calibration-", 12)',
            '    if (strcmp(name, "calibration-ready") == 0) return true;\n    if (strncmp(name, "calibration-", 12)')
        main_source = preview / "src/preview_main.c"
        replace_once(main_source, 'if (strcmp(scenario, "calibration-model") == 0 ||',
            'if (strcmp(scenario, "calibration-ready") == 0 || strcmp(scenario, "calibration-model") == 0 ||')
        # The existing reservoir scenario submits the form; capture it before entry instead.
        replace_once(main_source, '''        return open_settings_page_and_click("reservoir", "말통 교체") ||
               open_settings_page_and_click("reservoir", "New container");''', '''        if (!ui_navigation_go(SCR_SETTINGS)) return false;
        run_for(120);
        screen_settings_show_page(SCREEN_SETTINGS_RESERVOIR);
        run_for(120);
        if (!click_button_at_rendered_position("말통 교체")) return false;
        run_for(160);
        return ui_navigation_current() == SCR_SETTINGS_INPUT &&
               find_button_with_label(lv_scr_act(), "저장") != NULL;''')
        build = Path(temporary) / "build"
        sdk = run("xcrun", "--sdk", "macosx", "--show-sdk-path", capture_output=True).stdout.strip()
        run(cmake, "-S", str(preview), "-B", str(build), "-DCMAKE_OSX_ARCHITECTURES=arm64",
            f"-DCMAKE_C_COMPILER={cc}", f"-DCMAKE_OSX_SYSROOT={sdk}", "-DCMAKE_MAKE_PROGRAM=/usr/bin/make",
            "-DCMAKE_PREFIX_PATH=/opt/homebrew;/opt/homebrew/opt/sdl2",
            "-DSDL2_DIR=/opt/homebrew/opt/sdl2/lib/cmake/SDL2",
            "-DSDL2_PARENT_INCLUDE_DIR=/opt/homebrew/opt/sdl2/include")
        run(cmake, "--build", str(build), "--target", "refill_station_ui_preview", "-j", "4")
        binary = build / "refill_station_ui_preview"
        assert "arm64" in run("file", "-L", str(binary), capture_output=True).stdout
        output.mkdir(exist_ok=True)
        for scenario in SCENARIOS:
            bmp = Path(temporary) / f"{scenario}.bmp"
            png = output / f"{scenario}.png"
            run(str(binary), "--capture", scenario, str(bmp), env={**os.environ, "SDL_VIDEODRIVER": "dummy", "SDL_RENDER_DRIVER": "software"})
            run("/usr/bin/sips", "-s", "format", "png", str(bmp), "--out", str(png), capture_output=True)
            data = png.read_bytes()
            assert data[:8] == b"\x89PNG\r\n\x1a\n" and struct.unpack(">II", data[16:24]) == (800, 480), scenario
            print(f"Captured {version}/{scenario}.png", flush=True)


if __name__ == "__main__":
    main()
