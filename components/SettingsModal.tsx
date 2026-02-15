import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, AlertTriangle, Database } from 'lucide-react';
import { getApiUrl, setApiUrl } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiUrl() || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!url.includes('script.google.com')) {
      setError('A URL deve ser de um Web App do Google Apps Script.');
      return;
    }
    setApiUrl(url);
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Database size={18}/> Conexão com Google Sheets</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 mb-6">
             <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
             <p className="text-sm text-amber-800">
                Para que o sistema funcione e salve os dados, você precisa conectar sua Planilha Google via Apps Script.
             </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">URL do Web App (Google Apps Script)</label>
              <div className="relative">
                 <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    type="text" 
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="https://script.google.com/macros/s/..."
                    value={url}
                    onChange={e => { setUrl(e.target.value); setError(''); }}
                 />
              </div>
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            <div className="text-xs text-slate-500 space-y-2 bg-slate-50 p-3 rounded border border-slate-100">
                <p><strong>Como obter a URL:</strong></p>
                <ol className="list-decimal pl-4 space-y-1">
                    <li>Abra sua planilha Google.</li>
                    <li>Vá em <strong>Extensões</strong> {'>'} <strong>Apps Script</strong>.</li>
                    <li>Cole o código do script (fornecido na documentação).</li>
                    <li>Clique em <strong>Implantar</strong> {'>'} <strong>Nova implantação</strong>.</li>
                    <li>Selecione tipo "App da Web".</li>
                    <li>Em "Quem pode acessar", escolha <strong>"Qualquer pessoa"</strong>.</li>
                    <li>Copie a URL gerada e cole acima.</li>
                </ol>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded text-sm">Cancelar</button>
            <button 
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
            >
                <Save size={16} /> Salvar Conexão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
