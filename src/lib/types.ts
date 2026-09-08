export type Assignment = {
  id: number; course: string; title: string; note: string | null; dueAt: string; done: boolean; doneAt: string | null;
};
export type Exam = { id: number; course: string; title: string; dueAt: string };
export type ClassBlock = { id: number; course: string; room: string | null; weekday: number; startMin: number; endMin: number };
export type Transaction = { id: number; label: string; amount: number; createdAt: string };
