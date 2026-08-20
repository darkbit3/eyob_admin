// ─── BidLow API Client ────────────────────────────────────────────────────────
// All requests go through the Vite proxy → http://localhost:3000

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : '';
const BASE =
  (import.meta as any).env?.VITE_API_BASE ??
  (runtimeHost && /localhost|127\.0\.0\.1/.test(runtimeHost) ? '/api' : 'https://eyob-backend.onrender.com/api');

// ── Token helpers ─────────────────────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem('bidlow_token');
}

export function setToken(token: string): void {
  localStorage.setItem('bidlow_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('bidlow_token');
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  let body: any;
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
    if (typeof body === 'string' && body.trim().startsWith('<')) {
      throw new Error(`Non-JSON response (status ${res.status}): ${body.slice(0,200)}`);
    }
  }

  if (!res.ok) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (identifier: string, password: string) =>
    request<{ success: boolean; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => request<{ success: boolean; data: any }>('/users/me'),
  list: () => request<{ success: boolean; data: any[] }>('/users'),
  get: (id: string) => request<{ success: boolean; data: any }>(`/users/${id}`),
  updateStatus: (id: string, status: 'active' | 'suspended') =>
    request<{ success: boolean; data: any }>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  createUser: (data: { name: string; email: string; phone: string; password: string; role: string }) =>
    request<{ success: boolean; data: any }>('/users/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetPassword: (id: string, tempPassword?: string) =>
    request<{ success: boolean; data: any }>(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ tempPassword }),
    }),
  adjustWallet: (id: string, amount: number, reason: string, type: 'wallet' | 'credits') =>
    request<{ success: boolean; data: any }>(`/users/${id}/wallet`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, reason, type }),
    }),
};

// ── Auctions ──────────────────────────────────────────────────────────────────
export const auctionsApi = {
  list: (params?: { status?: string; category?: string; search?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; data: any[] }>(`/auctions${q ? `?${q}` : ''}`);
  },
  get: (id: string) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}`),
  create: (data: any) =>
    request<{ success: boolean; data: any }>('/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  setStatus: (id: string, status: string) =>
    request<{ success: boolean; data: any }>(`/auctions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/auctions/${id}`, { method: 'DELETE' }),
};

// ── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: () => request<{ success: boolean; data: any[] }>('/products'),
  create: (data: any) =>
    request<{ success: boolean; data: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
};

// ── Bids ──────────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (auctionId: string, amount: number) =>
    request<{ success: boolean; data: any }>('/bids', {
      method: 'POST',
      body: JSON.stringify({ auction_id: auctionId, amount }),
    }),
  myBids: () => request<{ success: boolean; data: any[] }>('/bids/my'),
  forAuction: (auctionId: string) =>
    request<{ success: boolean; data: any[] }>(`/bids/auction/${auctionId}`),
  all: () => request<{ success: boolean; data: any[] }>('/bids'),
  update: (bidId: string, amount: number) =>
    request<{ success: boolean; message: string; data: any }>(`/bids/${bidId}`, {
      method: 'PATCH',
      body: JSON.stringify({ amount }),
    }),
  cancel: (bidId: string) =>
    request<{ success: boolean; message: string; data?: any }>(`/bids/${bidId}`, {
      method: 'DELETE',
    }),
};

// ── Wallet ────────────────────────────────────────────────────────────────────
export const walletApi = {
  myTransactions: () =>
    request<{ success: boolean; data: any[] }>('/wallet/transactions/my'),
  allTransactions: () =>
    request<{ success: boolean; data: any[] }>('/wallet/transactions'),
  queue: () => request<{ success: boolean; data: any[] }>('/wallet/queue'),
  submitDeposit: (data: any) =>
    request<{ success: boolean; data: any }>('/wallet/queue', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approvePayment: (id: string) =>
    request<{ success: boolean; message?: string }>(`/wallet/queue/${id}/approve`, { method: 'PATCH' }),
  rejectPayment: (id: string, reason?: string) =>
    request<{ success: boolean; message?: string }>(`/wallet/queue/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  chapaInitialize: (amount: number) =>
    request<{ success: boolean; data: { checkout_url: string; tx_ref: string } }>('/wallet/chapa/initialize', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  chapaVerify: (txRef: string) =>
    request<{ success: boolean; message: string; data: { status: string; amount?: number } }>(`/wallet/chapa/verify/${txRef}`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  my: () => request<{ success: boolean; data: any[] }>('/notifications/my'),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const auditApi = {
  list: () => request<{ success: boolean; data: any[] }>('/audit'),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<{ success: boolean; data: any }>('/settings'),
  update: (data: any) =>
    request<{ success: boolean; data: any }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getBankAccounts: () =>
    request<{ success: boolean; data: any[] }>('/settings/bank-accounts'),
  createBankAccount: (data: { method_name: string; account_number: string; account_holder: string }) =>
    request<{ success: boolean; message?: string; data: any }>('/settings/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBankAccount: (id: string, data: Partial<{ method_name: string; account_number: string; account_holder: string; is_active: boolean }>) =>
    request<{ success: boolean; message?: string; data: any }>(`/settings/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBankAccount: (id: string) =>
    request<{ success: boolean; message?: string }>(`/settings/bank-accounts/${id}`, {
      method: 'DELETE',
    }),
};

// ── Winners ───────────────────────────────────────────────────────────────────
export const winnersApi = {
  list: () => request<{ success: boolean; data: any[] }>('/winners'),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => request<{ success: boolean; data: any }>('/reports/dashboard'),
  revenue: () => request<{ success: boolean; data: any[] }>('/reports/revenue'),
  users: () => request<{ success: boolean; data: any[] }>('/reports/users'),
  categories: () => request<{ success: boolean; data: any[] }>('/reports/categories'),
  payments: () => request<{ success: boolean; data: any[] }>('/reports/payments'),
  winnerStats: () => request<{ success: boolean; data: any }>('/winners/report/stats'),
  profit: (params?: { status?: string; date_from?: string; date_to?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<{ success: boolean; data: { auctions: any[]; summary: any } }>(`/reports/profit${q ? `?${q}` : ''}`);
  },
};


// ── Announcements (admin sends via notifications) ─────────────────────────────
export const announcementsApi = {
  send: (data: any) =>
    request<{ success: boolean; data: any }>('/notifications/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Image Upload — multipart to Cloudinary via backend ───────────────────────
export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body?.message || `Upload failed (${res.status})`);
    }
    return body.data.url as string;
  },
};
