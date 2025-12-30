
import React, { useState } from 'react';
import { Settings as SettingsType } from '../types';
import { Save, Info, Key, FolderOpen, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, Copy, ListChecks, ShieldAlert } from 'lucide-react';

interface SettingsModuleProps {
  settings: SettingsType;
  onSave: (settings: SettingsType) => void;
  onKeyChange: () => void;
}

const SettingsModule: React.FC<SettingsModuleProps> = ({ settings, onSave, onKeyChange }) => {
  const [formData, setFormData] = useState<SettingsType>({ ...settings });
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    alert('Configuración guardada localmente.');
  };

  const copyOrigin = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <section className="glass p-8 rounded-2xl border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
          Configuración del Sistema
        </h2>
        
        {/* API KEY SECTION */}
        <div className="mb-8 p-6 bg-[#f84827]/5 border border-[#f84827]/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-white">
              <Key className="w-4 h-4 text-[#f84827]" />
              Motor de IA (Gemini 3 Pro)
            </h3>
            <span className="text-[10px] bg-[#f84827]/20 text-[#f84827] px-2 py-1 rounded-full font-black">ACTIVO</span>
          </div>
          <p className="text-sm text-slate-400">
            IA configurada para procesar facturas logísticas. Requiere una clave con facturación habilitada en Google AI Studio.
          </p>
          <button
            onClick={onKeyChange}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-all text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar Clave Gemini
          </button>
        </div>

        {/* PRODUCTION MODE GUIDE */}
        <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
          <h3 className="font-bold flex items-center gap-2 text-amber-400 mb-4">
            <ShieldAlert className="w-5 h-5" />
            Estado: En Producción (Sin Verificar)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Al estar en modo "Producción", cualquier usuario puede intentar entrar, pero verás un aviso de seguridad de Google.
          </p>
          <ul className="space-y-3 text-xs">
            <li className="flex gap-3">
              <div className="mt-0.5"><CheckCircle className="w-3 h-3 text-green-500" /></div>
              <div className="text-slate-300">
                <strong>Saltar Aviso:</strong> Cuando te loguees, haz clic en <strong>"Configuración avanzada"</strong> y luego en <strong>"Ir a Brady Audit (no seguro)"</strong>.
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-0.5"><AlertTriangle className="w-3 h-3 text-amber-500" /></div>
              <div className="text-slate-300">
                <strong>Verificar Scopes:</strong> Ve al menú <strong>"Acceso a los datos"</strong> en Google Cloud y confirma que el permiso <code>auth/drive.file</code> esté agregado.
              </div>
            </li>
          </ul>
          
          <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/10">
            <p className="text-[10px] text-slate-400 mb-2 uppercase font-black tracking-widest">Asegúrate que este URI esté en "Clientes":</p>
            <div className="flex items-center justify-between gap-4">
              <code className="text-[#f84827] font-mono truncate bg-white/5 p-2 rounded flex-1">{window.location.origin}</code>
              <button 
                onClick={copyOrigin}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all"
              >
                {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <Key className="w-4 h-4 text-[#f84827]" />
              Google Drive Client ID
            </label>
            <input
              type="text"
              value={formData.driveClientId}
              onChange={e => setFormData({ ...formData, driveClientId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white font-mono text-sm"
              placeholder="Pega el ID de tu captura (termina en .apps.googleusercontent.com)"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest">
              <FolderOpen className="w-4 h-4 text-[#f84827]" />
              ID Carpeta Destino
            </label>
            <input
              type="text"
              value={formData.driveFolderId}
              onChange={e => setFormData({ ...formData, driveFolderId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-[#f84827] outline-none transition-colors text-white font-mono text-sm"
              placeholder="ID de la carpeta en Google Drive"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#f84827] text-white py-4 rounded-xl font-bold hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#f84827]/20 mt-4"
          >
            <Save className="w-4 h-4" />
            Guardar y Probar App
          </button>
        </form>
      </section>

      <footer className="text-center p-4">
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-slate-600 hover:text-[#f84827] flex items-center justify-center gap-1 transition-colors"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          Documentación oficial de facturación Gemini API
        </a>
      </footer>
    </div>
  );
};

export default SettingsModule;
