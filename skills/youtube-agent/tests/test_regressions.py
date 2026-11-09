"""Pruebas de regresión para YouTube Agent."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class YouTubeAgentTests(unittest.TestCase):
    def test_whisper_json_as_list(self):
        deadair = module("deadair", "skills/yt-edit/deadair.py")
        rows = [{"start": 0, "end": 1.2, "text": "Hola mundo"}]
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "whisper.json"
            file.write_text(json.dumps(rows), encoding="utf-8")
            self.assertEqual(deadair.load(str(file)), [(0.0, 1.2, "Hola mundo")])

    def test_four_thumbnail_words_warn(self):
        title = module("yt_title", "skills/yt-package/title.py")
        result = title.check("Una historia para recordar", "Cuatro palabras en pantalla")
        self.assertIn("thumb-length", [label for label, _ in result["issues"]])

    def test_duration_argument_before_csv(self):
        import io
        import sys
        from contextlib import redirect_stdout
        retention = module("retention", "skills/yt-retention/retention.py")
        with tempfile.TemporaryDirectory() as directory:
            file = Path(directory) / "retention.csv"
            file.write_text("position,retention\n" + "".join(f"{i*10},{100-i*3}\n" for i in range(8)), encoding="utf-8")
            argv = sys.argv
            try:
                sys.argv = ["retention.py", "--duration", "120", str(file), "--json"]
                with redirect_stdout(io.StringIO()) as captured:
                    retention.main()
                self.assertEqual(json.loads(captured.getvalue())["points"], 8)
            finally:
                sys.argv = argv


if __name__ == "__main__":
    unittest.main()
