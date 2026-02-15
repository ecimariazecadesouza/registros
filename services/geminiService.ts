import { GoogleGenAI } from "@google/genai";
import { Student, StudentStats } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentReport = async (student: Student, stats: StudentStats): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Você é um coordenador pedagógico experiente. Analise os dados de frequência do aluno abaixo e gere um breve relatório (máximo 3 frases) para o professor.
    Seja construtivo. Se a frequência for alta, elogie. Se for baixa, sugira intervenção.
    
    Aluno: ${student.name}
    Situação da Matrícula: ${student.status}
    Total Dias Letivos: ${stats.totalLessons}
    Presenças: ${stats.present}
    Faltas: ${stats.absent}
    Justificadas: ${stats.excused}
    Frequência: ${stats.percentage.toFixed(1)}%
    
    Considere a "Situação da Matrícula" na análise (ex: se for Evasão, a falta de presença é esperada).
    Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar o relatório.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao comunicar com a IA.";
  }
};

export const analyzeClassTrends = async (overallPercentage: number, totalAbsences: number): Promise<string> => {
   const ai = getAiClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  const prompt = `
    Atue como um analista de dados educacionais.
    A turma tem uma frequência média de ${overallPercentage.toFixed(1)}% e um total de ${totalAbsences} faltas registradas no período.
    Dê uma sugestão tática curta (1 parágrafo) para melhorar ou manter esses números.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Sem análise disponível.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao analisar dados da turma.";
  }
}