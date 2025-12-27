
import { Plan, PlanInterval, AppSettings } from './types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-mensal',
    name: 'Mensal Blue',
    price: 69.90,
    days: 30,
    interval: PlanInterval.MENSAL,
    description: 'Gestão completa para 30 dias de operação ininterrupta.',
    isActive: true
  },
  {
    id: 'plan-trimestral',
    name: 'Trimestral Pro',
    price: 189.90,
    days: 90,
    interval: PlanInterval.TRIMESTRAL,
    description: 'Alta performance para 90 dias. O favorito dos grupos!',
    isActive: true,
    isPopular: true
  },
  {
    id: 'plan-anual',
    name: 'Anual Elite',
    price: 690.00,
    days: 365,
    interval: PlanInterval.ANUAL,
    description: '365 dias de autonomia total. Máxima economia.',
    isActive: true
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  storeName: '⏤͟͟͞͞ BLUE ALUGUEL ⛤⃗ 💙',
  ownerName: 'Pedro Bots',
  ownerNumber: '5599981175724',
  pixKey: 'bqoqb2nroqo1hq9sao',
  adminPin: '0000',
  siteUrl: window.location.origin,
  authorizedResellers: []
};

export const BOT_NAME = '⏤͟͟͞͞ BLUE ALUGUEL ⛤⃗ 💙';
export const ROBOT_NAME = '⏤͟͟͞͞ BLUE BOT ⛤⃗ 💙';
