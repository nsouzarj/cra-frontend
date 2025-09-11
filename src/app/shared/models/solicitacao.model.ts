import { Processo } from './processo.model';
import { Correspondente } from './correspondente.model';
import { Comarca } from './comarca.model';
import { User } from './user.model';
import { TipoSolicitacao } from './tiposolicitacao.model';

export interface Solicitacao {
  id?: number;
  referenciaSolicitacao?: number;
  datasolicitacao?: string;
  dataconclusao?: string;
  dataprazo?: string;
  observacao?: string;
  instrucoes?: string;
  complemento?: string;
  justificativa?: string;
  tratamentoPosAudiencia?: string;
  numeroControle?: string;
  tempreposto?: boolean;
  convolada?: boolean;
  horaAudiencia?: string;
  statusExterno?: string;
  processo?: Processo;
  comarca?: Comarca;
  correspondente?: Correspondente;
  usuario?: User;
  valor?: number;
  valorDaAlcada?: number;
  emailEnvio?: string;
  pago?: boolean;
  grupo?: string;
  propostaAcordo?: boolean;
  auditoriaInterna?: boolean;
  tipoSolicitacao?: TipoSolicitacao
  lide?: string;
  avaliacaoNota?: number;
  textoAvaliacao?: string;
  statusSolicitacao?: SolicitacaoStatus;
  ativo: boolean;
}

export interface SolicitacaoStatus {
  idstatus: number;
  status: string;
}