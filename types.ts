
export enum EnrollmentStatus {
  ACTIVE = 'Cursando',
  DROPOUT = 'Evasão',
  TRANSFERRED = 'Transferência',
  OTHER = 'Outro'
}

export interface Student {
  id: string;
  name: string;
  status: EnrollmentStatus;
  classId?: string; // Link to ClassGroup ID
}

export interface ClassGroup {
  id: string;
  name: string;
}

export enum AttendanceStatus {
  PRESENT = 'P',
  ABSENT = 'F',
  EXCUSED = 'J', // Justificada
  UNDEFINED = '-',
}

// Map Date String (YYYY-MM-DD) -> Array of Statuses (for multiple lessons per day)
export interface AttendanceRecord {
  [date: string]: AttendanceStatus[];
}

// Map Student ID -> AttendanceRecord
export interface ClassAttendance {
  [studentId: string]: AttendanceRecord;
}

export interface StudentStats {
  totalLessons: number;
  present: number;
  absent: number;
  excused: number;
  percentage: number;
}

export interface BimesterConfig {
  id: number;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

// New Types for API
export interface SystemConfig {
    key: string;
    value: string;
}

export interface ApiData {
    classes: ClassGroup[];
    students: Student[];
    attendance: any[]; // Raw API record
    bimesters: BimesterConfig[];
    config: SystemConfig[];
}

export interface PendingChange {
    studentId: string;
    date: string;
    lessonIndex: number;
    status: AttendanceStatus;
    subject?: string;
    topic?: string; // New field for lesson content/notes
}

export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
}

// Map Date -> LessonIndex -> Subject Name
export type LessonSubjectMap = Record<string, Record<number, string>>;
// Map Date -> LessonIndex -> Topic/Content
export type LessonTopicMap = Record<string, Record<number, string>>;
