import React, { useState } from 'react';
import { Student, ClassGroup, EnrollmentStatus } from '../types';
import { ENROLLMENT_COLORS } from '../constants';
import { Plus, Pencil, Trash2, Search, X, UserPlus, Users, Filter, AlertTriangle, ChevronDown, ListFilter } from 'lucide-react';

interface Props {
  students: Student[];
  classes: ClassGroup[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onBatchAdd: (names: string[], classId: string, status: EnrollmentStatus) => void;
}

const StudentManager: React.FC<Props> = ({ 
  students, 
  classes, 
  onAddStudent, 
  onUpdateStudent, 
  onDeleteStudent,
  onBatchAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  
  // Delete Modal State
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Single Student Form State
  const [formData, setFormData] = useState<{name: string, classId: string, status: EnrollmentStatus}>({
      name: '',
      classId: classes[0]?.id || '',
      status: EnrollmentStatus.ACTIVE
  });

  // Batch Form State
  const [batchData, setBatchData] = useState<{names: string, classId: string, status: EnrollmentStatus}>({
      names: '',
      classId: classes[0]?.id || '',
      status: EnrollmentStatus.ACTIVE
  });

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.classId === classFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleOpenEdit = (student: Student) => {
      setEditingStudent(student);
      setFormData({
          name: student.name,
          classId: student.classId || '',
          status: student.status
      });
      setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
      setEditingStudent(null);
      setFormData({
          name: '',
          classId: classes[0]?.id || '',
          status: EnrollmentStatus.ACTIVE
      });
      setIsModalOpen(true);
  };

  const handleSubmit = () => {
      if (!formData.name.trim()) return;

      if (editingStudent) {
          onUpdateStudent({
              ...editingStudent,
              name: formData.name,
              classId: formData.classId,
              status: formData.status
          });
      } else {
          onAddStudent({
              id: `s-${Date.now()}`,
              name: formData.name,
              classId: formData.classId,
              status: formData.status
          });
      }
      setIsModalOpen(false);
  };

  const handleBatchSubmit = () => {
      const names = batchData.names.split('\n').map(n => n.trim()).filter(n => n.length > 0);
      if (names.length === 0) return;
      
      onBatchAdd(names, batchData.classId, batchData.status);
      setBatchData({...batchData, names: ''});
      setIsBatchModalOpen(false);
  };

  const handleConfirmDelete = () => {
      if (studentToDelete) {
          onDeleteStudent(studentToDelete.id);
          setStudentToDelete(null);
      }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 h-full overflow-hidden">
      
      {/* Header / Actions */}
      <div className="p-6 border-b border-gray-200 bg-white flex flex-col gap-5">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={20} />
                  <input 
                      type="text" 
                      placeholder="Buscar por nome do protagonista..." 
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all bg-slate-50 focus:bg-white"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="flex gap-3">
                   <button 
                      onClick={() => setIsBatchModalOpen(true)}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold shadow-sm"
                   >
                      <Users size={18} /> <span className="hidden sm:inline">Adicionar</span> em Lote
                   </button>
                   <button 
                      onClick={handleOpenAdd}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transform duration-150"
                   >
                      <UserPlus size={18} /> Novo Protagonista
                   </button>
              </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-1">
              <div className="flex items-center gap-2 mr-2">
                 <ListFilter size={18} className="text-slate-400" />
                 <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtros:</span>
              </div>
              
              <div className="relative group">
                  <select 
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="appearance-none pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer min-w-[180px] shadow-sm"
                  >
                      <option value="ALL">Todas as Turmas</option>
                      {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 pointer-events-none transition-colors"/>
              </div>
              
              <div className="relative group">
                  <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="appearance-none pl-3 pr-9 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer min-w-[180px] shadow-sm"
                  >
                      <option value="ALL">Todas as Situações</option>
                      {Object.values(EnrollmentStatus).map(s => (
                          <option key={s} value={s}>{s}</option>
                      ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 pointer-events-none transition-colors"/>
              </div>

              <div className="ml-auto flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                  <span>{filteredStudents.length}</span>
                  <span>resultados</span>
              </div>
          </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50/80 backdrop-blur">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Protagonista</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Turma</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Situação</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                  <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                          <Search size={32} className="opacity-20 mb-2"/>
                          <p>Nenhum protagonista encontrado com os filtros atuais.</p>
                      </td>
                  </tr>
              ) : (
                  filteredStudents.map(student => {
                    const studentClass = classes.find(c => c.id === student.classId);
                    return (
                        <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border border-slate-200">
                                    {student.name.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-700">{student.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {studentClass ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    {studentClass.name}
                                </span>
                            ) : (
                                <span className="text-slate-400 italic text-xs">Sem turma</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full border ${ENROLLMENT_COLORS[student.status]}`}>
                                {student.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(student); }}
                                    className="text-indigo-600 hover:text-white p-2 hover:bg-indigo-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-indigo-600 bg-indigo-50 hover:shadow-md"
                                    title="Editar"
                                >
                                    <Pencil size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setStudentToDelete(student);
                                    }}
                                    className="text-rose-600 hover:text-white p-2 hover:bg-rose-600 rounded-lg transition-all shadow-sm border border-transparent hover:border-rose-600 bg-rose-50 hover:shadow-md"
                                    title="Remover"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </td>
                        </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-bold">{editingStudent ? 'Editar Protagonista' : 'Novo Protagonista'}</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                          <input 
                              type="text" 
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Turma</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={formData.classId}
                              onChange={e => setFormData({...formData, classId: e.target.value})}
                          >
                              <option value="">Selecione uma turma...</option>
                              {classes.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Situação</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={formData.status}
                              onChange={e => setFormData({...formData, status: e.target.value as EnrollmentStatus})}
                          >
                              {Object.values(EnrollmentStatus).map(s => (
                                  <option key={s} value={s}>{s}</option>
                              ))}
                          </select>
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                          <button 
                            onClick={handleSubmit} 
                            disabled={!formData.name.trim() || !formData.classId}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-slate-300"
                          >
                              Salvar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Batch Add Modal */}
      {isBatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center rounded-t-xl">
                      <h3 className="font-bold flex items-center gap-2"><Users size={18}/> Adicionar em Lote</h3>
                      <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Turma Destino</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={batchData.classId}
                              onChange={e => setBatchData({...batchData, classId: e.target.value})}
                          >
                              <option value="">Selecione uma turma...</option>
                              {classes.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Situação Inicial</label>
                          <select 
                              className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={batchData.status}
                              onChange={e => setBatchData({...batchData, status: e.target.value as EnrollmentStatus})}
                          >
                              {Object.values(EnrollmentStatus).map(s => (
                                  <option key={s} value={s}>{s}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Lista de Nomes (um por linha)</label>
                          <textarea 
                              className="w-full h-32 p-3 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono resize-none"
                              placeholder="João da Silva&#10;Maria Oliveira"
                              value={batchData.names}
                              onChange={e => setBatchData({...batchData, names: e.target.value})}
                          />
                          <p className="text-xs text-right text-slate-500 mt-1">
                              {batchData.names.split('\n').filter(n => n.trim().length > 0).length} nomes detectados
                          </p>
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                          <button onClick={() => setIsBatchModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancelar</button>
                          <button 
                            onClick={handleBatchSubmit} 
                            disabled={!batchData.names.trim() || !batchData.classId}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-slate-300"
                          >
                              Adicionar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200 overflow-hidden">
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trash2 size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Protagonista?</h3>
                      <p className="text-sm text-slate-600 mb-6">
                          Você está prestes a remover <strong>{studentToDelete.name}</strong>. Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setStudentToDelete(null)}
                              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={handleConfirmDelete}
                              className="flex-1 py-2.5 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
                          >
                              Excluir
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default StudentManager;