export type AuctionStatus = 'active' | 'upcoming' | 'closed' | 'paused' | 'draft';
export type UserRole = 'admin' | 'customer' | 'moderator';

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

// ── SYSTEM SETTINGS ────────────────────────────────────────────────────────
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

// ── PRODUCTS ───────────────────────────────────────────────────────────────
export const mockProducts: Product[] = [
  {
    id: 'p001',
    name: 'Samsung Galaxy S25 Ultra 5G',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1598300052335-9a3a0f0a5f3b?w=900&h=600&fit=crop'
    ],
    retailValue: 45000,
    description: '256GB Phantom Black, Titanium Frame, 200MP Camera',
    linkedAuctionId: 'a001',
    linkedAuctionStatus: 'active',
    createdAt: '2026-07-01',
  },
  {
    id: 'p002',
    name: 'Apple MacBook Pro 14" M3',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517059224940-d4af9eec41e6?w=900&h=600&fit=crop'
    ],
    retailValue: 120000,
    description: '16GB RAM, 512GB SSD, Space Gray, Liquid Retina XDR',
    linkedAuctionId: 'a002',
    linkedAuctionStatus: 'active',
    createdAt: '2026-07-05',
  },
  {
    id: 'p003',
    name: 'Toyota Corolla 2024 Model',
    category: 'Vehicles',
    images: [
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542365887-1a5d9d4b2f6f?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=600&fit=crop'
    ],
    retailValue: 1200000,
    description: 'Brand new White Pearl, 1.8L Engine, Sunroof, Automatic',
    linkedAuctionId: 'a003',
    linkedAuctionStatus: 'paused',
    createdAt: '2026-07-10',
  },
  {
    id: 'p004',
    name: 'Sony PlayStation 5 Disc Edition',
    category: 'Gaming',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1616449030973-3f3a8b5a5f3b?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a2e6?w=900&h=600&fit=crop'
    ],
    retailValue: 28000,
    description: 'Includes 2 DualSense Controllers & Horizon Forbidden West',
    linkedAuctionId: 'a004',
    linkedAuctionStatus: 'upcoming',
    createdAt: '2026-07-15',
  },
  {
    id: 'p005',
    name: 'iPhone 15 Pro Max 256GB',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1675785931670-9f51e7a2a6e0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&h=600&fit=crop'
    ],
    retailValue: 65000,
    description: 'Natural Titanium, A17 Pro Chip, 5X Telephoto Lens',
    linkedAuctionId: 'a005',
    linkedAuctionStatus: 'closed',
    createdAt: '2026-06-20',
  },
  {
    id: 'p006',
    name: 'LG 65" 4K OLED Smart TV',
    category: 'Home Appliances',
    images: [
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503602642458-232111445657?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&h=600&fit=crop'
    ],
    retailValue: 90000,
    description: 'OLED65C3 Series, Dolby Vision & Atmos, 120Hz Refresh',
    linkedAuctionId: 'a006',
    linkedAuctionStatus: 'closed',
    createdAt: '2026-06-10',
  },
  {
    id: 'p007',
    name: 'Dyson V15 Detect Cordless Vacuum',
    category: 'Home Appliances',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=600&fit=crop'
    ],
    retailValue: 18000,
    description: 'Laser Dust Sensor, 60 min run time, HEPA Filtration',
    linkedAuctionId: 'a007',
    linkedAuctionStatus: 'upcoming',
    createdAt: '2026-07-20',
  },
  {
    id: 'p008',
    name: 'Rolex Submariner Date 41mm',
    category: 'Luxury',
    images: [
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1523362628745-0c100150b1f1?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518544903727-45b00e48a7d6?w=900&h=600&fit=crop'
    ],
    retailValue: 550000,
    description: 'Oystersteel with Black Cerachrom Bezel, Original Warranty',
    linkedAuctionId: 'a008',
    linkedAuctionStatus: 'active',
    createdAt: '2026-07-22',
  },
  {
    id: 'p009',
    name: 'iPad Pro 12.9" M2 1TB Wi-Fi',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1499781350541-7783bdb7bf5f?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=900&h=600&fit=crop'
    ],
    retailValue: 85000,
    description: 'Liquid Retina XDR display, Space Gray, Apple Pencil support',
    createdAt: '2026-07-28',
  },
  {
    id: 'p010',
    name: 'DJI Mavic 3 Pro Drone Combo',
    category: 'Electronics',
    images: [
      'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=900&h=600&fit=crop',
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=900&h=600&fit=crop'
    ],
    retailValue: 140000,
    description: 'Hasselblad Triple Camera, 43 min flight time, RC Pro Remote',
    createdAt: '2026-08-01',
  },
];

// ── USERS ──────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  {
    id: 'u001',
    name: 'Abebe Girma',
    email: 'abebe.girma@bidlow.et',
    phone: '+251 91 234 5678',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    walletBalance: 15000,
    credits: 500,
    status: 'active',
    joinedAt: '2025-01-15',
    wonAuctions: [],
  },
  {
    id: 'u002',
    name: 'Tigist Bekele',
    email: 'tigist.b@gmail.com',
    phone: '+251 92 345 6789',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1250,
    credits: 45,
    status: 'active',
    joinedAt: '2025-02-20',
    wonAuctions: ['a005'],
  },
  {
    id: 'u003',
    name: 'Dawit Haile',
    email: 'dawit.h@yahoo.com',
    phone: '+251 93 456 7890',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 800,
    credits: 12,
    status: 'active',
    joinedAt: '2025-03-10',
    wonAuctions: [],
  },
  {
    id: 'u004',
    name: 'Selamawit Tadesse',
    email: 'selam.t@gmail.com',
    phone: '+251 94 567 8901',
    photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 300,
    credits: 5,
    status: 'suspended',
    joinedAt: '2025-04-05',
    wonAuctions: [],
  },
  {
    id: 'u005',
    name: 'Yohannes Mekonnen',
    email: 'yohannes.m@gmail.com',
    phone: '+251 95 678 9012',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 2100,
    credits: 78,
    status: 'active',
    joinedAt: '2025-05-18',
    wonAuctions: ['a006'],
  },
  {
    id: 'u006',
    name: 'Hiwot Alemu',
    email: 'hiwot.alemu@outlook.com',
    phone: '+251 96 789 0123',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 950,
    credits: 30,
    status: 'active',
    joinedAt: '2025-06-01',
    wonAuctions: [],
  },
  {
    id: 'u007',
    name: 'Bereket Solomon',
    email: 'bereket.s@gmail.com',
    phone: '+251 97 890 1234',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1700,
    credits: 55,
    status: 'active',
    joinedAt: '2025-06-15',
    wonAuctions: [],
  },
  {
    id: 'u008',
    name: 'Mekdes Worku',
    email: 'mekdes.worku@ethio.net',
    phone: '+251 98 901 2345',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 620,
    credits: 18,
    status: 'active',
    joinedAt: '2025-07-02',
    wonAuctions: [],
  },
  {
    id: 'u009',
    name: 'Ephrem Tesfaye',
    email: 'ephrem.t@gmail.com',
    phone: '+251 91 012 3456',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 3200,
    credits: 110,
    status: 'active',
    joinedAt: '2025-07-20',
    wonAuctions: [],
  },
  {
    id: 'u010',
    name: 'Almaz Kebede',
    email: 'almaz.k@gmail.com',
    phone: '+251 92 123 4567',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 480,
    credits: 8,
    status: 'active',
    joinedAt: '2025-08-05',
    wonAuctions: [],
  },
  {
    id: 'u011',
    name: 'Girma Desta',
    email: 'girma.desta@bidlow.et',
    phone: '+251 93 234 5678',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    role: 'moderator',
    walletBalance: 1100,
    credits: 40,
    status: 'active',
    joinedAt: '2025-08-18',
    wonAuctions: [],
  },
  {
    id: 'u012',
    name: 'Rahel Getachew',
    email: 'rahel.g@gmail.com',
    phone: '+251 94 345 6789',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 760,
    credits: 22,
    status: 'active',
    joinedAt: '2025-09-03',
    wonAuctions: [],
  },
  {
    id: 'u013',
    name: 'Tamrat Assefa',
    email: 'tamrat.a@gmail.com',
    phone: '+251 95 456 7890',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 2400,
    credits: 90,
    status: 'active',
    joinedAt: '2025-09-20',
    wonAuctions: [],
  },
  {
    id: 'u014',
    name: 'Frehiwot Mulatu',
    email: 'frehiwot.m@yahoo.com',
    phone: '+251 96 567 8901',
    photo: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 890,
    credits: 27,
    status: 'active',
    joinedAt: '2025-10-08',
    wonAuctions: [],
  },
  {
    id: 'u015',
    name: 'Natnael Berhane',
    email: 'natnael.b@gmail.com',
    phone: '+251 97 678 9012',
    photo: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&h=150&fit=crop&crop=face',
    role: 'customer',
    walletBalance: 1340,
    credits: 48,
    status: 'active',
    joinedAt: '2025-10-25',
    wonAuctions: [],
  },
];

