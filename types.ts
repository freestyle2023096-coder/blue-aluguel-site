
export enum PlanInterval {
  TESTE = '7 dias (Grátis)',
  SEMANAL = '7 dias',
  MENSAL = '30 dias',
  TRIMESTRAL = '90 dias',
  ANUAL = '365 dias'
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: PlanInterval;
  days: number;
  description: string;
  isActive: boolean;
  isPopular?: boolean;
}

export interface Reseller {
  id: string;
  name: string;
  whatsapp: string;
  isActive: boolean;
}

export interface AppSettings {
  storeName: string;
  ownerName: string;
  ownerNumber: string;
  pixKey: string;
  adminPin: string;
  siteUrl: string;
  authorizedResellers: Reseller[];
}

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  city: string;
  neighborhood: string;
  projectName: string;
  purpose: string;
  groupLink: string;
  planId: string;
  timestamp: Date;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'form' | 'plan-selection' | 'pix';
}

export type RankLevel = 'Bronze' | 'Prata' | 'Ouro' | 'Platina' | 'Diamante' | 'Dono';
