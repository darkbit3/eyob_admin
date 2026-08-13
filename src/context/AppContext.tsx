import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User, Auction, Bid, Transaction, Notification, Product, PaymentQueueItem, Announcement, AuditLog, SystemSettings,
  initialSettings,
} from '../data/mockData';
import {
  getToken, removeToken,
  usersApi, auctionsApi, productsApi, bidsApi,
  walletApi, notificationsApi, auditApi,
} from '../utils/api';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  refreshCurrentUser: () => Promise<void>;
  
  auctions: Auction[];
  setAuctions: React.Dispatch<React.SetStateAction<Auction[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  bids: Bid[];
  setBids: React.Dispatch<React.SetStateAction<Bid[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  paymentQueue: PaymentQueueItem[];
  setPaymentQueue: React.Dispatch<React.SetStateAction<PaymentQueueItem[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;

  markNotificationRead: (id: string) => void;
  logout: () => void;

  addAuditLog: (action: string, target: string, details: string) => void;
  createAuction: (auction: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) => Promise<void>;
  updateAuction: (id: string, updates: Partial<Auction>) => Promise<void>;
  pauseAuction: (id: string) => Promise<void>;
  resumeAuction: (id: string) => Promise<void>;
  cancelAuction: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  resetUserPassword: (userId: string) => Promise<string | null>;
  approvePayment: (queueId: string) => void;
  rejectPayment: (queueId: string, reason?: string) => void;
  adjustUserWallet: (userId: string, amount: number, reason: string, isCredits?: boolean) => Promise<void>;
  sendAnnouncement: (announcement: Omit<Announcement, 'id' | 'timestamp' | 'deliveredCount' | 'sentBy'>) => void;
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

function apiToUser(u: any): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: u.role,
    walletBalance: Number(u.wallet_balance ?? u.walletBalance ?? 0),
    credits: Number(u.credits ?? 0),
    status: u.status,
    joinedAt: u.joined_at ?? u.joinedAt ?? new Date().toISOString().split('T')[0],
    wonAuctions: u.won_auctions ?? u.wonAuctions ?? [],
    photo: u.photo_url ?? u.photo ?? undefined,
  };
}

function apiToProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    images: Array.isArray(p.images) ? p.images : p.images ? JSON.parse(p.images) : p.image_url ? [p.image_url] : [],
    retailValue: Number(p.retail_value ?? p.retailValue ?? 0),
    description: p.description ?? '',
    linkedAuctionId: p.linked_auction_id ?? p.linkedAuctionId ?? undefined,
    linkedAuctionStatus: p.linked_auction_status ?? p.linkedAuctionStatus ?? undefined,
    createdAt: p.created_at ?? p.createdAt ?? new Date().toISOString().split('T')[0],
  };
}

function apiToAuction(a: any): Auction {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? '',
    image: a.image_url ?? a.image ?? a.imageUrl ?? '',
    retailValue: Number(a.retail_value ?? a.retailValue ?? 0),
    category: a.category,
    status: a.status,
    startTime: a.start_time ?? a.startTime ?? '',
    endTime: a.end_time ?? a.endTime ?? '',
    minBid: Number(a.min_bid ?? a.minBid ?? 1),
    maxBid: Number(a.max_bid ?? a.maxBid ?? 500),
    totalParticipants: Number(a.total_participants ?? a.totalParticipants ?? 0),
    totalBids: Number(a.total_bids ?? a.totalBids ?? 0),
    productId: a.product_id ?? a.productId ?? undefined,
  };
}

