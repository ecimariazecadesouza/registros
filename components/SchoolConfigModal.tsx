import React, { useState } from 'react';
import { X, Calendar, BookOpen, Plus, Trash2, Save, Pencil } from 'lucide-react';
import { Holiday } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subjects: string[];
  holidays: Holiday[];
  onSaveSubjects: (subjects: string[]) => void;
  onSaveHolidays: (holidays: Holiday[]) => void;
}

const SchoolConfigModal: React.FC<Props> = ({ isOpen, onClose, subjects, holidays, onSaveSubjects, onSaveHolidays }) => {
  const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'HOLIDAYS'>('SUBJECTS');
  
  // Local State for Subjects
  const [localSubjects, setLocalSubjects] = useState<string[]>([...subjects]);
  const [newSubject, setNewSubject] = useState('');

  // Local State for Holidays
  const [localHolidays, setLocalHolidays] = useState<Holiday[]>([...holidays]);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [editingHolidayOriginalDate, setEditingHolidayOriginalDate] = useState<string | null>(null);

  if (!isOpen) return null;

  // --- Handlers ---

  const handleAddSubject = () => {
      if (newSubject.trim() && !localSubjects.includes(newSubject.trim())) {
          const updated = [...localSubjects, newSubject.trim()].sort();
          setLocalSubjects(updated);
          onSaveSubjects(updated);
          setNewSubject('');
      }
  };

  const handleRemoveSubject = (subj: string) => {
      const updated = localSubjects.filter(s => s !== subj);
      setLocalSubjects(updated);
      onSaveSubjects(updated);
  };

  const handleSaveHoliday = () => {
      if (holidayDate && holidayName.trim()) {
          let updatedHolidays = [...localHolidays];

          // If editing, remove the old entry first (in case date changed)
          if (editingHolidayOriginalDate) {
              updatedHolidays = updatedHolidays.filter(h => h.date !== editingHolidayOriginalDate);
          } else {
              // If adding new, check if date already exists to prevent duplicates
              updatedHolidays = updatedHolidays.filter(h => h.date !== holidayDate);
          }

          // Add new/updated entry
          updatedHolidays.push({ date: holidayDate, name: holidayName.trim() });
          
          // Sort by date
          updatedHolidays.sort((a,b) => a.date.localeCompare(b.date));

          setLocalHolidays(updatedHolidays);
          onSaveHolidays(updatedHolidays);
          
          // Reset form
          setHolidayDate('');
          setHolidayName('');
          setEditingHolidayOriginalDate(null);
      }
  };

  const handleEditHoliday = (holiday: Holiday) => {
      setHolidayDate(holiday.date);
      setHolidayName(holiday.name);
      setEditingHolidayOriginalDate(holiday.date);
  };

  const handleCancelEdit = () => {
      setHolidayDate('');
      setHolidayName('');
      setEditingHolidayOriginalDate(null);
  };

  const handleRemoveHoliday = (date: string) => {
      if (window.confirm("Remover este feriado?")) {
        const updated = localHolidays.filter(h => h.date !== date);
        setLocalHolidays(updated);
        onSaveHolidays(updated);
        if (editingHolidayOriginalDate === date) {
            handleCancelEdit();
        }
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <h3 className="font-bold flex items-center gap-2"><BookOpen size={18}/> Configurações Escolares</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
            <button 
                onClick={() => setActiveTab('SUBJECTS')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'SUBJECTS' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:bg-gray-100'}`}
            >
                <BookOpen size={16} /> Disciplinas
            </button>
            <button 
                onClick={() => setActiveTab('HOLIDAYS')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'HOLIDAYS' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:bg-gray-100'}`}
            >
                <Calendar size={16} /> Feriados & Recessos
            </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            
            {/* SUBJECTS TAB */}
            {activeTab === 'SUBJECTS' && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm text-indigo-800">
                        Cadastre as disciplinas da escola. Elas aparecerão como sugestão na hora de registrar a aula.
                    </div>

                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="Nova Disciplina (ex: Biologia)"
                            value={newSubject}
                            onChange={e => setNewSubject(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddSubject()}
                        />
                        <button 
                            onClick={handleAddSubject}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                        >
                            <Plus size={16} /> Adicionar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {localSubjects.map(subj => (
                            <div key={subj} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg shadow-sm group">
                                <span className="text-slate-700 font-medium">{subj}</span>
                                <button 
                                    onClick={() => handleRemoveSubject(subj)}
                                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {localSubjects.length === 0 && (
                            <p className="text-slate-400 text-sm col-span-2 text-center py-4">Nenhuma disciplina cadastrada.</p>
                        )}
                    </div>
                </div>
            )}

            {/* HOLIDAYS TAB */}
            {activeTab === 'HOLIDAYS' && (
                <div className="space-y-6">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-sm text-amber-800">
                        Dias cadastrados aqui aparecerão bloqueados na planilha de frequência.
                    </div>

                    <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">
                            {editingHolidayOriginalDate ? 'Editar Feriado' : 'Novo Feriado'}
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="date" 
                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-indigo-500"
                                value={holidayDate}
                                onChange={e => setHolidayDate(e.target.value)}
                            />
                            <input 
                                type="text" 
                                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                                placeholder="Nome do Feriado (ex: Carnaval)"
                                value={holidayName}
                                onChange={e => setHolidayName(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleSaveHoliday}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-white transition-colors ${editingHolidayOriginalDate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {editingHolidayOriginalDate ? <Save size={16}/> : <Plus size={16}/>}
                                    {editingHolidayOriginalDate ? 'Salvar' : 'Adicionar'}
                                </button>
                                {editingHolidayOriginalDate && (
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="px-3 py-2 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-lg text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {localHolidays.map(holiday => (
                            <div key={holiday.date} className={`flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm group transition-colors ${editingHolidayOriginalDate === holiday.date ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-rose-100 text-rose-600 px-2 py-1 rounded text-xs font-bold font-mono">
                                        {new Date(holiday.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                    <span className="text-slate-700 font-medium">{holiday.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleEditHoliday(holiday)}
                                        className="text-slate-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                                        title="Editar"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveHoliday(holiday.date)}
                                        className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-rose-50 rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                         {localHolidays.length === 0 && (
                            <p className="text-slate-400 text-sm text-center py-4">Nenhum feriado cadastrado.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
             <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 text-sm font-medium">
                 Concluir
             </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolConfigModal;