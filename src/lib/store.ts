// LocalStorage-based data store (will be replaced with Lovable Cloud later)

export interface Transaction {
  id: number;
  amount: string;
  description: string;
  type: "income" | "expense";
  category: string;
  transactionDate: string;
  createdAt: string;
}

export interface Investment {
  id: number;
  symbol: string;
  assetType: string;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  name?: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: string;
  currentAmount: string;
  deadline: string;
  createdAt: string;
}

export interface Budget {
  id: number;
  name: string;
  limitAmount: string;
  spent: string;
  period: string;
  category: string;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface Lending {
  id: number;
  personName: string;
  type: "lent" | "borrowed";
  amount: string;
  amountRepaid: string;
  description: string;
  status: "pending" | "partial" | "repaid";
  createdAt: string;
}

function getStore<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch { return []; }
}

function setStore<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function nextId(items: { id: number }[]): number {
  return items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
}

// Transactions
export const transactionsStore = {
  list: () => getStore<Transaction>("fin_transactions"),
  create: (t: Omit<Transaction, "id" | "createdAt">) => {
    const items = getStore<Transaction>("fin_transactions");
    const item = { ...t, id: nextId(items), createdAt: new Date().toISOString() };
    setStore("fin_transactions", [...items, item]);
    return item;
  },
  delete: (id: number) => {
    setStore("fin_transactions", getStore<Transaction>("fin_transactions").filter(t => t.id !== id));
  },
};

// Investments
export const investmentsStore = {
  list: () => getStore<Investment>("fin_investments"),
  create: (i: Omit<Investment, "id" | "createdAt">) => {
    const items = getStore<Investment>("fin_investments");
    const item = { ...i, id: nextId(items), createdAt: new Date().toISOString() };
    setStore("fin_investments", [...items, item]);
    return item;
  },
  delete: (id: number) => {
    setStore("fin_investments", getStore<Investment>("fin_investments").filter(i => i.id !== id));
  },
};

// Savings Goals
export const savingsGoalsStore = {
  list: () => getStore<SavingsGoal>("fin_savings_goals"),
  create: (g: Omit<SavingsGoal, "id" | "createdAt">) => {
    const items = getStore<SavingsGoal>("fin_savings_goals");
    const item = { ...g, id: nextId(items), createdAt: new Date().toISOString() };
    setStore("fin_savings_goals", [...items, item]);
    return item;
  },
  update: (id: number, data: Partial<SavingsGoal>) => {
    const items = getStore<SavingsGoal>("fin_savings_goals");
    setStore("fin_savings_goals", items.map(g => g.id === id ? { ...g, ...data } : g));
  },
  delete: (id: number) => {
    setStore("fin_savings_goals", getStore<SavingsGoal>("fin_savings_goals").filter(g => g.id !== id));
  },
};

// Budgets
export const budgetsStore = {
  list: () => getStore<Budget>("fin_budgets"),
  create: (b: Omit<Budget, "id" | "createdAt">) => {
    const items = getStore<Budget>("fin_budgets");
    const item = { ...b, id: nextId(items), createdAt: new Date().toISOString() };
    setStore("fin_budgets", [...items, item]);
    return item;
  },
  delete: (id: number) => {
    setStore("fin_budgets", getStore<Budget>("fin_budgets").filter(b => b.id !== id));
  },
};

// Lendings
export const lendingsStore = {
  list: () => getStore<Lending>("fin_lendings"),
  create: (l: Omit<Lending, "id" | "createdAt">) => {
    const items = getStore<Lending>("fin_lendings");
    const item = { ...l, id: nextId(items), createdAt: new Date().toISOString() };
    setStore("fin_lendings", [...items, item]);
    return item;
  },
  update: (id: number, data: Partial<Lending>) => {
    const items = getStore<Lending>("fin_lendings");
    setStore("fin_lendings", items.map(l => l.id === id ? { ...l, ...data } : l));
  },
  delete: (id: number) => {
    setStore("fin_lendings", getStore<Lending>("fin_lendings").filter(l => l.id !== id));
  },
};
