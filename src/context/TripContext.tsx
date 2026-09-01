import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, SEED_TRIP, SEED_EXPENSES } from '../db/dexie';
import type { Trip, Expense, CurrencyCode, ExpenseCategory, SplitType, Member } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { convertCurrency, getCurrencySymbol } from '../engine/currencyConverter';

export type TabType = 'trips' | 'timeline' | 'settle' | 'settings';
export type ThemeMode = 'dark' | 'light';

export interface AddExpenseInput {
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

export interface TripContextType {
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
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  customRates: Partial<Record<CurrencyCode, number>>;
  updateCustomRate: (currency: CurrencyCode, rate: number) => void;
  addExpense: (input: AddExpenseInput) => Promise<void>;
  updateExpense: (id: string, input: AddExpenseInput) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  editingExpense: Expense | null;
  setEditingExpense: (exp: Expense | null) => void;
  createNewTrip: (title: string, destination: string, baseCurrency: CurrencyCode, budget?: number) => Promise<string>;
  archiveTrip: (id: string) => Promise<void>;
  unarchiveTrip: (id: string) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addMemberToTrip: (tripId: string, memberName: string) => Promise<void>;
  joinTripByCode: (code: string, nickname: string) => Promise<boolean>;
  isOnline: boolean;
  syncTripToCloud: (tripToSync: Trip, expensesToSync: Expense[]) => Promise<void>;
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  isIdentityModalOpen: boolean;
  setIsIdentityModalOpen: (open: boolean) => void;
}

const TripContext = createContext<TripContextType | null>(null);

const AVATAR_COLORS = ['#ff6b6b', '#4cc9f0', '#ffd166', '#06d6a0', '#9b5de5', '#f72585', '#7209b7', '#4895ef'];

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('triptab_theme') as ThemeMode) || 'dark';
  });
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('trip-japan-2026');
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [currentMemberId, setCurrentMemberIdState] = useState<string>(() => {
    return localStorage.getItem('triptab_member_active') || 'm-me';
  });
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState<boolean>(false);

  const setCurrentMemberId = (id: string) => {
    setCurrentMemberIdState(id);
    localStorage.setItem('triptab_member_active', id);
    if (activeTripId) {
      localStorage.setItem(`triptab_member_${activeTripId}`, id);
    }
  };

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

  // Online / Offline listeners
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

  // Universal cloud sync helper
  const syncTripToCloud = async (tripToSync: Trip, expensesToSync: Expense[]) => {
    if (!isSupabaseConfigured || !supabase || !tripToSync.tripCode) return;
    try {
      await supabase.from('rooms').upsert(
        {
          room_code: tripToSync.tripCode.toUpperCase(),
          title: tripToSync.title,
          currency: tripToSync.baseCurrency,
          currency_symbol: tripToSync.currencySymbol,
          payer_id: tripToSync.members[0]?.id || '',
          data: { trip: tripToSync, expenses: expensesToSync },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'room_code' }
      );
    } catch (err) {
      console.warn('Supabase sync error:', err);
    }
  };

  // Initialize Dexie.js database, handle ?trip= param, & fetch from Supabase
  useEffect(() => {
    const initDb = async () => {
      const tripCount = await db.trips.count();
      if (tripCount === 0) {
        await db.trips.add(SEED_TRIP);
        await db.expenses.bulkAdd(SEED_EXPENSES);
        // Upload initial seed trip to Supabase so it's available globally
        await syncTripToCloud(SEED_TRIP, SEED_EXPENSES);
      }

      const loadedTrips = await db.trips.toArray();
      const loadedExpenses = await db.expenses.toArray();

      setTrips(loadedTrips);
      setAllExpenses(loadedExpenses);

      // Extract ?trip= parameter from current URL or hash
      let tripCodeParam: string | null = null;
      try {
        const urlObj = new URL(window.location.href);
        tripCodeParam = urlObj.searchParams.get('trip');
        if (!tripCodeParam) {
          const match = /(?:\?|&)trip=([A-Za-z0-9-]+)/i.exec(window.location.href);
          if (match) tripCodeParam = match[1];
        }
      } catch {
        const match = /(?:\?|&)trip=([A-Za-z0-9-]+)/i.exec(window.location.href);
        if (match) tripCodeParam = match[1];
      }

      if (tripCodeParam) {
        const normalizedCode = tripCodeParam.trim().toUpperCase();
        const found = loadedTrips.find((t) => t.tripCode.toUpperCase() === normalizedCode);

        if (found) {
          setActiveTripId(found.id);
          setActiveTab('timeline');
          const savedMember = localStorage.getItem(`triptab_member_${found.id}`);
          if (savedMember) {
            setCurrentMemberIdState(savedMember);
          } else {
            setIsIdentityModalOpen(true);
          }
        } else if (isSupabaseConfigured && supabase) {
          // If not found in local IndexedDB (e.g. friend scanned QR code on another phone)
          try {
            const { data } = await supabase
              .from('rooms')
              .select('*')
              .eq('room_code', normalizedCode)
              .single();

            if (data && data.data && data.data.trip) {
              const remoteTrip: Trip = data.data.trip;
              const remoteExpenses: Expense[] = data.data.expenses || [];

              await db.trips.put(remoteTrip);
              if (remoteExpenses.length > 0) {
                await db.expenses.bulkPut(remoteExpenses);
              }

              setTrips((prev) => [remoteTrip, ...prev.filter((t) => t.id !== remoteTrip.id)]);
              setAllExpenses((prev) => [
                ...remoteExpenses,
                ...prev.filter((e) => e.tripId !== remoteTrip.id),
              ]);
              setActiveTripId(remoteTrip.id);
              setActiveTab('timeline');

              const savedMember = localStorage.getItem(`triptab_member_${remoteTrip.id}`);
              if (savedMember) {
                setCurrentMemberIdState(savedMember);
              } else {
                setIsIdentityModalOpen(true);
              }
            }
          } catch (fetchErr) {
            console.warn('Could not fetch trip from Supabase by URL code:', fetchErr);
          }
        }
      } else if (loadedTrips.length > 0) {
        setActiveTripId(loadedTrips[0].id);
        const savedMember = localStorage.getItem(`triptab_member_${loadedTrips[0].id}`);
        if (savedMember) {
          setCurrentMemberIdState(savedMember);
        }
      }
    };

    initDb();
  }, []);

  const activeTrip = trips.find((t) => t.id === activeTripId) || trips[0];
  const expenses = allExpenses.filter((e) => e.tripId === activeTripId);

  // Realtime subscription for active trip
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !activeTrip?.tripCode) return;

    const channel = supabase
      .channel(`trip-realtime-${activeTrip.tripCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `room_code=eq.${activeTrip.tripCode.toUpperCase()}`,
        },
        async (payload) => {
          const newRecord = payload.new as any;
          if (newRecord?.data?.trip) {
            const remoteTrip: Trip = newRecord.data.trip;
            const remoteExpenses: Expense[] = newRecord.data.expenses || [];

            await db.trips.put(remoteTrip);
            if (remoteExpenses.length > 0) {
              await db.expenses.bulkPut(remoteExpenses);
            }

            setTrips((prev) => prev.map((t) => (t.id === remoteTrip.id ? remoteTrip : t)));
            setAllExpenses((prev) => {
              const other = prev.filter((e) => e.tripId !== remoteTrip.id);
              return [...remoteExpenses, ...other];
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) supabase.removeChannel(channel);
    };
  }, [activeTrip?.tripCode]);

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
    const membersToSplit =
      input.selectedMemberIds && input.selectedMemberIds.length > 0
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
    const updatedExpenses = [newExpense, ...allExpenses];
    setAllExpenses(updatedExpenses);

    // Broadcast to Supabase
    await syncTripToCloud(
      activeTrip,
      updatedExpenses.filter((e) => e.tripId === activeTrip.id)
    );
  };

  const updateExpense = async (id: string, input: AddExpenseInput) => {
    if (!activeTrip) return;

    const baseAmount = convertCurrency(input.amount, input.currency, activeTrip.baseCurrency, customRates);
    const splitDetails: Record<string, number> = {};
    const membersToSplit =
      input.selectedMemberIds && input.selectedMemberIds.length > 0
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
    const updatedExpenses = allExpenses.map((e) => (e.id === id ? updated : e));
    setAllExpenses(updatedExpenses);
    setEditingExpense(null);

    // Broadcast to Supabase
    await syncTripToCloud(
      activeTrip,
      updatedExpenses.filter((e) => e.tripId === activeTrip.id)
    );
  };

  const deleteExpense = async (id: string) => {
    await db.expenses.delete(id);
    const remaining = allExpenses.filter((e) => e.id !== id);
    setAllExpenses(remaining);
    if (activeTrip) {
      await syncTripToCloud(
        activeTrip,
        remaining.filter((e) => e.tripId === activeTrip.id)
      );
    }
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
      members: [{ id: 'm-me', name: '我 (组织者)', avatarColor: '#ff6b6b', isOwner: true }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.trips.add(newTrip);
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripId(newTrip.id);
    setActiveTab('timeline');

    // Immediately upload to Supabase so code is shareable instantly
    await syncTripToCloud(newTrip, []);

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

    // Sync to Supabase
    await syncTripToCloud(
      updatedTrip,
      allExpenses.filter((e) => e.tripId === tripId)
    );
  };

  const joinTripByCode = async (code: string, nickname: string): Promise<boolean> => {
    const trimmedCode = code.trim().toUpperCase();
    let found = trips.find((t) => t.tripCode.toUpperCase() === trimmedCode);

    // If not found in local IndexedDB, look up in Supabase
    if (!found && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('rooms')
          .select('*')
          .eq('room_code', trimmedCode)
          .single();

        if (data && data.data && data.data.trip) {
          found = data.data.trip;
          const remoteExpenses: Expense[] = data.data.expenses || [];

          await db.trips.put(found!);
          if (remoteExpenses.length > 0) {
            await db.expenses.bulkPut(remoteExpenses);
          }

          setTrips((prev) => [found!, ...prev.filter((t) => t.id !== found!.id)]);
          setAllExpenses((prev) => [
            ...remoteExpenses,
            ...prev.filter((e) => e.tripId !== found!.id),
          ]);
        }
      } catch (err) {
        console.warn('Supabase lookup error during join:', err);
      }
    }

    if (!found) return false;

    if (!found.members.some((m) => m.name.toLowerCase() === nickname.toLowerCase())) {
      await addMemberToTrip(found.id, nickname);
    }
    setActiveTripId(found.id);
    setActiveTab('timeline');
    return true;
  };

  const archiveTrip = async (id: string) => {
    const target = trips.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, isArchived: true, updatedAt: new Date().toISOString() };
    await db.trips.put(updated);
    setTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
    if (activeTripId === id) {
      const remaining = trips.filter((t) => t.id !== id && !t.isArchived);
      if (remaining.length > 0) setActiveTripId(remaining[0].id);
    }
    await syncTripToCloud(updated, allExpenses.filter((e) => e.tripId === id));
  };

  const unarchiveTrip = async (id: string) => {
    const target = trips.find((t) => t.id === id);
    if (!target) return;
    const updated = { ...target, isArchived: false, updatedAt: new Date().toISOString() };
    await db.trips.put(updated);
    setTrips((prev) => prev.map((t) => (t.id === id ? updated : t)));
    setActiveTripId(id);
    await syncTripToCloud(updated, allExpenses.filter((e) => e.tripId === id));
  };

  const deleteTrip = async (id: string) => {
    await db.trips.delete(id);
    await db.expenses.where('tripId').equals(id).delete();
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setAllExpenses((prev) => prev.filter((e) => e.tripId !== id));
    if (activeTripId === id) {
      const remaining = trips.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveTripId(remaining[0].id);
      }
    }
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
        isShareModalOpen,
        setIsShareModalOpen,
        customRates,
        updateCustomRate,
        addExpense,
        updateExpense,
        deleteExpense,
        editingExpense,
        setEditingExpense,
        createNewTrip,
        archiveTrip,
        unarchiveTrip,
        deleteTrip,
        addMemberToTrip,
        joinTripByCode,
        isOnline,
        syncTripToCloud,
        currentMemberId,
        setCurrentMemberId,
        isIdentityModalOpen,
        setIsIdentityModalOpen,
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
