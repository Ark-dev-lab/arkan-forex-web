export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  demoBalance: number;
  realBalance: number;
  role: 'user' | 'admin';
  createdAt: any; // Timestamp
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'forex' | 'crypto' | 'commodity';
}

export interface Trade {
  id?: string;
  userId: string;
  pair: string;
  type: 'BUY' | 'SELL';
  orderType?: 'MARKET' | 'LIMIT';
  limitPrice?: number;
  entryPrice: number;
  exitPrice?: number;
  lots: number;
  profit?: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  openedAt: any; // Timestamp
  closedAt?: any; // Timestamp
  accountType?: 'demo' | 'real';
  slPrice?: number;
  tpPrice?: number;
  highestPrice?: number;
  lowestPrice?: number;
}

export interface BotSettings {
  userId: string;
  isActive: boolean;
  maxRiskPerTrade: number;
  defaultSLPips: number;
  defaultTPPips: number;
  useTrailingStop: boolean;
  trailingStopPips?: number;
  updatedAt: any; // Timestamp
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}
