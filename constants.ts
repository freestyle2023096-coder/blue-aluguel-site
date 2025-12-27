
import { Plan, PlanInterval, AppSettings } from './types';

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-mensal',
    name: 'Mensal',
    price: 69.90,
    days: 30,
    interval: PlanInterval.MENSAL,
    description: '30 dias de automação e gestão completa.',
    isActive: true
  },
  {
    id: 'plan-trimestral',
    name: 'Trimestral',
    price: 199.90,
    days: 90,
    interval: PlanInterval.TRIMESTRAL,
    description: '90 dias de BLUE BOT. O mais vendido para grupos!',
    isActive: true,
    isPopular: true
  },
  {
    id: 'plan-anual',
    name: 'Anual',
    price: 750.00,
    days: 365,
    interval: PlanInterval.ANUAL,
    description: '365 dias. O melhor custo-benefício para profissionais.',
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
