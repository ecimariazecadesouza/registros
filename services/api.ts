
import { Student, ClassGroup, BimesterConfig, AttendanceStatus, ApiData, EnrollmentStatus, SystemConfig } from '../types';

const STORAGE_KEY = 'frequencia_escolar_api_url';

export const getApiUrl = () => localStorage.getItem(STORAGE_KEY);
export const setApiUrl = (url: string) => localStorage.setItem(STORAGE_KEY, url);

// --- DATE HELPERS ---

// Converte ISO (YYYY-MM-DD) para BR (DD-MM-YYYY) para salvar na planilha
const toBrDate = (isoDate: string): string => {
    if (!isoDate) return '';
    const parts = isoDate.split('-'); // Assume YYYY-MM-DD
    if (parts.length !== 3) return isoDate; 
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// Converte BR (DD-MM-YYYY ou DD/MM/YYYY) para ISO (YYYY-MM-DD) para uso no App
const toIsoDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const cleanStr = dateStr.trim().substring(0, 10);
    
    // Se já estiver em ISO YYYY-MM-DD, retorna
    if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return cleanStr;
    }

    // Se estiver em DD-MM-YYYY ou DD/MM/YYYY
    if (cleanStr.match(/^\d{2}[-/]\d{2}[-/]\d{4}$/)) {
        const parts = cleanStr.split(/[-/]/);
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return cleanStr;
};

// Helper to handle CORS/Text response from GAS
const fetchGas = async (action: string, payload: any = {}) => {
    const url = getApiUrl();
    if (!url) throw new Error("URL da API não configurada");

    const fullPayload = { action, ...payload };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8', 
        },
        body: JSON.stringify(fullPayload)
    });

    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse response", text);
        throw new Error("Resposta inválida do servidor");
    }
};

const normalizeStatus = (raw: any): EnrollmentStatus => {
    const str = String(raw || '').trim();
    if (!str) return EnrollmentStatus.ACTIVE; 

    const validValues = Object.values(EnrollmentStatus);
    if (validValues.includes(str as EnrollmentStatus)) {
        return str as EnrollmentStatus;
    }

    return EnrollmentStatus.OTHER;
};

export const api = {
    async getData(): Promise<ApiData> {
        const data = await fetchGas('getData');
        
        // Data sanitization & Auto-Healing
        if (data.students) {
            data.students = data.students.map((s: any) => {
                let safeClassId = s.classId ? String(s.classId).trim() : '';
                let safeStatus = normalizeStatus(s.status || s.situation);

                // HEALING LOGIC: Detect if columns are shifted in the spreadsheet
                const registrationVal = s.registration ? String(s.registration).trim() : '';
                
                if (registrationVal.startsWith('c-')) {
                    safeClassId = registrationVal;
                }
                
                if (Object.values(EnrollmentStatus).includes(safeClassId as any)) {
                     safeStatus = safeClassId as EnrollmentStatus;
                     if (registrationVal.startsWith('c-')) {
                         safeClassId = registrationVal;
                     } else {
                         safeClassId = ''; 
                     }
                }

                return {
                    ...s,
                    id: String(s.id),
                    name: s.name ? String(s.name).trim() : '',
                    status: safeStatus,
                    classId: safeClassId
                };
            });
        }

        if (data.classes) {
            data.classes = data.classes.map((c: any) => ({
                ...c,
                id: String(c.id), 
                name: String(c.name).trim()
            }));
        }
        
        return data;
    },

    async saveStudent(student: Student) {
        const finalStatus = student.status || EnrollmentStatus.ACTIVE;
        const finalClassId = student.classId || '';
        
        const safeStudent = {
            id: student.id,
            name: student.name,
            registration: finalClassId, 
            classId: finalClassId, 
            situation: finalStatus,
            status: finalStatus,
            createdAt: new Date().toISOString()
        };
        return fetchGas('saveStudent', { student: safeStudent });
    },

    async deleteStudent(id: string) {
        return fetchGas('deleteStudent', { id: String(id), cascade: true });
    },

    async saveClass(classGroup: ClassGroup) {
        return fetchGas('saveClass', { classGroup });
    },

    async deleteClass(id: string) {
        return fetchGas('deleteClass', { id: String(id), cascade: true });
    },

    async saveAttendance(studentId: string, date: string, lessonIndex: number, status: AttendanceStatus, subject?: string, topic?: string) {
        const spreadsheetIndex = lessonIndex + 1;
        
        // CONVERT DATE TO BR FORMAT (DD-MM-YYYY) BEFORE SENDING
        const dateBR = toBrDate(date);

        const record = {
            studentId,
            date: dateBR, 
            lessonIndex: spreadsheetIndex, 
            status,
            subject: subject || '',
            notes: topic || '' 
        };
        return fetchGas('saveAttendance', { record });
    },

    async saveBimester(bimesters: BimesterConfig[]) {
        return fetchGas('saveAll', { bimesters });
    },

    async saveConfig(key: string, value: any) {
         return fetchGas('saveConfig', { key, value: JSON.stringify(value) });
    },

    async syncAll(data: { students: Student[], classes: ClassGroup[], bimesters: BimesterConfig[] }) {
        const safeStudents = data.students.map(s => {
            const finalStatus = s.status || EnrollmentStatus.ACTIVE;
            const finalClassId = s.classId || '';
            
            return {
                id: s.id,
                name: s.name,
                registration: finalClassId, 
                classId: finalClassId,      
                situation: finalStatus,     
                status: finalStatus,        
                createdAt: new Date().toISOString()
            };
        });
        
        return fetchGas('saveAll', { 
            ...data, 
            students: safeStudents 
        });
    }
};

export const transformAttendanceFromApi = (rawRecords: any[]): Record<string, Record<string, AttendanceStatus[]>> => {
    const attendance: Record<string, Record<string, AttendanceStatus[]>> = {};

    rawRecords.forEach(rec => {
        const { studentId, date, lessonIndex, status } = rec;
        
        // NORMALIZE DATE FROM API (BR or ISO) TO APP ISO (YYYY-MM-DD)
        const dateStrRaw = typeof date === 'string' ? date : '';
        const dateStr = toIsoDate(dateStrRaw);
        
        if (!dateStr) return; // Skip invalid dates

        if (!attendance[studentId]) attendance[studentId] = {};
        if (!attendance[studentId][dateStr]) attendance[studentId][dateStr] = [];

        let rawIdx = parseInt(lessonIndex as string, 10) || 1;
        if (rawIdx > 20 || rawIdx < 1) {
            rawIdx = 1; 
        }

        const idx = Math.max(0, rawIdx - 1);

        const currentArr = attendance[studentId][dateStr];
        while (currentArr.length <= idx) {
            currentArr.push(AttendanceStatus.UNDEFINED);
        }
        currentArr[idx] = status as AttendanceStatus;
    });

    return attendance;
};

export const transformConfigFromApi = (configRows: SystemConfig[]): Record<string, any> => {
    const config: Record<string, any> = {};
    configRows.forEach(row => {
        try {
            config[row.key] = JSON.parse(row.value);
        } catch {
            config[row.key] = row.value;
        }
    });
    return config;
};
