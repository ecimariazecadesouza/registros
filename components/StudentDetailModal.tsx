import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentStats, AttendanceStatus, BimesterConfig } from '../types';
import { generateStudentReport } from '../services/geminiService';
import { X, Sparkles, Loader2, Award, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface Props {
  student: Student | null;
  studentsList: Student[];
  onSelectStudent: (s: Student) => void;
  attendanceRecord: Record<string, AttendanceStatus[]>;
  onClose: () => void;
  year: number;
  bimesters: BimesterConfig[];
}

const StudentDetailModal: React.FC<Props> = ({ student, studentsList, onSelectStudent, attendanceRecord, onClose, year, bimesters }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setAiReport(''); // Clear previous
    }
  }, [student]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!student) return;
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [student, studentsList]);

  const currentIndex = useMemo(() => {
      if (!student) return -1;
      return studentsList.findIndex(s => s.id === student.id);
  }, [student, studentsList]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < studentsList.length - 1;

  const handlePrev = () => {
      if (hasPrev) onSelectStudent(studentsList[currentIndex - 1]);
  };

  const handleNext = () => {
      if (hasNext) onSelectStudent(studentsList[currentIndex + 1]);
  };

  const bimesterStats = useMemo(() => {
    return bimesters.map(bimester => {
      let present = 0, absent = 0, excused = 0, total = 0;
      
      const start = new Date(bimester.start);
      const end = new Date(bimester.end);

      // Iterate through all dates in the record
      Object.entries(attendanceRecord || {}).forEach(([dateStr, statuses]: [string, AttendanceStatus[]]) => {
         const date = new Date(dateStr + 'T12:00:00');
         
         if (date >= start && date <= end) {
             statuses.forEach(status => {
                if (status === AttendanceStatus.PRESENT) present++;
                else if (status === AttendanceStatus.ABSENT) absent++;
                else if (status === AttendanceStatus.EXCUSED) excused++;
                
                if (status !== AttendanceStatus.UNDEFINED) total++;
             });
         }
      });

      const percentage = total > 0 ? ((present + excused) / total) * 100 : 0;
      return { ...bimester, present, absent, excused, total, percentage };
    });
  }, [attendanceRecord, bimesters]);

  if (!student) return null;

  // Calculate annual stats for the header
  const annualStats = bimesterStats.reduce((acc, curr) => ({
      present: acc.present + curr.present,
      absent: acc.absent + curr.absent,
      excused: acc.excused + curr.excused,
      total: acc.total + curr.total
  }), { present: 0, absent: 0, excused: 0, total: 0 });
  
  const annualPercentage = annualStats.total > 0 
    ? ((annualStats.present + annualStats.excused) / annualStats.total) * 100 
    : 0;

  const handleGenerateReport = async () => {
    setLoading(true);
    // Construct a stats object for the AI service
    const statsForAi: StudentStats = {
        totalLessons: annualStats.total,
        present: annualStats.present,
        absent: annualStats.absent,
        excused: annualStats.excused,
        percentage: annualPercentage
    };
    const report = await generateStudentReport(student, statsForAi);
    setAiReport(report);
    setLoading(false);
  };

  const chartData = [
    { name: 'Presença', value: annualStats.present, color: '#10b981' },
    { name: 'Falta', value: annualStats.absent, color: '#f43f5e' },
    { name: 'Justificada', value: annualStats.excused, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const isRisk = annualPercentage < 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                 <User size={32} className="text-slate-300" />
             </div>
             <div>
                 <h2 className="text-xl font-bold">{student.name}</h2>
                 <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-400 text-sm">Ano Letivo: {year}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${isRisk ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {annualPercentage.toFixed(1)}% Anual
                    </span>
                 </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-800 rounded-lg p-1 mr-4">
                 <button 
                    onClick={handlePrev} 
                    disabled={!hasPrev}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                    title="Anterior (Seta Esquerda)"
                 >
                     <ChevronLeft size={20} />
                 </button>
                 <div className="w-px h-6 bg-slate-700 mx-1"></div>
                 <button 
                    onClick={handleNext} 
                    disabled={!hasNext}
                    className="p-2 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                    title="Próximo (Seta Direita)"
                 >
                     <ChevronRight size={20} />
                 </button>
             </div>

             <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-rose-600">
                <X size={20} />
             </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Stats & Bimesters */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Bimester Table */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Award size={16} /> Desempenho por Bimestre
                        </h3>
                        <div className="overflow-hidden border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Período</th>
                                        <th className="px-4 py-3 text-center font-medium text-emerald-600">Presenças</th>
                                        <th className="px-4 py-3 text-center font-medium text-rose-600">Faltas</th>
                                        <th className="px-4 py-3 text-center font-medium text-amber-600">Justif.</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-700">% Freq</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {bimesterStats.map((b) => (
                                        <tr key={b.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{b.present}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{b.absent}</td>
                                            <td className="px-4 py-3 text-center text-gray-600">{b.excused}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                                                <span className={`${b.percentage < 75 && b.total > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {b.total === 0 ? '-' : `${b.percentage.toFixed(0)}%`}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-semibold">
                                    <tr>
                                        <td className="px-4 py-3">Total Anual</td>
                                        <td className="px-4 py-3 text-center">{annualStats.present}</td>
                                        <td className="px-4 py-3 text-center">{annualStats.absent}</td>
                                        <td className="px-4 py-3 text-center">{annualStats.excused}</td>
                                        <td className="px-4 py-3 text-right">{annualPercentage.toFixed(1)}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="h-64 w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
                         <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Visualização Anual</h3>
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip />
                              <Legend verticalAlign="middle" align="right" layout="vertical" />
                            </PieChart>
                          </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Column */}
                <div className="flex flex-col h-full bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Sparkles size={18} className="text-white" />
                        </div>
                        <h3 className="font-bold text-indigo-900">Conselheiro IA</h3>
                    </div>
                    
                    <div className="flex-1 text-sm text-slate-600 leading-relaxed overflow-y-auto max-h-[300px] mb-4">
                        {loading ? (
                             <div className="flex items-center justify-center h-full text-indigo-400 gap-2">
                                 <Loader2 className="animate-spin" size={20} />
                                 <span>Analisando perfil...</span>
                             </div>
                        ) : aiReport ? (
                            <p className="whitespace-pre-wrap">{aiReport}</p>
                        ) : (
                            <div className="space-y-2">
                                <p>Clique abaixo para gerar uma análise pedagógica baseada nos dados anuais e bimestrais.</p>
                                <p className="text-xs text-slate-500">A IA analisará tendências de faltas e justificativas para sugerir intervenções.</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 mt-auto"
                    >
                        {loading ? 'Gerando...' : 'Gerar Relatório'}
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;