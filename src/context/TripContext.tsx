import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, SEED_EXPENSES, SEED_TRIP } from '../db/dexie';
import { convertCurrency, getCurrencySymbol } from '../engine/currencyConverter';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CurrencyCode, Expense, ExpenseCategory, Member, SplitType, Trip } from '../types';

type TabType = 'trips' | 'timeline' | 'settle' | 'settings';
type ThemeMode = 'dark' | 'light';

interface AddExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: CurrencyCode;
  paidById: string;
  date: string;
  splitType: SplitType;
  selectedMemberIds?: string[];
  customShares?: Record<string, number>;
  receiptImage?: string;
  note?: string;
}

interface TripContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  trips: Trip[];
  activeTripId: string;
  setActiveTripId: (id: string) => void;
  activeTrip: Trip | undefined;
  expenses: Expense[];
  allExpenses: Expense[];
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  customRates: Partial<Record<CurrencyCode, number>>;
  updateCustomRate: (currency: CurrencyCode, rate: number) => void;
  addExpense: (input: AddExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: AddExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  createNewTrip: (title: string, destination: string, baseCurrency: CurrencyCode, budget?: number) => Promise<string>;
  addMemberToTrip: (tripId: string, memberName: string) => Promise<void>;
  joinTripByCode: (code: string, nickname: string) => Promise<boolean>;
  isOnline: boolean;
}

const TripContext = createContext<TripContextType | null>(null);

