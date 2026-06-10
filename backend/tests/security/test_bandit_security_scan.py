import subprocess
import sys


def test_bandit_scan_no_high_or_critical_findings():
    """Ejecuta Bandit y falla si se detectan hallazgos de seguridad críticos o altos."""
    result = subprocess.run(
        [sys.executable, "-m", "bandit", "-r", "backend/src", "-f", "json"],
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, (
        "Bandit detectó hallazgos de seguridad. Ejecuta 'bandit -r backend/src' para revisar los detalles.\n\n"
        f"stdout:\n{result.stdout}\n\nstderr:\n{result.stderr}"
    )

    assert result.stdout, "Bandit no produjo salida válida; revisa la instalación de bandit."
    scan_data = result.stdout
    assert "No issues identified" in scan_data or "results" in scan_data
