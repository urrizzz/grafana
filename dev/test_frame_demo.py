import unittest
from generate_frame_demo import START, END, frames, status_at, rate_at

class FrameDemoTests(unittest.TestCase):
    def test_outage_history_and_recovery(self):
        for i in range(3):
            self.assertEqual(status_at(i, START+49*60000), 1)
            self.assertEqual(status_at(i, START+50*60000), 2)
            self.assertEqual(status_at(i, START+60*60000), 1)
        self.assertEqual(status_at(2, END-31*60000), 1)
        self.assertEqual(status_at(2, END-30*60000), 2)
        self.assertEqual(status_at(2, END), 2)
        self.assertEqual(status_at(0, END), 1)

    def test_zero_outage_windows_and_pre_outage_traffic(self):
        for direction in ['in','out']:
            for i in range(3):
                self.assertGreater(rate_at(i,direction,START+50*60000), 0)
                self.assertEqual(rate_at(i,direction,START+55*60000), 0)
                self.assertEqual(rate_at(i,direction,START+60*60000), 0)
                self.assertGreater(rate_at(i,direction,START+65*60000), 0)
            self.assertEqual(rate_at(2,direction,END), 0)
            self.assertGreater(rate_at(2,direction,END-30*60000), 0)

    def test_current_matches_last_history_and_directions_differ(self):
        for history,current in [('A','C'),('B','D'),('E','F')]:
            for historical,instant in zip(frames(history),frames(current)):
                self.assertEqual(historical['data']['values'][1][-1],instant['data']['values'][1][0])
        self.assertNotEqual(frames('A')[0]['data']['values'][1],frames('B')[0]['data']['values'][1])
        self.assertEqual(frames('A'),frames('A'))
