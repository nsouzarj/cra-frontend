import { Uf } from './uf.model';

export interface Comarca {
  id?: number;
  nome: string;
  uf: Uf;
  ativo: boolean;
}