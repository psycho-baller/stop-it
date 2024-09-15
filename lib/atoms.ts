// atoms.ts
import { atom } from 'jotai';

type Team = {
  label: string;
  value: string;
};

export const selectedTeamAtom = atom<Team | null>(null);