// ── AUCTIONS ───────────────────────────────────────────────────────────────
export const mockAuctions: Auction[] = [
  {
    id: 'a001',
    productId: 'p001',
    title: 'Samsung Galaxy S25 Ultra',
    description: 'Brand new Samsung Galaxy S25 Ultra 256GB, Phantom Black. Includes original accessories and 1-year warranty.',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&h=400&fit=crop',
    retailValue: 45000,
    category: 'Electronics',
    status: 'active',
    startTime: '2026-08-01T08:00:00',
    endTime: '2026-08-10T20:00:00',
    minBid: 1,
    maxBid: 500,
    totalParticipants: 142,
    totalBids: 389,
  },
  {
    id: 'a002',
    productId: 'p002',
    title: 'MacBook Pro 14" M3',
    description: 'Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD. Space Gray. Factory sealed.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',
    retailValue: 120000,
    category: 'Electronics',
    status: 'active',
    startTime: '2026-08-03T10:00:00',
    endTime: '2026-08-12T18:00:00',
    minBid: 1,
    maxBid: 1000,
    totalParticipants: 87,
    totalBids: 203,
  },
  {
    id: 'a003',
    productId: 'p003',
    title: 'Toyota Corolla 2024',
    description: 'Brand new Toyota Corolla 2024, White Pearl, 1.8L engine. Full option package with sunroof.',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop',
    retailValue: 1200000,
    category: 'Vehicles',
    status: 'paused',
    startTime: '2026-08-05T09:00:00',
    endTime: '2026-08-15T21:00:00',
    minBid: 100,
    maxBid: 5000,
    totalParticipants: 312,
    totalBids: 891,
  },
  {
    id: 'a004',
    productId: 'p004',
    title: 'Sony PlayStation 5',
    description: 'PlayStation 5 Disc Edition bundle with 2 controllers and 3 games. Brand new sealed.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=400&fit=crop',
    retailValue: 28000,
    category: 'Gaming',
    status: 'upcoming',
    startTime: '2026-08-12T10:00:00',
    endTime: '2026-08-20T20:00:00',
    minBid: 1,
    maxBid: 300,
    totalParticipants: 0,
    totalBids: 0,
  },
  {
    id: 'a005',
    productId: 'p005',
    title: 'iPhone 15 Pro Max 256GB',
    description: 'Apple iPhone 15 Pro Max 256GB, Natural Titanium. Unlocked, brand new.',
    image: 'https://images.unsplash.com/photo-1675785931670-9f51e7a2a6e0?w=600&h=400&fit=crop',
    retailValue: 65000,
    category: 'Electronics',
    status: 'closed',
    startTime: '2026-07-15T08:00:00',
    endTime: '2026-07-25T20:00:00',
    minBid: 1,
    maxBid: 600,
    totalParticipants: 198,
    totalBids: 512,
    winnerId: 'u002',
    winnerName: 'Tigist Bekele',
    lowestUniqueBid: 7,
    closedAt: '2026-07-25T20:00:00',
  },
  {
    id: 'a006',
    productId: 'p006',
    title: 'LG 65" OLED Smart TV',
    description: 'LG OLED65C3 65-inch 4K OLED TV with ThinQ AI, webOS 23, Dolby Vision & Atmos.',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=400&fit=crop',
    retailValue: 90000,
    category: 'Home Appliances',
    status: 'closed',
    startTime: '2026-07-01T08:00:00',
    endTime: '2026-07-10T20:00:00',
    minBid: 1,
    maxBid: 800,
    totalParticipants: 156,
    totalBids: 423,
    winnerId: 'u005',
    winnerName: 'Yohannes Mekonnen',
    lowestUniqueBid: 13,
    closedAt: '2026-07-10T20:00:00',
  },
  {
    id: 'a007',
    productId: 'p007',
    title: 'Dyson V15 Vacuum',
    description: 'Dyson V15 Detect cordless vacuum cleaner. New generation with laser dust detection.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
    retailValue: 18000,
    category: 'Home Appliances',
    status: 'upcoming',
    startTime: '2026-08-14T09:00:00',
    endTime: '2026-08-22T21:00:00',
    minBid: 1,
    maxBid: 200,
    totalParticipants: 0,
    totalBids: 0,
  },
  {
    id: 'a008',
    productId: 'p008',
    title: 'Rolex Submariner Watch',
    description: 'Rolex Submariner Date 41mm, Oystersteel, Black dial. Complete with original box and papers.',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=400&fit=crop',
    retailValue: 550000,
    category: 'Luxury',
    status: 'active',
    startTime: '2026-08-06T12:00:00',
    endTime: '2026-08-16T12:00:00',
    minBid: 50,
    maxBid: 4000,
    totalParticipants: 67,
    totalBids: 145,
  },
  {
    id: 'a009',
    productId: 'p009',
    title: 'iPad Pro 12.9" M2',
    description: 'Apple iPad Pro 12.9" M2 Chip, 1TB Storage, Liquid Retina XDR display.',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=400&fit=crop',
    retailValue: 85000,
    category: 'Electronics',
    status: 'upcoming',
    startTime: '2026-08-18T10:00:00',
    endTime: '2026-08-28T20:00:00',
    minBid: 5,
    maxBid: 800,
    totalParticipants: 0,
    totalBids: 0,
  },
  {
    id: 'a010',
    productId: 'p010',
    title: 'DJI Mavic 3 Drone',
    description: 'DJI Mavic 3 Pro Drone Fly More Combo with Hasselblad camera system.',
    image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&h=400&fit=crop',
    retailValue: 140000,
    category: 'Electronics',
    status: 'draft',
    startTime: '2026-09-01T08:00:00',
    endTime: '2026-09-10T20:00:00',
    minBid: 10,
    maxBid: 1200,
    totalParticipants: 0,
    totalBids: 0,
  },
];

