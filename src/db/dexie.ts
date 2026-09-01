import Dexie, { type EntityTable } from 'dexie';
import type { Expense, Trip, PiggyDeposit } from '../types';

export const db = new Dexie('TripTabPwaDB') as Dexie & {
  trips: EntityTable<Trip, 'id'>;
  expenses: EntityTable<Expense, 'id'>;
  piggyDeposits: EntityTable<PiggyDeposit, 'id'>;
};

// Define Schema with versioning
db.version(1).stores({
  trips: 'id, tripCode, title, destination, startDate, isArchived, createdAt',
  expenses: 'id, tripId, category, currency, paidById, date, createdAt',
});

db.version(2).stores({
  trips: 'id, tripCode, title, destination, startDate, isArchived, createdAt',
  expenses: 'id, tripId, category, currency, paidById, date, createdAt',
  piggyDeposits: 'id, tripId, memberId, date, createdAt',
});

// Seed data for immediate first-time experience
export const SEED_TRIP: Trip = {
  id: 'trip-japan-2026',
  tripCode: 'KANSAI-26',
  title: '日本关西7日游',
  destination: '大阪 · 京都 · 奈良',
  startDate: '2026-08-25',
  endDate: '2026-08-31',
  baseCurrency: 'MYR',
  currencySymbol: 'RM',
  budget: 15000,
  members: [
    { id: 'm-me', name: '房主 (Host)', avatarColor: '#ff6b6b', isOwner: true },
    { id: 'm-alex', name: 'Alex', avatarColor: '#4cc9f0' },
    { id: 'm-clara', name: 'Clara', avatarColor: '#ffd166' },
    { id: 'm-daniel', name: 'Daniel', avatarColor: '#06d6a0' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SEED_PIGGY_DEPOSITS: PiggyDeposit[] = [
  {
    id: 'p-1',
    tripId: 'trip-japan-2026',
    memberId: 'm-me',
    amount: 500,
    currency: 'MYR',
    baseAmount: 500,
    date: '2026-08-25',
    note: '出发前全员公账集资',
    createdAt: '2026-08-25T08:00:00Z',
  },
  {
    id: 'p-2',
    tripId: 'trip-japan-2026',
    memberId: 'm-alex',
    amount: 500,
    currency: 'MYR',
    baseAmount: 500,
    date: '2026-08-25',
    note: '出发前全员公账集资',
    createdAt: '2026-08-25T08:00:00Z',
  },
  {
    id: 'p-3',
    tripId: 'trip-japan-2026',
    memberId: 'm-clara',
    amount: 500,
    currency: 'MYR',
    baseAmount: 500,
    date: '2026-08-25',
    note: '出发前全员公账集资',
    createdAt: '2026-08-25T08:00:00Z',
  },
  {
    id: 'p-4',
    tripId: 'trip-japan-2026',
    memberId: 'm-daniel',
    amount: 500,
    currency: 'MYR',
    baseAmount: 500,
    date: '2026-08-25',
    note: '出发前全员公账集资',
    createdAt: '2026-08-25T08:00:00Z',
  },
];

export const SEED_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    tripId: 'trip-japan-2026',
    title: '南海电铁 Rapi:t 特急车票',
    category: 'transport',
    amount: 5720,
    currency: 'JPY',
    baseAmount: 168.0, // in MYR
    paidById: 'piggy-bank', // Paid with Piggy Bank cash
    date: '2026-08-25',
    splitType: 'equal',
    splitDetails: { 'm-me': 42.0, 'm-alex': 42.0, 'm-clara': 42.0, 'm-daniel': 42.0 },
    createdAt: '2026-08-25T09:30:00Z',
    updatedAt: '2026-08-25T09:30:00Z',
  },
  {
    id: 'exp-2',
    tripId: 'trip-japan-2026',
    title: '道顿堀一兰拉面加叉烧木耳',
    category: 'food',
    amount: 6800,
    currency: 'JPY',
    baseAmount: 200.0,
    paidById: 'piggy-bank', // Paid with Piggy Bank cash
    date: '2026-08-25',
    splitType: 'equal',
    splitDetails: { 'm-me': 50.0, 'm-alex': 50.0, 'm-clara': 50.0, 'm-daniel': 50.0 },
    createdAt: '2026-08-25T13:15:00Z',
    updatedAt: '2026-08-25T13:15:00Z',
  },
  {
    id: 'exp-3',
    tripId: 'trip-japan-2026',
    title: '京都四条河原町居酒屋包厢',
    category: 'food',
    amount: 64000,
    currency: 'JPY',
    baseAmount: 1880.0,
    paidById: 'm-clara', // Out-of-pocket paid by Clara
    date: '2026-08-26',
    splitType: 'equal',
    splitDetails: { 'm-me': 470.0, 'm-alex': 470.0, 'm-clara': 470.0, 'm-daniel': 470.0 },
    createdAt: '2026-08-26T19:40:00Z',
    updatedAt: '2026-08-26T19:40:00Z',
  },
  {
    id: 'exp-4',
    tripId: 'trip-japan-2026',
    title: '日本环球影城 USJ 快速通关券',
    category: 'ticket',
    amount: 120000,
    currency: 'JPY',
    baseAmount: 3520.0,
    paidById: 'm-clara', // Out-of-pocket paid by Clara
    date: '2026-08-27',
    splitType: 'equal',
    splitDetails: { 'm-me': 880.0, 'm-alex': 880.0, 'm-clara': 880.0, 'm-daniel': 880.0 },
    createdAt: '2026-08-27T08:00:00Z',
    updatedAt: '2026-08-27T08:00:00Z',
  },
  {
    id: 'exp-5',
    tripId: 'trip-japan-2026',
    title: '奈良公园包车一日游',
    category: 'transport',
    amount: 32000,
    currency: 'JPY',
    baseAmount: 940.0,
    paidById: 'm-daniel', // Out-of-pocket paid by Daniel
    date: '2026-08-28',
    splitType: 'equal',
    splitDetails: { 'm-me': 235.0, 'm-alex': 235.0, 'm-clara': 235.0, 'm-daniel': 235.0 },
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
  },
];
