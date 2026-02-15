import { Student, AttendanceStatus, ClassGroup, BimesterConfig, EnrollmentStatus } from './types';

export const CURRENT_YEAR = new Date().getFullYear();

// Brazil School Bimesters (Approximate - Fixed Dates)
export const BIMESTERS: BimesterConfig[] = [
  { id: 1, name: '1º Bimestre', start: `${CURRENT_YEAR}-02-01`, end: `${CURRENT_YEAR}-04-30` },
  { id: 2, name: '2º Bimestre', start: `${CURRENT_YEAR}-05-01`, end: `${CURRENT_YEAR}-07-15` },
  { id: 3, name: '3º Bimestre', start: `${CURRENT_YEAR}-08-01`, end: `${CURRENT_YEAR}-09-30` },
  { id: 4, name: '4º Bimestre', start: `${CURRENT_YEAR}-10-01`, end: `${CURRENT_YEAR}-12-20` },
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MOCK_CLASSES: ClassGroup[] = [
  { id: 'c1', name: '1º Ano A - Ensino Médio' },
  { id: 'c2', name: '2º Ano B - Fundamental' }
];

export const MOCK_STUDENTS_POOL: Student[] = [
  { id: '1', name: 'Alyson Emanuel da Cruz Mauricio', status: EnrollmentStatus.ACTIVE, classId: 'c1' },
  { id: '2', name: 'Ana Gabrielly Soares de Sousa', status: EnrollmentStatus.ACTIVE, classId: 'c1' },
  { id: '3', name: 'Antonio Otavio Mendes da Silva', status: EnrollmentStatus.ACTIVE, classId: 'c1' },
  { id: '4', name: 'Cecilia Evelin Duarte Alves', status: EnrollmentStatus.TRANSFERRED, classId: 'c1' },
  { id: '5', name: 'Davi de Sousa Gomes', status: EnrollmentStatus.ACTIVE, classId: 'c1' },
  { id: '6', name: 'Emerson Souza Dias de Oliveira', status: EnrollmentStatus.ACTIVE, classId: 'c2' },
  { id: '7', name: 'Gabriel Marinho Camara', status: EnrollmentStatus.DROPOUT, classId: 'c2' },
  { id: '8', name: 'Heloisa Victoria Ferreira', status: EnrollmentStatus.ACTIVE, classId: 'c2' },
  { id: '9', name: 'Isabella Cristina Rocha', status: EnrollmentStatus.ACTIVE, classId: 'c2' },
  { id: '10', name: 'João Pedro Alves dos Santos', status: EnrollmentStatus.ACTIVE, classId: 'c2' },
];

export const STATUS_COLORS = {
  [AttendanceStatus.PRESENT]: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200',
  [AttendanceStatus.ABSENT]: 'bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200',
  [AttendanceStatus.EXCUSED]: 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200',
  [AttendanceStatus.UNDEFINED]: 'bg-gray-50 text-gray-400 hover:bg-gray-100 border-gray-100',
};

export const STATUS_LABELS = {
  [AttendanceStatus.PRESENT]: 'P',
  [AttendanceStatus.ABSENT]: 'F',
  [AttendanceStatus.EXCUSED]: 'J',
  [AttendanceStatus.UNDEFINED]: '-',
};

export const ENROLLMENT_COLORS = {
  [EnrollmentStatus.ACTIVE]: 'bg-blue-100 text-blue-700 border-blue-200',
  [EnrollmentStatus.DROPOUT]: 'bg-red-100 text-red-700 border-red-200',
  [EnrollmentStatus.TRANSFERRED]: 'bg-orange-100 text-orange-700 border-orange-200',
  [EnrollmentStatus.OTHER]: 'bg-gray-100 text-gray-600 border-gray-200',
};