// ── BIDS for closed auction a005 (iPhone 15 Pro Max) ─────────────────────
export const mockBidsA005: Bid[] = [
  { id: 'b001', auctionId: 'a005', bidderId: 'u002', maskedBidderId: 'BDR-4821', amount: 7,   timestamp: '2026-07-20T08:12:33', isDuplicate: false, isLowestUnique: true },
  { id: 'b002', auctionId: 'a005', bidderId: 'u003', maskedBidderId: 'BDR-7743', amount: 5,   timestamp: '2026-07-20T08:45:12', isDuplicate: true },
  { id: 'b003', auctionId: 'a005', bidderId: 'u004', maskedBidderId: 'BDR-2291', amount: 5,   timestamp: '2026-07-20T09:03:44', isDuplicate: true },
  { id: 'b004', auctionId: 'a005', bidderId: 'u005', maskedBidderId: 'BDR-9934', amount: 12,  timestamp: '2026-07-20T09:22:01', isDuplicate: true },
  { id: 'b005', auctionId: 'a005', bidderId: 'u006', maskedBidderId: 'BDR-6612', amount: 12,  timestamp: '2026-07-20T10:05:00', isDuplicate: true },
  { id: 'b006', auctionId: 'a005', bidderId: 'u007', maskedBidderId: 'BDR-3377', amount: 3,   timestamp: '2026-07-20T10:44:21', isDuplicate: true },
  { id: 'b007', auctionId: 'a005', bidderId: 'u008', maskedBidderId: 'BDR-8812', amount: 3,   timestamp: '2026-07-21T07:11:09', isDuplicate: true },
  { id: 'b008', auctionId: 'a005', bidderId: 'u009', maskedBidderId: 'BDR-9901', amount: 20,  timestamp: '2026-07-21T08:00:00', isDuplicate: true },
  { id: 'b009', auctionId: 'a005', bidderId: 'u010', maskedBidderId: 'BDR-1045', amount: 20,  timestamp: '2026-07-21T08:33:44', isDuplicate: true },
  { id: 'b010', auctionId: 'a005', bidderId: 'u011', maskedBidderId: 'BDR-5521', amount: 35,  timestamp: '2026-07-21T09:15:00', isDuplicate: true },
  { id: 'b011', auctionId: 'a005', bidderId: 'u012', maskedBidderId: 'BDR-2230', amount: 35,  timestamp: '2026-07-21T09:55:10', isDuplicate: true },
  { id: 'b012', auctionId: 'a005', bidderId: 'u013', maskedBidderId: 'BDR-7780', amount: 50,  timestamp: '2026-07-21T10:40:22', isDuplicate: true },
  { id: 'b013', auctionId: 'a005', bidderId: 'u014', maskedBidderId: 'BDR-4490', amount: 50,  timestamp: '2026-07-21T11:10:55', isDuplicate: true },
  { id: 'b014', auctionId: 'a005', bidderId: 'u015', maskedBidderId: 'BDR-6634', amount: 18,  timestamp: '2026-07-22T07:45:33', isDuplicate: false },
  { id: 'b015', auctionId: 'a005', bidderId: 'u016', maskedBidderId: 'BDR-3301', amount: 25,  timestamp: '2026-07-22T08:20:00', isDuplicate: false },
  { id: 'b016', auctionId: 'a005', bidderId: 'u003', maskedBidderId: 'BDR-7743', amount: 45,  timestamp: '2026-07-22T09:05:44', isDuplicate: false },
  { id: 'b017', auctionId: 'a005', bidderId: 'u004', maskedBidderId: 'BDR-2291', amount: 60,  timestamp: '2026-07-22T09:50:11', isDuplicate: true },
  { id: 'b018', auctionId: 'a005', bidderId: 'u005', maskedBidderId: 'BDR-9934', amount: 60,  timestamp: '2026-07-22T10:30:05', isDuplicate: true },
  { id: 'b019', auctionId: 'a005', bidderId: 'u006', maskedBidderId: 'BDR-6612', amount: 75,  timestamp: '2026-07-23T07:00:00', isDuplicate: true },
  { id: 'b020', auctionId: 'a005', bidderId: 'u007', maskedBidderId: 'BDR-3377', amount: 75,  timestamp: '2026-07-23T07:45:22', isDuplicate: true },
  { id: 'b021', auctionId: 'a005', bidderId: 'u008', maskedBidderId: 'BDR-8812', amount: 100, timestamp: '2026-07-23T08:10:15', isDuplicate: true },
  { id: 'b022', auctionId: 'a005', bidderId: 'u009', maskedBidderId: 'BDR-9901', amount: 100, timestamp: '2026-07-23T09:00:00', isDuplicate: true },
  { id: 'b023', auctionId: 'a005', bidderId: 'u010', maskedBidderId: 'BDR-1045', amount: 120, timestamp: '2026-07-24T07:20:30', isDuplicate: false },
  { id: 'b024', auctionId: 'a005', bidderId: 'u011', maskedBidderId: 'BDR-5521', amount: 85,  timestamp: '2026-07-24T08:05:00', isDuplicate: false },
  { id: 'b025', auctionId: 'a005', bidderId: 'u012', maskedBidderId: 'BDR-2230', amount: 140, timestamp: '2026-07-24T09:30:55', isDuplicate: false },
];

