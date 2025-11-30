import unittest
from unittest.mock import MagicMock, patch
import json
from agent import IntelligentAgent

class TestIntelligentAgent(unittest.TestCase):
    def setUp(self):
        self.agent = IntelligentAgent('COM_MOCK', 115200)
        self.agent.ser = MagicMock()

    def test_process_normal_data(self):
        data = json.dumps({"temp": 25.0, "humidity": 50.0, "flow": 20.0})
        commands = self.agent.process_data(data)
        self.assertIn("ACT1:OFF", commands)
        self.assertIn("ACT2:OFF", commands)

    def test_process_high_temp(self):
        data = json.dumps({"temp": 35.0, "humidity": 50.0, "flow": 20.0})
        commands = self.agent.process_data(data)
        self.assertIn("ACT1:ON", commands)
        self.assertIn("ACT2:OFF", commands)

    def test_process_high_flow(self):
        data = json.dumps({"temp": 25.0, "humidity": 50.0, "flow": 80.0})
        commands = self.agent.process_data(data)
        self.assertIn("ACT1:OFF", commands)
        self.assertIn("ACT2:ON", commands)

    def test_process_both_high(self):
        data = json.dumps({"temp": 35.0, "humidity": 50.0, "flow": 80.0})
        commands = self.agent.process_data(data)
        self.assertIn("ACT1:ON", commands)
        self.assertIn("ACT2:ON", commands)

    def test_invalid_json(self):
        data = "Not JSON"
        commands = self.agent.process_data(data)
        self.assertEqual(commands, [])

if __name__ == '__main__':
    unittest.main()
