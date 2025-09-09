import { Uf } from './uf.model';

export interface Correspondente {
  id?: number;
  nome: string;
  cpfcnpj?: string;
  oab?: string;
  emailprimario?: string;  // Changed from emailPrincipal
  emailsecundario?: string;
  telefoneprimario?: string;  // Changed from telefone
  telefonesecundario?: string;
  telefonecelularprimario?: string;  // Changed from celular
  telefonecelularsecundario?: string;
  endereco?: Endereco;
  observacoes?: string;
  ativo: boolean;
  datacadastro?: string;  // Changed from dataInclusao to match backend
  tipo?: string;
}

export interface Endereco {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: Uf;
  cep?: string;
}