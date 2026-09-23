"""Local-only responsive test with synthetic data; never connects to Supabase."""
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import re

ROOT = Path(__file__).parent / 'directorio_fonafe'
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] in ('/test', '/company-test'):
            html = (ROOT / 'index.html').read_text(encoding='utf-8')
            html = re.sub(r'<script src="https:[^"]+"></script>', '', html)
            js = (ROOT / 'app.js').read_text(encoding='utf-8')
            js = re.sub(r'\(async function init\(\) \{.*?\}\)\(\);', '', js, flags=re.S)
            fixture = '''
adminRows = Array.from({length:61}, (_, i) => ({id:`GF-${i}`, empresa_id:i%3+1,
empresa:['Empresa de Energía del Perú','Empresa de Servicios Regionales','Empresa de Infraestructura'][i%3],
tipo:i%2?'GERENTE_FUNCIONAL':'ALTA_DIRECCION', tipoLabel:i%2?'Gerente funcional':'Gerente General',
nombre:`María Fernández del Castillo ${i+1}`, cargo:'Gerente de Planeamiento y Desarrollo Institucional',
correo:'maria.fernandez.del.castillo@empresa-ejemplo.com.pe', celular:'999 123 456',
aspectos:i%2?'A1 - Planeamiento estratégico, A2 - Gestión de personas, A3 - Desarrollo institucional':'', activo:i%5!==0}));
adminCompanyFilter.innerHTML += '<option value="1">Empresa de Energía del Perú</option>';
document.getElementById('metricCompanies').textContent='3';
document.getElementById('metricHigh').textContent='24';
document.getElementById('metricManagers').textContent='24';
renderAdminTable();showAdminView();
'''
            if self.path.split('?')[0] == '/company-test':
                fixture += """
currentCompany={id:1,nombre:'Empresa de Energía del Perú'};
sessionCompanyName.textContent=currentCompany.nombre;
sessionReviewerName.textContent='Revisión a cargo de María Fernández';
aspects=[{id:1,codigo:'A1',nombre:'Planeamiento estratégico',orden:1},{id:2,codigo:'A2',nombre:'Gestión de personas y desarrollo institucional',orden:2}];
highManagement={president:{nombre:'Ana María Fernández del Castillo',celular:'999 123 456',correo:'ana.fernandez@empresa-ejemplo.com.pe'},generalManager:{nombre:'Carlos Rodríguez Mendoza',celular:'999 456 789',correo:'carlos.rodriguez@empresa-ejemplo.com.pe'},directors:[{id:3,nombre:'José García Pérez',cargo_original:'Director',correo:'jose.garcia@empresa-ejemplo.com.pe',celular:'999 222 333'}]};
managers=Array.from({length:4},(_,i)=>({id:i+1,nombre:['María Fernández del Castillo','Luis Alberto García Pérez','Ana Lucía Mendoza','Jorge Ramírez'][i],cargo:'Gerente de Planeamiento y Desarrollo Institucional',correo:'gerencia.planeamiento@empresa-ejemplo.com.pe',celular:'999 123 456',aspectIds:[1,2]}));
fillHighManagement();renderManagers();applyCompanyRules(currentCompany);showCompanyView();
"""
            html = html.replace('<script src="app.js"></script>', '<script>'+js+'\n'+fixture+'</script>')
            data=html.encode('utf-8')
            self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data)
        else:
            self.directory = str(ROOT)
            super().do_GET()

HTTPServer(('127.0.0.1', 8766), Handler).serve_forever()