const AVATAR_COLORS = ['#ff6b6b', '#4cc9f0', '#ffd166', '#06d6a0', '#9b5de5', '#f72585', '#7209b7', '#4895ef'];

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('triptab_theme') as ThemeMode) || 'dark';
  });
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('trip-japan-2026');
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [customRates, setCustomRates] = useState<Partial<Record<CurrencyCode, number>>>(() => {
    const saved = localStorage.getItem('triptab_rates');
    return saved ? JSON.parse(saved) : {};
  });

  // Handle dark mode DOM class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('triptab_theme', theme);
  }, [theme]);

  // Handle Online / Offline network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Dexie.js database & seed data
  useEffect(() => {
    const initDb = async () => {
      const tripCount = await db.trips.count();
      if (tripCount === 0) {
        await db.trips.add(SEED_TRIP);
        await db.expenses.bulkAdd(SEED_EXPENSES);
      }

      const loadedTrips = await db.trips.toArray();
      const loadedExpenses = await db.expenses.toArray();

      setTrips(loadedTrips);
      setAllExpenses(loadedExpenses);

      // Check if URL has ?trip=XXX param
      const params = new URLSearchParams(window.location.search);
      const tripCodeParam = params.get('trip');
      if (tripCodeParam) {
        const found = loadedTrips.find((t) => t.tripCode.toUpperCase() === tripCodeParam.toUpperCase());
        if (found) {
          setActiveTripId(found.id);
        }
      } else if (loadedTrips.length > 0) {
        setActiveTripId(loadedTrips[0].id);
      }
    };

    initDb();
  }, []);

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const expenses = allExpenses.filter((e) => e.tripId === activeTripId);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateCustomRate = (currency: CurrencyCode, rate: number) => {
    setCustomRates((prev) => {
      const updated = { ...prev, [currency]: rate };
      localStorage.setItem('triptab_rates', JSON.stringify(updated));
      return updated;
    });
  };

  const addExpense = async (input: AddExpenseInput) => {
    if (!activeTrip) return;

    // Convert amount into active trip's baseCurrency
    const baseAmount = convertCurrency(input.amount, input.currency, activeTrip.baseCurrency, customRates);

    // Calculate split details
    const splitDetails: Record<string, number> = {};
    const membersToSplit = (input.selectedMemberIds && input.selectedMemberIds.length > 0)
      ? input.selectedMemberIds
      : activeTrip.members.map((m) => m.id);

    if (input.splitType === 'equal') {
      const perPerson = Math.round((baseAmount / membersToSplit.length) * 100) / 100;
      let allocated = 0;
      membersToSplit.forEach((id, idx) => {
        if (idx === membersToSplit.length - 1) {
          splitDetails[id] = Math.round((baseAmount - allocated) * 100) / 100;
        } else {
          splitDetails[id] = perPerson;
          allocated += perPerson;
        }
      });
    } else if (input.customShares) {
      Object.assign(splitDetails, input.customShares);
    }

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      tripId: activeTrip.id,
      title: input.title || '旅行杂项',
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      baseAmount,
      paidById: input.paidById,
      date: input.date,
      splitType: input.splitType,
      splitDetails,
      receiptImage: input.receiptImage,
      note: input.note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.expenses.add(newExpense);
    setAllExpenses((prev) => [newExpense, ...prev]);

    // Optional Supabase broadcast if configured
    if (isSupabaseConfigured && supabase && activeTrip.tripCode) {
      try {
        await supabase.from('rooms').upsert(
          {
            room_code: activeTrip.tripCode,
            title: activeTrip.title,
            currency: activeTrip.baseCurrency,
            data: { trip: activeTrip, expenses: [newExpense, ...expenses] },
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'room_code' }
        );
      } catch (err) {
        console.error('Supabase trip broadcast error:', err);
      }
    }
  };

  const updateExpense = async (id: string, input: AddExpenseInput) => {
    if (!activeTrip) return;

    const baseAmount = convertCurrency(input.amount, input.currency, activeTrip.baseCurrency, customRates);
    const splitDetails: Record<string, number> = {};
    const membersToSplit = (input.selectedMemberIds && input.selectedMemberIds.length > 0)
      ? input.selectedMemberIds
      : activeTrip.members.map((m) => m.id);

    if (input.splitType === 'equal') {
      const perPerson = Math.round((baseAmount / membersToSplit.length) * 100) / 100;
      let allocated = 0;
      membersToSplit.forEach((mId, idx) => {
        if (idx === membersToSplit.length - 1) {
          splitDetails[mId] = Math.round((baseAmount - allocated) * 100) / 100;
        } else {
          splitDetails[mId] = perPerson;
          allocated += perPerson;
        }
      });
    } else if (input.customShares) {
      Object.assign(splitDetails, input.customShares);
    }

    const existing = allExpenses.find((e) => e.id === id);
    const updated: Expense = {
      id,
      tripId: activeTrip.id,
      title: input.title || '旅行杂项',
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      baseAmount,
      paidById: input.paidById,
      date: input.date,
      splitType: input.splitType,
      splitDetails,
      receiptImage: input.receiptImage ?? existing?.receiptImage,
      note: input.note,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.expenses.put(updated);
    setAllExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    setEditingExpense(null);
  };

  const deleteExpense = async (id: string) => {
    await db.expenses.delete(id);
    setAllExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const createNewTrip = async (
    title: string,
    destination: string,
    baseCurrency: CurrencyCode,
    budget?: number
  ): Promise<string> => {
    const codeNum = Math.floor(10 + Math.random() * 90);
    const prefix = destination.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'TRIP';
    const tripCode = `${prefix}-${codeNum}`;

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      tripCode,
      title: title || '新旅行行程',
      destination: destination || '目的地',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      baseCurrency,
      currencySymbol: getCurrencySymbol(baseCurrency),
      budget,
      members: [
        { id: 'm-me', name: '我 (组织者)', avatarColor: '#ff6b6b', isOwner: true }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.trips.add(newTrip);
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setActiveTab('timeline');
    return newTrip.id;
  };

  const addMemberToTrip = async (tripId: string, memberName: string) => {
    const trimmed = memberName.trim();
    if (!trimmed) return;

    const newMember: Member = {
      id: `m-${Date.now()}`,
      name: trimmed,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };

    const targetTrip = trips.find((t) => t.id === tripId);
    if (!targetTrip) return;

    const updatedTrip = {
      ...targetTrip,
      members: [...targetTrip.members, newMember],
      updatedAt: new Date().toISOString(),
    };

    await db.trips.put(updatedTrip);
    setTrips((prev) => prev.map((t) => (t.id === tripId ? updatedTrip : t)));
  };

  const joinTripByCode = async (code: string, nickname: string): Promise<boolean> => {
    const trimmedCode = code.trim().toUpperCase();
    const found = trips.find((t) => t.tripCode.toUpperCase() === trimmedCode);
    if (!found) return false;

    if (!found.members.some((m) => m.name.toLowerCase() === nickname.toLowerCase())) {
      await addMemberToTrip(found.id, nickname);
    }
    setActiveTripId(found.id);
    setActiveTab('timeline');
    return true;
  };

  return (
    <TripContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        trips,
        activeTripId,
        setActiveTripId,
        activeTrip,
        expenses,
        allExpenses,
        isDrawerOpen,
        setIsDrawerOpen,
        customRates,
        updateCustomRate,
        addExpense,
        updateExpense,
        deleteExpense,
        editingExpense,
        setEditingExpense,
        createNewTrip,
        addMemberToTrip,
        joinTripByCode,
        isOnline,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