// ── BIDS for closed auction a006 (LG 65" OLED TV) ────────────────────────
export const mockBidsA006: Bid[] = [
  { id: 'b101', auctionId: 'a006', bidderId: 'u005', maskedBidderId: 'BDR-9934', amount: 13, timestamp: '2026-07-02T10:11:00', isDuplicate: false, isLowestUnique: true },
  { id: 'b102', auctionId: 'a006', bidderId: 'u002', maskedBidderId: 'BDR-4821', amount: 4,  timestamp: '2026-07-02T10:30:00', isDuplicate: true },
  { id: 'b103', auctionId: 'a006', bidderId: 'u003', maskedBidderId: 'BDR-7743', amount: 4,  timestamp: '2026-07-02T11:05:12', isDuplicate: true },
  { id: 'b104', auctionId: 'a006', bidderId: 'u007', maskedBidderId: 'BDR-3377', amount: 9,  timestamp: '2026-07-03T09:12:00', isDuplicate: true },
  { id: 'b105', auctionId: 'a006', bidderId: 'u008', maskedBidderId: 'BDR-8812', amount: 9,  timestamp: '2026-07-03T09:44:00', isDuplicate: true },
  { id: 'b106', auctionId: 'a006', bidderId: 'u009', maskedBidderId: 'BDR-9901', amount: 22, timestamp: '2026-07-04T08:15:00', isDuplicate: false },
  { id: 'b107', auctionId: 'a006', bidderId: 'u010', maskedBidderId: 'BDR-1045', amount: 40, timestamp: '2026-07-04T10:20:00', isDuplicate: false },
];

