export interface SolicitacaoFiltro {
  // Basic pagination
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: string;
  
  // Filter fields
  comarcaId?: number | null;
  correspondenteId?: number | null;
  processoId?: number | null;
  usuarioId?: number | null;
  statusId?: number | null;
  tipoSolicitacaoId?: number | null;
  grupo?: number | null;
  statusExterno?: string | null;
  texto?: string | null; // For text search in observacao or instrucoes
  dataInicio?: Date | null;
  dataFim?: Date | null;
  pago?: boolean | null;
  concluida?: boolean | null;
  atrasada?: boolean | null;
  
  // Additional filters
  numero?: string | null;
  vara?: string | null;
  requerente?: string | null;
  requerido?: string | null;
  uf?: string | null;
}