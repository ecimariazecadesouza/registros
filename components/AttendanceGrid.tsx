import React, { useState, useRef, useEffect } from 'react';
import { Student, AttendanceStatus, ClassAttendance, StudentStats, EnrollmentStatus, PendingChange, LessonSubjectMap, LessonTopicMap, Holiday } from '../types';
import { STATUS_COLORS, ENROLLMENT_COLORS } from '../constants';
import { Check, X, Clock, ChevronDown, CheckCheck } from 'lucide-react';

interface AttendanceGridProps {
  students: Student[];
  dates: string[];
  attendance: ClassAttendance;
  dailyLessonConfig: Record<string, number[]>;
  lessonSubjects: LessonSubjectMap;
  lessonTopics: LessonTopicMap;
  pendingChanges: PendingChange[];
  holidays: Holiday[];
  registeredSubjects: string[];
  onToggleStatus: (studentId: string, date: string, lessonIndex: number) => void;
  onBulkStatusUpdate: (date: string, lessonIndex: number, status: AttendanceStatus) => void;
  onSelectStudent: (student: Student) => void;
  onUpdateLessonConfig: (date: string, activeIndices: number[], subjects: Record<number, string>, topics: Record<number, string>) => void;
  onUpdateStudentStatus: (studentId: string, newStatus: EnrollmentStatus) => void;
}

