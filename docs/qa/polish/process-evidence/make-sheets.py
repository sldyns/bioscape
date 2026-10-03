from PIL import Image,ImageDraw
from pathlib import Path
import json
p=Path(__file__).parent
for rec in json.loads((p/'capture-index.json').read_text()):
 id=rec['id'];files=sorted(p.glob(id+'-[0-9]*.jpg'))
 if not files: continue
 out=Image.new('RGB',(1500,360*((len(files)+1)//2)),'white');d=ImageDraw.Draw(out)
 for i,f in enumerate(files):
  im=Image.open(f).crop((216,158,975,570)).resize((750,326));x=(i%2)*750;y=(i//2)*360
  out.paste(im,(x,y+24));d.text((x+8,y+5),f.stem,fill='black')
 out.save(p/(id+'-sheet.jpg'))
