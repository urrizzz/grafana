"""Build a static synthetic comparison dashboard; no production datasource required."""
import json
from pathlib import Path
from mock_metrics import CASES, ROOT, integrated_octets

anchor = json.loads((ROOT / "data/mock-anchor.json").read_text())["anchor"]
end = anchor // 300 * 300
panels = [{"id": 1, "type": "text", "title": "Community comparison - scope", "gridPos": {"x":0,"y":0,"w":24,"h":5},
 "options": {"mode":"markdown","content":"**Business Charts 7.2.5 on Grafana 13.2.2.** These are custom-configured examples using the project's synthetic counter model, not an existing ready-made Cisco component.\n\n**Separate dashboard panels, not elements inside built-in Canvas.** Fixed 12-hour fixture in UTC; dashboard time/refresh and VictoriaMetrics queries are not wired into this visual comparison. No tooltips."}}]
chart = r"""
const limit = Math.ceil(Math.max(...fixture.incoming, ...fixture.outgoing) * 1.1 / 10000000) * 10000000;
const color = fixture.status === 'UP' ? '#62d791' : fixture.status === 'DOWN' ? '#ff7373' : '#b7c0cd';
const fmt = v => (Math.abs(v)/1e6).toFixed(1) + ' Mbit/s';
const text = (left, top, value, size=13, fill='#e5e7eb') => ({type:'text',left,top,z:20,style:{text:value,fontSize:size,fill,stroke:'#181b1f',lineWidth:3}});
return {
 animation:false, tooltip:{show:false},
 grid:{left:75,right:16,top:113,bottom:34},
 xAxis:{type:'category',data:fixture.times,axisLabel:{interval:(i)=>i===0||i===72||i===fixture.times.length-1,color:'#b7c0cd'},axisTick:{show:false},axisLine:{onZero:false}},
 yAxis:{type:'value',min:-limit,max:limit,interval:limit,axisLabel:{formatter:fmt,color:'#b7c0cd'},splitLine:{lineStyle:{color:'#303641'}}},
 series:[
  {name:'IN',type:'bar',data:fixture.incoming,barGap:'-100%',barCategoryGap:'20%',itemStyle:{color:'#499bff',opacity:0.5}},
  {name:'OUT',type:'bar',data:fixture.outgoing.map(v=>-v),itemStyle:{color:'#ba80ff',opacity:0.5},markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:fixture.status==='DOWN'?'#ff7373':'#707885',width:fixture.status==='DOWN'?2:1,type:'solid'},data:[{yAxis:0}]}}
 ],
 graphic:[
  {type:'circle',left:14,top:12,z:20,shape:{r:5},style:{fill:color}},
  text(32,10,fixture.status,13,color),
  text(14,33,'ifName: '+fixture.name,15),
  text(14,55,'ifAlias: '+fixture.alias),
  text(14,75,'ifDescr: '+fixture.description),
  text(14,95,'Capacity: '+fixture.capacity+' Mbit/s',11),
  text('center','42%','IN | 5m average',12),
  text('center','49%',fixture.status==='UP'?fmt(fixture.currentIn):'\u2014',24),
  text('center','72%','OUT | 5m average',12),
  text('center','79%',fixture.status==='UP'?fmt(fixture.currentOut):'\u2014',24)
 ]
};
"""
from datetime import datetime, timezone
for n,(index,status) in enumerate([(1,'UP'),(2,'DOWN'),(3,'UNKNOWN')]):
    case=CASES[index]
    def rate(t,out=False):
        stop=anchor-1800
        a,b=t-300,t
        if case[3]=='down': a,b=min(a,stop),min(b,stop)
        return integrated_octets(case,a,b,out)*8/300
    times=list(range(end-12*3600+300,end+1,300))
    fixture={"status":status,"name":case[2],"alias":f"Mock {case[3]} channel","description":f"Synthetic {case[2]}","capacity":case[4],
             "times":[datetime.fromtimestamp(t,timezone.utc).strftime('%H:%M') for t in times],
             "incoming":[rate(t) for t in times],"outgoing":[rate(t,True) for t in times],"currentIn":rate(end),"currentOut":rate(end,True)}
    panels.append({"id":n+2,"type":"volkovlabs-echarts-panel","title":"Business Charts: "+status,"pluginVersion":"7.2.5",
      "gridPos":{"x":n*8,"y":5,"w":8,"h":12},"targets":[],"fieldConfig":{"defaults":{},"overrides":[]},
      "options":{"renderer":"svg","editorMode":"code","getOption":"const fixture = "+json.dumps(fixture)+";\n"+chart,
      "map":"none","themeEditor":{"name":"default","config":"{}"},"editor":{"format":"auto"}}})
panels.append({"id":5,"type":"text","title":"Other candidates and Canvas limitation","gridPos":{"x":0,"y":17,"w":24,"h":8},
 "options":{"mode":"markdown","content":"| Option | Fit | Main gap |\n| --- | --- | --- |\n| [Business Charts](https://grafana.com/grafana/plugins/volkovlabs-echarts-panel/) | Custom mirrored bars and text overlay, as above | JavaScript configuration; separate panel |\n| [ACE.SVG](https://grafana.com/grafana/plugins/aceiot-svg-panel/) | Arbitrary SVG layout driven by data | Custom drawing code; separate panel |\n| [Network Weathermap NG](https://grafana.com/grafana/plugins/tamirsuliman-weathermap-panel/) | Routers, circuits, live link values and history replay | Topology view; not this compact bar widget |\n| [ESnet Network Map](https://grafana.com/grafana/plugins/esnet-networkmap-panel/) | Bidirectional traffic on logical/geographical topology | Different layout and interaction |\n\nNo exact ready-made built-in Canvas component was found. The Canvas extension route remains unverified for 13.2.2."}})
dashboard={"uid":"cisco-community-preview","title":"Cisco Traffic - Community Comparison","schemaVersion":39,"version":0,"tags":["mock","community-research"],"timezone":"utc","time":{"from":datetime.fromtimestamp(end-43200,timezone.utc).isoformat(),"to":datetime.fromtimestamp(end,timezone.utc).isoformat()},"refresh":"","panels":panels}
output=ROOT/'dev/community-preview.dashboard.json'
output.write_text(json.dumps(dashboard,indent=2)+'\n',encoding='utf-8')
print(output)
