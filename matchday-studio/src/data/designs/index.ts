import type { DesignSpec } from '@/types';
import { qfk001 } from '@/data/designs/qfk-001';

export const allDesigns: DesignSpec[] = [qfk001];

export const getDesignById = (id: string): DesignSpec | undefined =>
  allDesigns.find((d) => d.id === id);
