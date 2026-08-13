// ── Type & Interface Definitions ──────────────────────────────────────────────
// Sample data has been removed. All data is fetched from the live API.

export type AuctionStatus = 'active' | 'upcoming' | 'closed' | 'paused' | 'draft';
export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  photo?: string;
  role: UserRole;
  walletBalance: number;
  credits: number;
  status: 'active' | 'suspended';
  joinedAt: string;
  wonAuctions: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  images: string[];
  retailValue: number;
  description: string;
  linkedAuctionId?: string;
  linkedAuctionStatus?: AuctionStatus;
  createdAt: string;
}

export interface Auction {
  id: string;
  productId?: string;
  title: string;
  description: string;
  image: string;
  retailValue: number;
  bidPerCost?: number;
  category: string;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  minBid: number;
  maxBid: number;
  totalParticipants: number;
  totalBids: number;
  winnerId?: string;
  winnerName?: string;
  lowestUniqueBid?: number;
  closedAt?: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  maskedBidderId: string;
  amount: number;
  timestamp: string;
  isDuplicate?: boolean;
  isLowestUnique?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'credit_purchase' | 'bid_placed' | 'refund' | 'winning_reward' | 'manual_adjustment';
  amount: number;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
}

export interface PaymentQueueItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  credits: number;
  paymentMethod: 'Telebirr' | 'CBE Birr' | 'Bank Transfer' | 'Chapa';
  referenceNumber: string;
  receiptImage: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'auction_started' | 'auction_ending' | 'winner_announced' | 'payment_received' | 'wallet_updated' | 'system';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'All Users' | 'Customers Only' | 'Admins Only' | 'Active Auction Bidders';
  type: 'System Alert' | 'Promotion' | 'Platform Update' | 'Maintenance Notice';
  sentBy: string;
  timestamp: string;
  deliveredCount: number;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  currency: string;
  minBidPrice: number;
  maxBidPrice: number;
  defaultBidStep: number;
  autoWinnerVerification: boolean;
  maintenanceMode: boolean;
}

// Default settings — overridden at runtime by /api/settings
export const initialSettings: SystemSettings = {
  platformName: 'BidLow Transparent Auctions',
  supportEmail: 'admin@bidlow.et',
  currency: 'ETB',
  minBidPrice: 1,
  maxBidPrice: 5000,
  defaultBidStep: 1,
  autoWinnerVerification: true,
  maintenanceMode: false,
};
