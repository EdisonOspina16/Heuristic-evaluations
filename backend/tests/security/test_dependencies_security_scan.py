import subprocess
import sys


def test_pip_audit_no_vulnerable_dependencies():
    """Ejecuta pip-audit y falla si se detectan vulnerabilidades en dependencias."""
    result = subprocess.run(
        [sys.executable, "-m", "pip_audit", "--format", "json"],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        "pip-audit encontró dependencias vulnerables. Revisa la salida para corregir versiones inseguras.\n\n"
        f"stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}"
    )

    assert result.stdout, "pip-audit no produjo salida válida; revisa la instalación de pip-audit."