// ── TRANSACTIONS ───────────────────────────────────────────────────────────
export const mockTransactions: Transaction[] = [
  { id: 't001', userId: 'u002', userName: 'Tigist Bekele', type: 'credit_purchase', amount: 500, description: 'Purchased 50 credits package via Telebirr', timestamp: '2026-08-08T10:00:00', status: 'completed', paymentMethod: 'Telebirr' },
  { id: 't002', userId: 'u002', userName: 'Tigist Bekele', type: 'bid_placed', amount: -10, description: 'Bid placed on Samsung Galaxy S25 Ultra', timestamp: '2026-08-08T09:12:33', status: 'completed' },
  { id: 't003', userId: 'u003', userName: 'Dawit Haile', type: 'credit_purchase', amount: 100, description: 'Purchased 10 credits package via CBE Birr', timestamp: '2026-08-07T14:30:00', status: 'completed', paymentMethod: 'CBE Birr' },
  { id: 't004', userId: 'u005', userName: 'Yohannes Mekonnen', type: 'winning_reward', amount: 90000, description: 'Won LG 65" OLED TV auction', timestamp: '2026-07-10T22:00:00', status: 'completed' },
  { id: 't005', userId: 'u009', userName: 'Ephrem Tesfaye', type: 'credit_purchase', amount: 1800, description: 'Purchased 250 credits package via Chapa', timestamp: '2026-08-06T16:20:00', status: 'completed', paymentMethod: 'Chapa' },
  { id: 't006', userId: 'u007', userName: 'Bereket Solomon', type: 'manual_adjustment', amount: 200, description: 'Admin adjustment: Complimentary promo credit', timestamp: '2026-08-05T11:00:00', status: 'completed' },
  { id: 't007', userId: 'u004', userName: 'Selamawit Tadesse', type: 'refund', amount: 300, description: 'Refund for cancelled bid pool on product #p003', timestamp: '2026-08-04T09:15:00', status: 'completed' },
  { id: 't008', userId: 'u013', userName: 'Tamrat Assefa', type: 'credit_purchase', amount: 800, description: 'Purchased 100 credits package via Bank Transfer', timestamp: '2026-08-03T11:45:00', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: 't009', userId: 'u015', userName: 'Natnael Berhane', type: 'credit_purchase', amount: 450, description: 'Purchased 50 credits package via Telebirr', timestamp: '2026-08-02T15:10:00', status: 'completed', paymentMethod: 'Telebirr' },
  { id: 't010', userId: 'u006', userName: 'Hiwot Alemu', type: 'bid_placed', amount: -10, description: 'Bid placed on Rolex Submariner', timestamp: '2026-08-01T18:00:00', status: 'completed' },
];

// ── PAYMENT VERIFICATION QUEUE ─────────────────────────────────────────────
export const mockPaymentQueue: PaymentQueueItem[] = [
  {
    id: 'pq001',
    userId: 'u008',
    userName: 'Mekdes Worku',
    userEmail: 'mekdes.worku@ethio.net',
    amount: 450,
    credits: 50,
    paymentMethod: 'Telebirr',
    referenceNumber: 'TEL-892341092',
    receiptImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    timestamp: '2026-08-08T19:30:00',
    status: 'pending',
    notes: 'Telebirr confirmation SMS screenshot submitted',
  },
  {
    id: 'pq002',
    userId: 'u012',
    userName: 'Rahel Getachew',
    userEmail: 'rahel.g@gmail.com',
    amount: 1800,
    credits: 250,
    paymentMethod: 'CBE Birr',
    referenceNumber: 'CBE-771203491',
    receiptImage: 'https://images.unsplash.com/photo-1556742049-0a67daf4095a?w=400&h=300&fit=crop',
    timestamp: '2026-08-08T18:45:00',
    status: 'pending',
    notes: 'Direct bank transfer receipt uploaded',
  },
  {
    id: 'pq003',
    userId: 'u014',
    userName: 'Frehiwot Mulatu',
    userEmail: 'frehiwot.m@yahoo.com',
    amount: 800,
    credits: 100,
    paymentMethod: 'Bank Transfer',
    referenceNumber: 'FT260808991',
    receiptImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    timestamp: '2026-08-08T17:15:00',
    status: 'pending',
    notes: 'Commercial Bank of Ethiopia slip copy',
  },
  {
    id: 'pq004',
    userId: 'u010',
    userName: 'Almaz Kebede',
    userEmail: 'almaz.k@gmail.com',
    amount: 100,
    credits: 10,
    paymentMethod: 'Telebirr',
    referenceNumber: 'TEL-102938475',
    receiptImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop',
    timestamp: '2026-08-07T10:00:00',
    status: 'approved',
    notes: 'Approved by Abebe Girma',
  },
];

