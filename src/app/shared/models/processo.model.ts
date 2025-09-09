import { Comarca } from './comarca.model';
import { Orgao } from './orgao.model';

export interface Processo {
  id?: number;
  // Java entity field names
  numeroprocesso: string;
  numeroprocessopesq?: string;
  parte?: string;
  adverso?: string;
  posicao?: string;
  status?: string;
  cartorio?: string;
  assunto?: string;
  localizacao?: string;
  numerointegracao?: string;
  comarca?: Comarca;
  orgao?: Orgao;
  numorgao?: number;
  proceletronico?: string;
  quantsoli?: number;
  totalfeita?: number;
  
  // Properties that existed in the previous model
  valor?: number;
  observacao?: string;
  dataDistribuicao?: string;
  dataInclusao?: string;
  ativo: boolean;
}

export { Orgao };  // Re-export Orgao for backward compatibility