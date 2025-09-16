export interface SolicitacaoAnexo {
  id?: number;
  solicitacao?: {
    id?: number;
    // Add other Solicitacao properties as needed
  };
  nomearquivo: string;
  dataInclusao?: Date;
  caminhofisico?: string;
  origem?: string;
  ativo: boolean;
  caminhorelativo?: string;
}