const AttendanceGrid: React.FC<AttendanceGridProps> = ({ 
  students, 
  dates, 
  attendance, 
  dailyLessonConfig,
  lessonSubjects,
  lessonTopics,
  pendingChanges,
  holidays,
  registeredSubjects,
  onToggleStatus,
  onBulkStatusUpdate,
  onSelectStudent,
  onUpdateLessonConfig,
  onUpdateStudentStatus
}) => {
  const [openConfigDate, setOpenConfigDate] = useState<string | null>(null);
  const [tempSubjects, setTempSubjects] = useState<Record<number, string>>({});
  const [tempTopics, setTempTopics] = useState<Record<number, string>>({});
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpenConfigDate(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Init temp subjects/topics when opening popover
  useEffect(() => {
      if (openConfigDate) {
          setTempSubjects(lessonSubjects[openConfigDate] || {});
          setTempTopics(lessonTopics[openConfigDate] || {});
      }
  }, [openConfigDate, lessonSubjects, lessonTopics]);

  const calculateStats = (studentId: string): StudentStats => {
    const record = attendance[studentId] || {};
    let present = 0;
    let absent = 0;
    let excused = 0;
    let lessonsCounted = 0;

    // Only calculate stats based on the currently visible month dates
    dates.forEach(date => {
        const statuses = record[date] || [];
        // Default to [0] if no config, meaning 1st lesson
        const activeIndices = dailyLessonConfig[date] || [0];
        
        activeIndices.forEach(idx => {
           const status = statuses[idx];
           if (status === AttendanceStatus.PRESENT) present++;
           else if (status === AttendanceStatus.ABSENT) absent++;
           else if (status === AttendanceStatus.EXCUSED) excused++;
           
           if (status && status !== AttendanceStatus.UNDEFINED) {
               lessonsCounted++;
           }
        });
    });

    const totalConsidered = lessonsCounted === 0 ? 1 : lessonsCounted;
    const percentage = ((present + excused) / totalConsidered) * 100;

    return { totalLessons: lessonsCounted, present, absent, excused, percentage };
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Force noon to avoid timezone shift
    const day = date.getDate().toString().padStart(2, '0');
    const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
    return { day, weekDay };
  };

  const getHoliday = (date: string) => {
      return holidays.find(h => h.date === date);
  }

  const isPending = (studentId: string, date: string, lessonIndex: number) => {
      return pendingChanges.some(p => 
          p.studentId === studentId && p.date === date && p.lessonIndex === lessonIndex
      );
  };

  const handleConfigSave = (date: string, activeIndices: number[]) => {
      onUpdateLessonConfig(date, activeIndices, tempSubjects, tempTopics);
  };

  if (students.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-white rounded-lg border border-dashed border-slate-300 m-4">
        <p>Nenhum aluno nesta turma ou filtro selecionado.</p>
        <p className="text-sm">Adicione protagonistas na aba "Protagonistas".</p>
      </div>
    );
  }

  // Dimensions for sticky columns
  const IDX_WIDTH = 50;
  const NAME_WIDTH = 250;
  const STATUS_WIDTH = 120;
  const NAME_LEFT = IDX_WIDTH;
  const STATUS_LEFT = IDX_WIDTH + NAME_WIDTH;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Hidden DataList for Subjects */}
      <datalist id="registered-subjects">
        {registeredSubjects.map(subj => (
            <option key={subj} value={subj} />
        ))}
      </datalist>

      {/* Scrollable Container */}
      <div className="overflow-auto custom-scrollbar flex-1 relative min-h-0">
        <table className="min-w-max border-collapse text-sm text-left">
          <thead className="bg-slate-800 text-white sticky top-0 z-20">
            <tr>
              <th 
                className="sticky bg-slate-800 p-3 border-b border-slate-700 text-center font-medium z-30"
                style={{ left: 0, minWidth: IDX_WIDTH }}
              >
                #
              </th>
              <th 
                className="sticky bg-slate-800 p-3 border-b border-slate-700 font-medium z-30"
                style={{ left: NAME_LEFT, minWidth: NAME_WIDTH }}
              >
                Nome do Protagonista
              </th>
               <th 
                className="sticky bg-slate-800 p-3 border-b border-slate-700 font-medium border-r border-slate-600 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)] z-30"
                style={{ left: STATUS_LEFT, minWidth: STATUS_WIDTH }}
              >
                Situação
              </th>
              {dates.map((date) => {
                const { day, weekDay } = getDayLabel(date);
                const isWeekend = weekDay === 'sáb' || weekDay === 'dom';
                const holiday = getHoliday(date);
                
                // Use stored config or default to [0] (1st lesson)
                const activeIndices = dailyLessonConfig[date] || [0];
                const isOpen = openConfigDate === date;

                const headerClass = holiday 
                    ? 'bg-amber-100 text-amber-800 border-amber-200' 
                    : isWeekend 
                        ? 'bg-slate-700 text-slate-300' 
                        : '';

                return (
                  <th key={date} className={`p-1 min-w-[60px] border-b border-slate-700 text-center relative group/th ${headerClass}`}>
                    <div className="flex flex-col items-center justify-center gap-1 py-1">
                      <div className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] uppercase opacity-70">{weekDay}</span>
                          <span className="font-bold text-lg">{day}</span>
                      </div>
                      
                      {holiday && (
                          <div className="text-[9px] font-bold uppercase truncate max-w-[50px]" title={holiday.name}>
                              {holiday.name}
                          </div>
                      )}

                      {!isWeekend && !holiday && (
                         <div className="relative">
                              <button 
                                onClick={() => setOpenConfigDate(isOpen ? null : date)}
                                className={`flex items-center justify-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors border ${isOpen ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-700 border-slate-600 hover:border-slate-500'}`}
                                title="Configurar Aulas e Disciplinas"
                              >
                                 <Clock size={10} className={isOpen ? "text-white" : "text-indigo-400"} />
                                 <span className={isOpen ? "text-white font-bold" : "font-mono font-bold text-indigo-200"}>{activeIndices.length}</span>
                              </button>

                              {/* Lesson Config Popover */}
                              {isOpen && (
                                  <div ref={popoverRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 w-80 text-slate-800 animate-in fade-in zoom-in-95 duration-100 cursor-default">
                                      <h4 className="text-xs font-bold text-slate-500 mb-3 text-left uppercase flex justify-between items-center">
                                          <span>Configuração do Dia</span>
                                          <button onClick={() => setOpenConfigDate(null)} className="text-slate-400 hover:text-rose-500"><X size={14}/></button>
                                      </h4>
                                      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                          {Array.from({length: 9}, (_, i) => i).map(idx => {
                                              const isActive = activeIndices.includes(idx);
                                              return (
                                                  <div key={idx} className={`flex flex-col gap-1 p-2 rounded border transition-colors ${isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-transparent'}`}>
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                const newIndices = isActive 
                                                                  ? activeIndices.filter(x => x !== idx)
                                                                  : [...activeIndices, idx].sort((a,b) => a - b);
                                                                handleConfigSave(date, newIndices);
                                                            }}
                                                            className={`h-6 w-6 shrink-0 rounded text-xs font-bold flex items-center justify-center transition-colors ${
                                                                isActive 
                                                                ? 'bg-indigo-600 text-white' 
                                                                : 'bg-white border border-slate-300 text-slate-400 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {idx + 1}ª
                                                        </button>
                                                        
                                                        {isActive && (
                                                            <div className="flex items-center justify-between flex-1">
                                                                <span className="text-xs font-semibold text-indigo-900">Aula Ativa</span>
                                                                
                                                                <button 
                                                                    onClick={() => onBulkStatusUpdate(date, idx, AttendanceStatus.PRESENT)}
                                                                    className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded hover:bg-emerald-200 transition-colors"
                                                                    title="Marcar 'Presente' para quem não tem status"
                                                                >
                                                                    <CheckCheck size={12}/> Todos Presentes
                                                                </button>
                                                            </div>
                                                        )}
                                                        {!isActive && <span className="text-xs text-slate-400 italic">Inativo</span>}
                                                      </div>
                                                      
                                                      {isActive && (
                                                          <div className="ml-8 space-y-1">
                                                            <input 
                                                                list="registered-subjects"
                                                                type="text"
                                                                className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                                                                placeholder="Disciplina (Selecione ou digite)"
                                                                value={tempSubjects[idx] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setTempSubjects(prev => ({...prev, [idx]: val}));
                                                                }}
                                                                onBlur={() => handleConfigSave(date, activeIndices)}
                                                            />
                                                            <input 
                                                                type="text"
                                                                className="w-full bg-white border border-indigo-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                                                                placeholder="Conteúdo (ex: Equações)"
                                                                value={tempTopics[idx] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setTempTopics(prev => ({...prev, [idx]: val}));
                                                                }}
                                                                onBlur={() => handleConfigSave(date, activeIndices)}
                                                            />
                                                          </div>
                                                      )}
                                                  </div>
                                              );
                                          })}
                                      </div>
                                      <div className="mt-3 text-[10px] text-slate-400 text-center border-t pt-2">
                                          Defina horários, disciplinas e conteúdos.
                                      </div>
                                  </div>
                              )}
                         </div>
                      )}
                    </div>
                  </th>
                );
              })}
              {/* Summary Columns Header */}
              <th className="sticky right-[120px] bg-slate-700 p-2 min-w-[60px] text-center text-xs font-semibold border-l border-slate-600 z-20">Faltas</th>
              <th className="sticky right-[60px] bg-slate-700 p-2 min-w-[60px] text-center text-xs font-semibold z-20">Pres.</th>
              <th className="sticky right-0 bg-slate-700 p-2 min-w-[60px] text-center text-xs font-semibold z-20">% Mês</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student, index) => {
              const stats = calculateStats(student.id);
              const isLowAttendance = stats.percentage < 75 && stats.totalLessons > 0;

              return (
                <tr key={student.id} className="hover:bg-blue-50 transition-colors group">
                  <td 
                    className="sticky bg-white group-hover:bg-blue-50 p-2 text-center text-gray-500 border-r border-gray-100 font-mono text-xs z-10"
                    style={{ left: 0 }}
                  >
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td 
                    className="sticky bg-white group-hover:bg-blue-50 p-2 border-r border-gray-200 z-10"
                    style={{ left: NAME_LEFT }}
                  >
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => onSelectStudent(student)}
                            className="flex-1 text-left focus:outline-none truncate"
                        >
                          <span className="font-medium text-slate-700 block truncate" title={student.name}>{student.name}</span>
                        </button>
                        
                        {isLowAttendance && (
                            <span className="flex h-2 w-2 relative flex-shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                  </td>
                  <td 
                    className="sticky bg-white group-hover:bg-blue-50 p-2 border-r border-gray-200 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] text-center"
                    style={{ left: STATUS_LEFT }}
                  >
                     {/* Replace static span with select for quick editing */}
                     <div className="relative inline-block w-full">
                         <select 
                             value={student.status}
                             onChange={(e) => onUpdateStudentStatus(student.id, e.target.value as EnrollmentStatus)}
                             className={`w-full appearance-none px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer outline-none focus:ring-1 focus:ring-offset-1 focus:ring-indigo-500 ${ENROLLMENT_COLORS[student.status] || ENROLLMENT_COLORS[EnrollmentStatus.OTHER]}`}
                         >
                             {Object.values(EnrollmentStatus).map(status => (
                                 <option key={status} value={status}>{status}</option>
                             ))}
                         </select>
                         {/* Optional: Add a tiny indicator or leave standard arrow (appearance-none hides it) */}
                     </div>
                  </td>
                  {dates.map((date) => {
                    const studentRecord = attendance[student.id] || {};
                    const statuses = studentRecord[date] || [];
                    const { weekDay } = getDayLabel(date);
                    const isWeekend = weekDay === 'sáb' || weekDay === 'dom';
                    const holiday = getHoliday(date);
                    const isLocked = student.status === EnrollmentStatus.DROPOUT || student.status === EnrollmentStatus.TRANSFERRED;
                    
                    const activeIndices = dailyLessonConfig[date] || [0];
                    const subjects = lessonSubjects[date] || {};
                    const topics = lessonTopics[date] || {};
                    
                    return (
                      <td 
                        key={`${student.id}-${date}`} 
                        className={`p-1 text-center border-r border-gray-50 ${isWeekend ? 'bg-gray-50/50' : ''} ${holiday ? 'bg-amber-50/50' : ''}`}
                      >
                         <div className="flex flex-wrap items-center justify-center gap-1">
                             {activeIndices.map((lessonIdx) => {
                                 const status = statuses[lessonIdx] || AttendanceStatus.UNDEFINED;
                                 const pending = isPending(student.id, date, lessonIdx);
                                 const subject = subjects[lessonIdx];
                                 const topic = topics[lessonIdx];

                                 return (
                                     <div key={lessonIdx} className="relative group/btn flex flex-col items-center">
                                         <button
                                            onClick={() => !isWeekend && !holiday && onToggleStatus(student.id, date, lessonIdx)}
                                            disabled={isWeekend || !!holiday || isLocked}
                                            title={`${lessonIdx + 1}ª Aula${subject ? ` - ${subject}` : ''}${topic ? `\nConteúdo: ${topic}` : ''}`}
                                            className={`
                                              w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all duration-150
                                              ${STATUS_COLORS[status]}
                                              ${isWeekend || holiday || isLocked ? 'opacity-30 cursor-not-allowed' : 'shadow-sm hover:scale-110 active:scale-95 border'}
                                              ${pending ? 'ring-2 ring-orange-400 ring-offset-1 z-10' : ''}
                                            `}
                                         >
                                            {status === AttendanceStatus.PRESENT && <Check size={10} strokeWidth={3} />}
                                            {status === AttendanceStatus.ABSENT && <X size={10} strokeWidth={3} />}
                                            {status === AttendanceStatus.EXCUSED && <Clock size={10} strokeWidth={3} />}
                                            {status === AttendanceStatus.UNDEFINED && <span className="w-1 h-1 rounded-full bg-gray-300" />}
                                         </button>
                                         <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover/btn:block bg-black text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                            <div className="font-bold">{lessonIdx + 1}ª {subject ? `(${subject})` : ''}</div>
                                            {topic && <div className="font-normal opacity-80 max-w-[150px] truncate">{topic}</div>}
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                      </td>
                    );
                  })}
                  
                  {/* Summary Columns Body */}
                  <td className="sticky right-[120px] bg-white group-hover:bg-blue-50 p-2 text-center text-sm font-medium text-rose-600 border-l border-gray-200 z-10">
                    {stats.absent}
                  </td>
                  <td className="sticky right-[60px] bg-white group-hover:bg-blue-50 p-2 text-center text-sm font-medium text-emerald-600 z-10">
                    {stats.present}
                  </td>
                  <td className={`sticky right-0 bg-white group-hover:bg-blue-50 p-2 text-center text-sm font-bold z-10 ${isLowAttendance ? 'text-rose-600' : 'text-slate-700'}`}>
                    {stats.totalLessons === 0 ? '-' : `${stats.percentage.toFixed(0)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceGrid;