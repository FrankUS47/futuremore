import sys,re,os
d=os.path.dirname(os.path.abspath(__file__))+'/src/'
order=['astro.js','data.js','calendar.js','bazi.js','ziwei.js','bone_data.js','analysis.js','places.js','summary.js','flow.js','ui.js']
js='\n'.join(re.sub(r"if \(typeof module[^\n]*\n","",open(d+f,encoding='utf8').read()) for f in order)
html=open(d+'shell.html',encoding='utf8').read().replace('/*STYLE*/',open(d+'style.css',encoding='utf8').read()).replace('/*SCRIPTS*/',js)
out=sys.argv[1] if len(sys.argv)>1 else 'build/Z8.html'
open(out,'w',encoding='utf8').write(html); print(out,len(html))