// ── ANNOUNCEMENTS / NOTIFICATIONS HISTORY ──────────────────────────────────
export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann001',
    title: 'Platform Maintenance Notice',
    message: 'We will be conducting brief database optimization on Sunday at 2:00 AM EAT. Bidding will remain paused for 30 minutes.',
    audience: 'All Users',
    type: 'Maintenance Notice',
    sentBy: 'Abebe Girma',
    timestamp: '2026-08-07T12:00:00',
    deliveredCount: 15,
  },
  {
    id: 'ann002',
    title: 'New Luxury Category Launched! ⌚',
    message: 'Check out our new Luxury watch auctions featuring authentic Rolex and Omega timepieces.',
    audience: 'Customers Only',
    type: 'Promotion',
    sentBy: 'Abebe Girma',
    timestamp: '2026-08-05T09:30:00',
    deliveredCount: 14,
  },
  {
    id: 'ann003',
    title: 'Automated Winner Verification Standard v2.4 Enabled',
    message: 'All auction payouts are now verified with multi-layered duplicate detection & cryptographic audit logging.',
    audience: 'All Users',
    type: 'Platform Update',
    sentBy: 'System Engine',
    timestamp: '2026-08-01T08:00:00',
    deliveredCount: 15,
  },
  {
    id: 'ann004',
    title: 'Toyota Corolla Auction Bidding Guidelines',
    message: 'Important notice to all participants bidding on Vehicle auctions: ensure wallet balance covers registration verification.',
    audience: 'Active Auction Bidders',
    type: 'System Alert',
    sentBy: 'Abebe Girma',
    timestamp: '2026-07-28T14:15:00',
    deliveredCount: 8,
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n001',
    userId: 'u002',
    type: 'winner_announced',
    title: 'Winner Verified & Declared! 🎉',
    message: 'Congratulations! You won the iPhone 15 Pro Max auction with a lowest unique bid of 7 ETB.',
    read: false,
    timestamp: '2026-07-25T22:00:00',
  },
  {
    id: 'n002',
    userId: 'u002',
    type: 'auction_ending',
    title: 'Auction Ending Soon',
    message: 'Samsung Galaxy S25 Ultra auction ends in 2 hours. Submit your unique bids!',
    read: false,
    timestamp: '2026-08-08T18:00:00',
  },
  {
    id: 'n003',
    userId: 'u008',
    type: 'payment_received',
    title: 'Payment Verification Received',
    message: 'Your payment submission of 450 ETB via Telebirr (Ref: TEL-892341092) is under review.',
    read: true,
    timestamp: '2026-08-08T19:31:00',
  },
];

