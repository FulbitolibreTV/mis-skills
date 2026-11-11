"""Pruebas sin dependencias externas para la skill."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]

class TestEstructura(unittest.TestCase):
    def test_skill_con_frontmatter(self):
        text = (ROOT / 'SKILL.md').read_text(encoding='utf-8')
        self.assertTrue(text.startswith('---\n'))
        self.assertIn('name: opus-video-inspiracion', text)
        self.assertIn('window.seek', text)

    def test_referencias_y_licencias(self):
        text = (ROOT / 'referencias' / 'REFERENCIAS.md').read_text(encoding='utf-8')
        self.assertIn('https://github.com/yihui-dev/awesome-opus5-5-videos', text)
        self.assertIn('materiales enlazados', text)

    def test_plantillas(self):
        text = (ROOT / 'referencias' / 'PLANTILLAS.md').read_text(encoding='utf-8')
        self.assertIn('MP4', text)
        self.assertIn('Three.js', text)

if __name__ == '__main__':
    unittest.main()