function apiToBid(b: any): Bid {
  return {
    id: b.id,
    auctionId: b.auction_id ?? b.auctionId ?? '',
    bidderId: b.bidder_id ?? b.bidderId ?? '',
    maskedBidderId: b.masked_bidder_id ?? b.maskedBidderId ?? '',
    amount: Number(b.amount ?? 0),
    timestamp: b.created_at ?? b.timestamp ?? new Date().toISOString(),
    isDuplicate: Boolean(b.is_duplicate ?? b.isDuplicate ?? false),
    isLowestUnique: Boolean(b.is_lowest_unique ?? b.isLowestUnique ?? false),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentQueue, setPaymentQueue] = useState<PaymentQueueItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);

  // ── On mount: restore admin session & load live data ─────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    usersApi.me()
      .then(res => setCurrentUserState(apiToUser(res.data)))
      .catch(() => removeToken());

    auctionsApi.list()
      .then(res => setAuctions(res.data.map(apiToAuction)))
      .catch(() => {});

    productsApi.list()
      .then(res => setProducts(res.data.map(apiToProduct)))
      .catch(() => {});

    bidsApi.all()
      .then(res => setBids((res.data || []).map(apiToBid)))
      .catch(() => {});

    usersApi.list()
      .then(res => setUsers(res.data.map(apiToUser)))
      .catch(() => {});

    walletApi.allTransactions()
      .then(res => setTransactions((res.data || []).map((t: any) => ({
        ...t,
        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
        amount: Number(t.amount || 0),
      }))))
      .catch(() => {});

    walletApi.queue()
      .then(res => setPaymentQueue(res.data))
      .catch(() => {});

    notificationsApi.my()
      .then(res => setNotifications(res.data))
      .catch(() => {});

    // Load persistent system settings from backend when available
    (async () => {
      try {
        const res = await (await import('../utils/api')).settingsApi.get();
        if (res && res.data) {
          setSettings(prev => ({ ...prev, ...{
            platformName: res.data.platform_name ?? res.data.platformName ?? prev.platformName,
            supportEmail: res.data.support_email ?? res.data.supportEmail ?? prev.supportEmail,
            currency: res.data.currency ?? prev.currency,
            minBidPrice: Number(res.data.min_bid_price ?? res.data.minBidPrice ?? prev.minBidPrice),
            maxBidPrice: Number(res.data.max_bid_price ?? res.data.maxBidPrice ?? prev.maxBidPrice),
            defaultBidStep: Number(res.data.default_bid_step ?? res.data.defaultBidStep ?? prev.defaultBidStep),
            autoWinnerVerification: res.data.auto_winner_verification ?? res.data.autoWinnerVerification ?? prev.autoWinnerVerification,
            maintenanceMode: res.data.maintenance_mode ?? res.data.maintenanceMode ?? prev.maintenanceMode,
          } }));
        }
      } catch (e) {
        // ignore — continue using defaults
      }
    })();

    auditApi.list()
      .then(res => setAuditLogs(res.data))
      .catch(() => {});
  }, []);

  // Poll current admin profile (to keep admin wallet balance up-to-date in UI)
  useEffect(() => {
    let id: number | undefined;
    async function poll() {
      try {
        const res = await usersApi.me();
        setCurrentUserState(apiToUser(res.data));
      } catch (e) {
        // ignore polling errors
      }
    }
    // Only poll when current user is an admin
    if (currentUser && currentUser.role === 'admin') {
      poll();
      id = window.setInterval(poll, 30000);
    }
    return () => { if (id) window.clearInterval(id); };
  }, [currentUser?.id, currentUser?.role]);

  function setCurrentUser(u: User | null) {
    setCurrentUserState(u);
    if (u) {
      // Reload admin data after login
      auctionsApi.list().then(res => setAuctions(res.data.map(apiToAuction))).catch(() => {});
      productsApi.list().then(res => setProducts(res.data.map(apiToProduct))).catch(() => {});
      bidsApi.all().then(res => setBids((res.data || []).map(apiToBid))).catch(() => {});
      usersApi.list().then(res => setUsers(res.data.map(apiToUser))).catch(() => {});
      walletApi.allTransactions().then(res => setTransactions((res.data || []).map((t: any) => ({
        ...t,
        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
        amount: Number(t.amount || 0),
      })))).catch(() => {});
      walletApi.queue().then(res => setPaymentQueue(res.data)).catch(() => {});
      auditApi.list().then(res => setAuditLogs(res.data)).catch(() => {});
    }
  }

  async function refreshCurrentUser() {
    try {
      const res = await usersApi.me();
      setCurrentUserState(apiToUser(res.data));
    } catch (err) {
      console.error('Failed to refresh current user', err);
    }
  }

  function logout() {
    removeToken();
    setCurrentUserState(null);
  }

  function addAuditLog(action: string, target: string, details: string) {
    const adminName = currentUser?.name || 'System Engine';
    const adminId = currentUser?.id || 'sys';
    const newLog: AuditLog = {
      id: `log${Date.now()}`,
      adminId,
      adminName,
      action,
      target,
      details,
      ipAddress: '197.156.104.12',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }

  function markNotificationRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).catch(() => {});
  }

  function syncProductLink(auction: Auction, previousProductId?: string) {
    setProducts(prev => prev.map(p => {
      if (p.id === auction.productId) {
        return { ...p, linkedAuctionId: auction.id, linkedAuctionStatus: auction.status };
      }
      if (previousProductId && p.id === previousProductId && p.linkedAuctionId === auction.id && previousProductId !== auction.productId) {
        return { ...p, linkedAuctionId: undefined, linkedAuctionStatus: undefined };
      }
      return p;
    }));
  }

  async function createAuction(auctionData: Omit<Auction, 'id' | 'totalParticipants' | 'totalBids'>) {
    try {
      const payload = {
        product_id: auctionData.productId ?? null,
        title: auctionData.title,
        description: auctionData.description,
        image_url: auctionData.image,
        retail_value: auctionData.retailValue,
        category: auctionData.category,
        status: auctionData.status,
        start_time: auctionData.startTime,
        end_time: auctionData.endTime,
        min_bid: auctionData.minBid,
        max_bid: auctionData.maxBid,
      };
      const res = await auctionsApi.create(payload);
      const created = apiToAuction(res.data);
      setAuctions(prev => [created, ...prev]);
      if (created.productId) {
        syncProductLink(created);
      }
      addAuditLog('Created Auction', created.title, `Category: ${created.category}, Retail Value: ${created.retailValue} ETB`);
    } catch (err: any) {
      console.error('Failed to create auction', err?.message || err);
      alert(`Failed to create auction: ${err?.message || err}`);
      throw err;
    }
  }

  async function updateAuction(id: string, updates: Partial<Auction>) {
    try {
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.image !== undefined) payload.image_url = updates.image;
      if (updates.retailValue !== undefined) payload.retail_value = updates.retailValue;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.startTime !== undefined) payload.start_time = updates.startTime;
      if (updates.endTime !== undefined) payload.end_time = updates.endTime;
      if (updates.minBid !== undefined) payload.min_bid = updates.minBid;
      if (updates.maxBid !== undefined) payload.max_bid = updates.maxBid;
      if (updates.productId !== undefined) payload.product_id = updates.productId === '' ? null : updates.productId;

      const before = auctions.find(a => a.id === id);
      const res = await auctionsApi.update(id, payload);
      const updated = apiToAuction(res.data);
      setAuctions(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      if (before) {
        syncProductLink(updated, before.productId ?? undefined);
      }
      addAuditLog('Edited Auction', updated.title, `Updated parameters: ${Object.keys(payload).join(', ')}`);
    } catch (err: any) {
      console.error('Failed to update auction', err?.message || err);
      alert(`Failed to update auction: ${err?.message || err}`);
      throw err;
    }
  }

  async function pauseAuction(id: string) {
    try {
      const res = await auctionsApi.setStatus(id, 'paused');
      const updatedStatus = res.data.status;
      setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: updatedStatus } : a));
      const target = auctions.find(a => a.id === id);
      if (target) {
        syncProductLink({ ...target, status: updatedStatus });
      }
      addAuditLog('Paused Auction', target?.title || id, 'Auction status changed to PAUSED.');
    } catch (err: any) {
      console.error('Failed to pause auction', err?.message || err);
      alert(`Failed to pause auction: ${err?.message || err}`);
      throw err;
    }
  }

  async function resumeAuction(id: string) {
    try {
      const res = await auctionsApi.setStatus(id, 'active');
      const updatedStatus = res.data.status;
      setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: updatedStatus } : a));
      const target = auctions.find(a => a.id === id);
      if (target) {
        syncProductLink({ ...target, status: updatedStatus });
      }
      addAuditLog('Resumed Auction', target?.title || id, 'Auction status changed to ACTIVE.');
    } catch (err: any) {
      console.error('Failed to resume auction', err?.message || err);
      alert(`Failed to resume auction: ${err?.message || err}`);
      throw err;
    }
  }

  async function cancelAuction(id: string) {
    try {
      const res = await auctionsApi.setStatus(id, 'closed');
      const updatedStatus = res.data.status;
      setAuctions(prev => prev.map(a => a.id === id ? { ...a, status: updatedStatus } : a));
      const target = auctions.find(a => a.id === id);
      if (target) {
        syncProductLink({ ...target, status: updatedStatus });
      }
      addAuditLog('Cancelled Auction', target?.title || id, 'Auction cancelled by admin.');
    } catch (err: any) {
      console.error('Failed to cancel auction', err?.message || err);
      alert(`Failed to cancel auction: ${err?.message || err}`);
      throw err;
    }
  }

  async function addProduct(prodData: Omit<Product, 'id' | 'createdAt'>) {
    try {
      const res = await productsApi.create(prodData);
      const created = res.data;
      setProducts(prev => [created, ...prev]);
      addAuditLog('Created Product', created.name, `Retail value: ${Number(created.retail_value ?? created.retailValue ?? created.retailValue)} ETB`);
    } catch (err: any) {
      console.error('Failed to create product', err?.message || err);
      alert(`Failed to create product: ${err?.message || err}`);
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      const res = await productsApi.update(id, updates);
      const updated = res.data;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      addAuditLog('Updated Product', updated.name || id, `Fields updated: ${Object.keys(updates).join(', ')}`);
    } catch (err: any) {
      console.error('Failed to update product', err?.message || err);
      alert(`Failed to update product: ${err?.message || err}`);
    }
  }

  async function deleteProduct(id: string) {
    const target = products.find(p => p.id === id);
    try {
      await productsApi.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      addAuditLog('Deleted Product', target?.name || id, 'Product deleted from inventory catalog.');
    } catch (err: any) {
      console.error('Failed to delete product', err?.message || err);
      alert(`Failed to delete product: ${err?.message || err}`);
    }
  }

  async function toggleUserStatus(userId: string) {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    try {
      await usersApi.updateStatus(userId, nextStatus as 'active' | 'suspended');
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
      addAuditLog(nextStatus === 'suspended' ? 'Suspended User' : 'Activated User', `${target.name} (${userId})`, `Status changed to ${nextStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error('Failed to update user status', err?.message || err);
      alert(`Failed to update user status: ${err?.message || err}`);
    }
  }

  async function deleteUser(userId: string) {
    const target = users.find(u => u.id === userId);
    try {
      await usersApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      addAuditLog('Deleted User Account', `${target?.name} (${userId})`, 'User removed from platform registry.');
    } catch (err: any) {
      console.error('Failed to delete user', err?.message || err);
      if (err?.message?.includes('403') || err?.message?.toLowerCase().includes('forbidden')) {
        alert('Insufficient privileges to delete user. Super-admin required.');
      } else {
        alert(`Failed to delete user: ${err?.message || err}`);
      }
    }
  }

  async function resetUserPassword(userId: string) {
    const target = users.find(u => u.id === userId);
    try {
      const res = await usersApi.resetPassword(userId);
      const temp = res.data?.temp ?? null;
      addAuditLog('Reset Password', `${target?.name} (${userId})`, 'Temporary password issued');
      return temp;
    } catch (err: any) {
      console.error('Failed to reset password', err?.message || err);
      alert(`Failed to reset password: ${err?.message || err}`);
      return null;
    }
  }

  function approvePayment(queueId: string) {
    const item = paymentQueue.find(p => p.id === queueId);
    if (!item) return;
    // Call backend to approve and let server update user and admin balances
    walletApi.approvePayment(queueId)
      .then(() => {
        // Refresh queue, users and transactions
        walletApi.queue().then(res => setPaymentQueue(res.data)).catch(() => {});
        usersApi.list().then(res => setUsers(res.data.map(apiToUser))).catch(() => {});
        walletApi.allTransactions().then(res => setTransactions((res.data || []).map((t: any) => ({ ...t, timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(), amount: Number(t.amount || 0) })))).catch(() => {});
        addAuditLog('Approved Payment', `${item.userName} (${item.referenceNumber})`, `Amount: ${item.amount} ETB, Credits added: ${item.credits}`);
        // Refresh current admin profile so admin wallet balance updates
        refreshCurrentUser();
      })
      .catch(err => {
        console.error('Failed to approve payment', err?.message || err);
        alert(`Failed to approve payment: ${err?.message || err}`);
      });
  }

  function rejectPayment(queueId: string, reason = 'Verification details do not match bank statement') {
    const item = paymentQueue.find(p => p.id === queueId);
    if (!item) return;
    walletApi.rejectPayment(queueId, reason)
      .then(() => {
        walletApi.queue().then(res => setPaymentQueue(res.data)).catch(() => {});
        addAuditLog('Rejected Payment', `${item.userName} (${item.referenceNumber})`, `Reason: ${reason}`);
      })
      .catch(err => {
        console.error('Failed to reject payment', err?.message || err);
        alert(`Failed to reject payment: ${err?.message || err}`);
      });
  }

  async function adjustUserWallet(userId: string, amount: number, reason: string, isCredits = false) {
    try {
      const type = isCredits ? 'credits' : 'wallet';
      const res = await usersApi.adjustWallet(userId, amount, reason, type as 'wallet' | 'credits');
      // Refresh users list and transactions from server to reflect persisted change
      const usersRes = await usersApi.list();
      setUsers(usersRes.data.map(apiToUser));
      const txRes = await walletApi.allTransactions();
      setTransactions((txRes.data || []).map((t: any) => ({
        ...t,
        timestamp: t.timestamp || t.created_at || t.createdAt || new Date().toISOString(),
        amount: Number(t.amount || 0),
      })));
      addAuditLog('Manual Wallet Adjustment', `${res.data.name || userId} (${userId})`, `Adjusted ${amount > 0 ? '+' : ''}${amount} ${type}. Reason: ${reason}`);
      // Refresh current admin profile so admin wallet balance updates
      await refreshCurrentUser();
    } catch (err: any) {
      console.error('Failed to adjust wallet:', err?.message || err);
      alert(`Failed to adjust wallet: ${err?.message || err}`);
    }
  }

  function sendAnnouncement(data: Omit<Announcement, 'id' | 'timestamp' | 'deliveredCount' | 'sentBy'>) {
    const newAnn: Announcement = {
      ...data, id: `ann${Date.now()}`, sentBy: currentUser?.name || 'Admin',
      timestamp: new Date().toISOString(), deliveredCount: users.length,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    addAuditLog('Sent Announcement', data.audience, `Title: "${data.title}" (${data.type})`);
  }

  function updateSystemSettings(newSettings: Partial<SystemSettings>) {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('Updated Settings', 'Platform Core', `Updated parameters: ${Object.keys(newSettings).join(', ')}`);
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, refreshCurrentUser,
      auctions, setAuctions,
      products, setProducts,
      users, setUsers,
      bids, setBids,
      transactions, setTransactions,
      paymentQueue, setPaymentQueue,
      notifications, setNotifications,
      announcements, setAnnouncements,
      auditLogs, setAuditLogs,
      settings, setSettings,
      markNotificationRead,
      logout,
      addAuditLog,
      createAuction,
      updateAuction,
      pauseAuction,
      resumeAuction,
      cancelAuction,
      addProduct,
      updateProduct,
      deleteProduct,
      toggleUserStatus,
      deleteUser,
      resetUserPassword,
      approvePayment,
      rejectPayment,
      adjustUserWallet,
      sendAnnouncement,
      updateSystemSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