// ── AUDIT LOGS ─────────────────────────────────────────────────────────────
export const mockAuditLogs: AuditLog[] = [
  { id: 'log015', adminId: 'u001', adminName: 'Abebe Girma', action: 'Approved Payment', target: 'Almaz Kebede (u010)', details: 'Approved 100 ETB Telebirr deposit (Ref: TEL-102938475)', ipAddress: '197.156.104.12', timestamp: '2026-08-08T20:10:00' },
  { id: 'log014', adminId: 'u001', adminName: 'Abebe Girma', action: 'Paused Auction', target: 'Toyota Corolla 2024 (a003)', details: 'Paused auction pending verification of vehicle documentation', ipAddress: '197.156.104.12', timestamp: '2026-08-08T16:45:00' },
  { id: 'log013', adminId: 'u001', adminName: 'Abebe Girma', action: 'Updated Settings', target: 'Platform Core', details: 'Changed default min bid limit to 1 ETB', ipAddress: '197.156.104.12', timestamp: '2026-08-08T11:20:00' },
  { id: 'log012', adminId: 'u001', adminName: 'Abebe Girma', action: 'Sent Announcement', target: 'All Users', details: 'Broadcasted title: "Platform Maintenance Notice"', ipAddress: '197.156.104.12', timestamp: '2026-08-07T12:00:00' },
  { id: 'log011', adminId: 'u001', adminName: 'Abebe Girma', action: 'Edited Auction', target: 'Rolex Submariner Watch (a008)', details: 'Adjusted max bid ceiling to 4000 ETB', ipAddress: '197.156.104.12', timestamp: '2026-08-06T10:15:00' },
  { id: 'log010', adminId: 'u001', adminName: 'Abebe Girma', action: 'Manual Wallet Adjustment', target: 'Bereket Solomon (u007)', details: 'Credited +200 ETB bonus credits (Reason: Promotional bonus)', ipAddress: '197.156.104.12', timestamp: '2026-08-05T11:00:00' },
  { id: 'log009', adminId: 'u001', adminName: 'Abebe Girma', action: 'Suspended User', target: 'Selamawit Tadesse (u004)', details: 'Flagged for multiple payment verification failures', ipAddress: '197.156.104.12', timestamp: '2026-08-04T14:22:00' },
  { id: 'log008', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Product', target: 'DJI Mavic 3 Pro Drone (p010)', details: 'Added new product entry under Electronics category', ipAddress: '197.156.104.12', timestamp: '2026-08-01T08:00:00' },
  { id: 'log007', adminId: 'u001', adminName: 'Abebe Girma', action: 'Published Auction', target: 'MacBook Pro 14" M3 (a002)', details: 'Published live auction with start time 2026-08-03T10:00', ipAddress: '197.156.104.12', timestamp: '2026-08-03T09:50:00' },
  { id: 'log006', adminId: 'u001', adminName: 'System Engine', action: 'Automated Winner Verified', target: 'iPhone 15 Pro Max (a005)', details: 'System computed winner Tigist Bekele (u002) with lowest unique bid of 7 ETB', ipAddress: '127.0.0.1 (INTERNAL)', timestamp: '2026-07-25T20:00:01' },
  { id: 'log005', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Auction', target: 'Samsung Galaxy S25 Ultra (a001)', details: 'Created auction schedule for S25 Ultra', ipAddress: '197.156.104.12', timestamp: '2026-07-30T09:00:00' },
  { id: 'log004', adminId: 'u001', adminName: 'System Engine', action: 'Automated Winner Verified', target: 'LG 65" OLED Smart TV (a006)', details: 'System computed winner Yohannes Mekonnen (u005) with lowest unique bid of 13 ETB', ipAddress: '127.0.0.1 (INTERNAL)', timestamp: '2026-07-10T20:00:01' },
  { id: 'log003', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Product', target: 'Rolex Submariner Watch (p008)', details: 'Added new product under Luxury category', ipAddress: '197.156.104.12', timestamp: '2026-07-22T09:00:00' },
  { id: 'log002', adminId: 'u001', adminName: 'Abebe Girma', action: 'Created Product', target: 'iPhone 15 Pro Max (p005)', details: 'Added product for auction seed', ipAddress: '197.156.104.12', timestamp: '2026-06-20T10:00:00' },
  { id: 'log001', adminId: 'u001', adminName: 'Abebe Girma', action: 'System Initialization', target: 'BidLow Platform Core', details: 'Initialized production environment and security roles', ipAddress: '197.156.104.12', timestamp: '2025-01-15T08:00:00' },
];

// ── REPORT DATASETS ────────────────────────────────────────────────────────
export const revenueData = [
  { month: 'Feb 2026', revenue: 14500, deposits: 18000, refunds: 3500 },
  { month: 'Mar 2026', revenue: 22400, deposits: 26000, refunds: 3600 },
  { month: 'Apr 2026', revenue: 19800, deposits: 22000, refunds: 2200 },
  { month: 'May 2026', revenue: 31500, deposits: 35000, refunds: 3500 },
  { month: 'Jun 2026', revenue: 38200, deposits: 42000, refunds: 3800 },
  { month: 'Jul 2026', revenue: 49000, deposits: 54000, refunds: 5000 },
  { month: 'Aug 2026', revenue: 28400, deposits: 31000, refunds: 2600 },
];

export const userActivityData = [
  { month: 'Feb', newUsers: 14, activeBidders: 52, totalBids: 840 },
  { month: 'Mar', newUsers: 32, activeBidders: 98, totalBids: 1450 },
  { month: 'Apr', newUsers: 24, activeBidders: 81, totalBids: 1210 },
  { month: 'May', newUsers: 51, activeBidders: 146, totalBids: 2300 },
  { month: 'Jun', newUsers: 42, activeBidders: 175, totalBids: 2980 },
  { month: 'Jul', newUsers: 68, activeBidders: 230, totalBids: 4120 },
  { month: 'Aug', newUsers: 35, activeBidders: 162, totalBids: 2560 },
];

export const categoryPerformanceData = [
  { category: 'Electronics', categoryShort: 'Electronics', auctions: 5, totalBids: 1527, revenue: 165000 },
  { category: 'Vehicles', categoryShort: 'Vehicles', auctions: 1, totalBids: 891, revenue: 120000 },
  { category: 'Luxury', categoryShort: 'Luxury', auctions: 1, totalBids: 145, revenue: 45000 },
  { category: 'Home Appliances', categoryShort: 'Home', auctions: 2, totalBids: 423, revenue: 28000 },
  { category: 'Gaming', categoryShort: 'Gaming', auctions: 1, totalBids: 0, revenue: 0 },
];

export const paymentMethodsData = [
  { name: 'Telebirr', value: 45, color: '#0072CE' },
  { name: 'CBE Birr', value: 30, color: '#8C1D40' },
  { name: 'Bank Transfer', value: 15, color: '#008080' },
  { name: 'Chapa Gateway', value: 10, color: '#16A34A' },
];

export const winnerStatsData = [
  { name: 'Unique Bid Success Rate', rate: 98.4 },
  { name: 'Avg Savings vs Retail', rate: 92.1 },
  { name: 'Avg Bids Per Winner', rate: 14.2 },
];
