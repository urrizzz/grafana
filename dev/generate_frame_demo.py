"""Generate deterministic Grafana TestData frames; no exporter or production connection required."""
import json
import random
from pathlib import Path
from datetime import datetime, timezone
ROOT = Path(__file__).resolve().parents[1]
END = 1790337600000  # fixed historical range, not wall-clock current data
START = END - 12 * 3600000
ROUTERS = [('192.0.2.10', 'CORE-01', 'Tunnel10', 'Primary WAN', 'Cisco tunnel', 1),
           ('192.0.2.10', 'CORE-01', 'GigabitEthernet0/1', 'Uplink', 'Physical uplink', 1),
           ('192.0.2.21', 'BRANCH-01', 'Tunnel10', 'Backup WAN', 'Branch tunnel', 2)]
DS = {'type': 'grafana-testdata-datasource', 'uid': 'network-map-testdata'}
def iso(value): return datetime.fromtimestamp(value / 1000, timezone.utc).isoformat()
def status_at(channel_index, time):
    minute = (time - START) // 60000
    return 2 if 50 <= minute < 60 or (channel_index == 2 and minute >= 690) else 1

def minute_rate(channel_index, direction, time):
    if status_at(channel_index, time) == 2:
        return 0
    minute = (time - START) // 60000
    rng = random.Random(1701 + channel_index * 100000 + minute * 37 + (direction == 'out') * 700000)
    base = (channel_index + 1) * 1000000 * (0.65 if direction == 'out' else 1)
    return round(base * (0.25 + rng.random() * 2.5) * (2.5 if rng.random() < 0.08 else 1))

def rate_at(channel_index, direction, time):
    # Rate at t covers [t-5m, t); partial windows average UP minutes and zero DOWN minutes.
    return sum(minute_rate(channel_index, direction, time - offset * 60000) for offset in range(1, 6)) / 5

def frames(role):
    result = []
    for i, (instance, name, channel, alias, description, state) in enumerate(ROUTERS):
        labels = dict(instance=instance, name=name, ifName=channel, ifAlias=alias, ifDescr=description)
        step = 60000 if role == 'E' else 300000
        times = list(range(START, END + 1, step)) if role in 'ABE' else [END]
        if role in 'ABCD': values = [rate_at(i, 'in' if role in 'AC' else 'out', time) for time in times]
        elif role in 'EF': values = [status_at(i, time) for time in times]
        elif role == 'G': values = [100 if i != 1 else 1000] * len(times)
        else: values = [1] * len(times)
        result.append({'schema': {'refId': role, 'fields': [
            {'name': 'Time', 'type': 'time'}, {'name': 'Value', 'type': 'number', 'labels': labels},
            {'name': 'sourceTimestamp', 'type': 'number'}, {'name': 'sampleCount', 'type': 'number'}]},
            'data': {'values': [times, values, times, [5] * len(times)]}})
    if role == 'H':
        result.append({'schema': {'refId': role, 'fields': [{'name': 'Time', 'type': 'time'},
            {'name': 'Value', 'type': 'number', 'labels': dict(instance='192.0.2.21', name='BRANCH-01', ifName='Tunnel99', ifAlias='Metadata only', ifDescr='No rates or status')}]}, 'data': {'values': [[END], [1]]}})
    return result

def generate():
    diagram = dict(routers=[dict(id='r1',name='CORE-01',instance='192.0.2.10',x=40,y=200),dict(id='r2',name='BRANCH-01',instance='192.0.2.21',x=700,y=70)],
        traffic=[dict(id='t1',routerId='r1',ifName='Tunnel10',alias='',description='',width=120,x=300,y=150),dict(id='t2',routerId='r2',ifName='Tunnel10',alias='',description='',width=120,x=600,y=300)],
        connections=[dict(id='c1',source='r1',target='r2')])
    dashboard=dict(uid='network-map-data-dev', title='Network Traffic Map - M2 data preview', schemaVersion=39,version=1,
        time={'from':iso(START),'to':iso(END)},timezone='utc',panels=[dict(id=1,type='urrizzz-interfacemap-panel',title='Network Traffic Map data preview',
        datasource=DS,gridPos=dict(x=0,y=0,w=24,h=22),options=dict(schemaVersion=1,diagram=diagram,mapping=dict(sourceTime='sourceTimestamp',sampleCount='sampleCount')),
        targets=[dict(refId=role,datasource=DS,scenarioId='raw_frame',rawFrameContent=json.dumps(frames(role))) for role in 'ABCDEFGH'])])
    (ROOT/'provisioning/dashboards/data-preview.json').write_text(json.dumps(dashboard,indent=2)+'\n',encoding='utf-8')
if __name__ == '__main__': generate()
