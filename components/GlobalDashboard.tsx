import React, { useMemo, useState } from 'react';
import { Student, ClassGroup, ClassAttendance, BimesterConfig, AttendanceStatus, EnrollmentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, Users, Calendar, Filter, UserCheck, UserMinus, ArrowRightLeft, HelpCircle } from 'lucide-react';
import { ENROLLMENT_COLORS } from '../constants';

interface Props {
  students: Student[];
  classes: ClassGroup[];
  attendance: ClassAttendance;
  bimesters: BimesterConfig[];
  year: number;
}

const GlobalDashboard: React.FC<Props> = ({ students, classes, attendance, bimesters, year }) => {
  const [classFilter, setClassFilter] = useState('ALL');

  const filteredStudents = useMemo(() => {
      return classFilter === 'ALL' 
        ? students 
        : students.filter(s => s.classId === classFilter);
  }, [students, classFilter]);

  const stats = useMemo(() => {
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalExcused = 0;
    let totalRecordedLessons = 0;

    // Status Counts
    const statusCounts = {
        [EnrollmentStatus.ACTIVE]: 0,
        [EnrollmentStatus.DROPOUT]: 0,
        [EnrollmentStatus.TRANSFERRED]: 0,
        [EnrollmentStatus.OTHER]: 0
    };

    filteredStudents.forEach(s => {
        // Robust check: Check if s.status is exactly one of the known Enum Values.
        // If s.status is "Cursando", it matches EnrollmentStatus.ACTIVE.
        // If it doesn't match any key, go to OTHER.
        const isValidStatus = Object.values(EnrollmentStatus).includes(s.status as EnrollmentStatus);
        
        if (isValidStatus) {
            statusCounts[s.status as EnrollmentStatus]++;
        } else {
            statusCounts[EnrollmentStatus.OTHER]++;
        }
    });

    // Bimester Stats
    const bimesterData = bimesters.map(bim => {
        let bimPresent = 0;
        let bimAbsent = 0;
        let bimTotal = 0;
        const start = new Date(bim.start);
        const end = new Date(bim.end);

        filteredStudents.forEach(student => {
            const record = attendance[student.id] || {};
            Object.entries(record).forEach(([dateStr, statuses]: [string, AttendanceStatus[]]) => {
                const date = new Date(dateStr + 'T12:00:00');
                if (date >= start && date <= end) {
                    statuses.forEach(status => {
                        if (status === AttendanceStatus.PRESENT) bimPresent++;
                        if (status === AttendanceStatus.ABSENT) bimAbsent++;
                        if (status !== AttendanceStatus.UNDEFINED) bimTotal++;
                    });
                }
            });
        });

        // Add to global totals
        totalPresent += bimPresent;
        totalAbsent += bimAbsent;
        totalRecordedLessons += bimTotal;

        return {
            name: bim.name,
            Presenças: bimPresent,
            Faltas: bimAbsent,
            Taxa: bimTotal > 0 ? ((bimPresent / bimTotal) * 100).toFixed(1) : 0
        };
    });

    // Students at risk (Attendance < 75%)
    const studentsAtRisk = filteredStudents.map(student => {
        const record = attendance[student.id] || {};
        let sPresent = 0;
        let sExcused = 0;
        let sTotal = 0;
        let sAbsent = 0;

        Object.values(record).forEach((statuses: AttendanceStatus[]) => {
             statuses.forEach(status => {
                if (status === AttendanceStatus.PRESENT) sPresent++;
                if (status === AttendanceStatus.EXCUSED) sExcused++;
                if (status === AttendanceStatus.ABSENT) sAbsent++;
                if (status !== AttendanceStatus.UNDEFINED) sTotal++;
             });
        });

        const percentage = sTotal > 0 ? ((sPresent + sExcused) / sTotal) * 100 : 100;

        return {
            ...student,
            stats: { percentage, absent: sAbsent, total: sTotal }
        };
    }).filter(s => s.stats.percentage < 75 && s.stats.total > 0 && s.status === EnrollmentStatus.ACTIVE)
      .sort((a, b) => a.stats.percentage - b.stats.percentage);

    // Class Frequency Chart Data
    // Filter classes to show in chart: if filter is ALL, show all classes. If specific, show only that one.
    const relevantClasses = classFilter === 'ALL' 
        ? classes 
        : classes.filter(c => c.id === classFilter);

    const classChartData = relevantClasses.map(cls => {
        const clsStudents = students.filter(s => s.classId === cls.id); 
        let cPresent = 0;
        let cTotal = 0;
        
        clsStudents.forEach(s => {
            const record = attendance[s.id] || {};
             Object.values(record).forEach((statuses: AttendanceStatus[]) => {
                 statuses.forEach(status => {
                    if (status === AttendanceStatus.PRESENT || status === AttendanceStatus.EXCUSED) cPresent++;
                    if (status !== AttendanceStatus.UNDEFINED) cTotal++;
                 });
             });
        });

        return {
            name: cls.name,
            percentage: cTotal > 0 ? (cPresent / cTotal) * 100 : 0
        };
    });


    return { bimesterData, studentsAtRisk, totalPresent, totalAbsent, totalRecordedLessons, statusCounts, classChartData };
  }, [students, attendance, bimesters, filteredStudents, classes, classFilter]);

  const globalRate = stats.totalRecordedLessons > 0 
    ? ((stats.totalPresent) / stats.totalRecordedLessons * 100).toFixed(1) 
    : "0.0";

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Dashboard Header & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
             <div>
                 <h2 className="text-xl font-bold text-slate-800">Painel de Indicadores</h2>
                 <p className="text-sm text-slate-500">Visão geral e estatísticas de frequência escolar</p>
             </div>
             <div className="flex items-center gap-2">
                 <Filter size={18} className="text-slate-400" />
                 <select 
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                 >
                     <option value="ALL">Todas as Turmas</option>
                     {classes.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                 </select>
             </div>
          </div>

          {/* Enrollment Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl shadow-sm border ${ENROLLMENT_COLORS[EnrollmentStatus.ACTIVE]}`}>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold opacity-80">{EnrollmentStatus.ACTIVE}</span>
                      <UserCheck size={20} className="opacity-60" />
                  </div>
                  <div className="text-2xl font-extrabold">{stats.statusCounts[EnrollmentStatus.ACTIVE]}</div>
              </div>
              <div className={`p-4 rounded-xl shadow-sm border ${ENROLLMENT_COLORS[EnrollmentStatus.DROPOUT]}`}>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold opacity-80">{EnrollmentStatus.DROPOUT}</span>
                      <UserMinus size={20} className="opacity-60" />
                  </div>
                  <div className="text-2xl font-extrabold">{stats.statusCounts[EnrollmentStatus.DROPOUT]}</div>
              </div>
              <div className={`p-4 rounded-xl shadow-sm border ${ENROLLMENT_COLORS[EnrollmentStatus.TRANSFERRED]}`}>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold opacity-80">{EnrollmentStatus.TRANSFERRED}</span>
                      <ArrowRightLeft size={20} className="opacity-60" />
                  </div>
                  <div className="text-2xl font-extrabold">{stats.statusCounts[EnrollmentStatus.TRANSFERRED]}</div>
              </div>
              <div className={`p-4 rounded-xl shadow-sm border ${ENROLLMENT_COLORS[EnrollmentStatus.OTHER]}`}>
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold opacity-80">{EnrollmentStatus.OTHER}</span>
                      <HelpCircle size={20} className="opacity-60" />
                  </div>
                  <div className="text-2xl font-extrabold">{stats.statusCounts[EnrollmentStatus.OTHER]}</div>
              </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Users size={20}/></div>
                      <span className="text-slate-500 text-sm font-medium">Total Listado</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{filteredStudents.length}</div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><TrendingUp size={20}/></div>
                      <span className="text-slate-500 text-sm font-medium">Frequência Geral</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{globalRate}%</div>
              </div>

               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertTriangle size={20}/></div>
                      <span className="text-slate-500 text-sm font-medium">Alunos em Risco</span>
                  </div>
                  <div className="text-2xl font-bold text-rose-600">{stats.studentsAtRisk.length}</div>
                  <div className="text-xs text-slate-400">Freq. abaixo de 75%</div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Calendar size={20}/></div>
                      <span className="text-slate-500 text-sm font-medium">Faltas Registradas</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{stats.totalAbsent}</div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart: Bimester Evolution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Frequência por Bimestre (Total)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.bimesterData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f1f5f9' }}
                          />
                          <Legend />
                          <Bar dataKey="Presenças" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Faltas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>

              {/* Chart: Frequency By Class */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 min-h-[400px]">
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Frequência Média por Turma</h3>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.classChartData} layout="vertical" margin={{ left: 40, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Frequência']}
                          />
                          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={30}>
                             {stats.classChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? '#10b981' : '#f43f5e'} />
                             ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Risk List (Full Width) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={20}/>
                  Atenção Prioritária (Alunos em Risco)
              </h3>
              <div className="overflow-x-auto">
                  {stats.studentsAtRisk.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg">
                          Nenhum aluno em situação de risco crítico nos filtros selecionados.
                      </div>
                  ) : (
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500">
                              <tr>
                                  <th className="p-3 rounded-tl-lg">Aluno</th>
                                  <th className="p-3">Turma</th>
                                  <th className="p-3 text-right">Faltas</th>
                                  <th className="p-3 text-right rounded-tr-lg">% Freq</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {stats.studentsAtRisk.map(student => {
                                  const studentClass = classes.find(c => c.id === student.classId)?.name || 'Sem Turma';
                                  return (
                                      <tr key={student.id} className="hover:bg-rose-50/50 transition-colors">
                                          <td className="p-3 font-medium text-slate-700">{student.name}</td>
                                          <td className="p-3 text-slate-500 text-xs">{studentClass}</td>
                                          <td className="p-3 text-right text-rose-600 font-medium">{student.stats.absent}</td>
                                          <td className="p-3 text-right font-bold text-rose-600">
                                              {student.stats.percentage.toFixed(0)}%
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>

      </div>
    </div>
  );
};

export default GlobalDashboard;