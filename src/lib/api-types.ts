// Raw response from Hiro ordinals API
export type HiroApiResponse = {
  limit: number;
  offset: number;
  total: number;
  results: HiroApiInscription[];
};

export type HiroApiInscription = {
  id: string;
  number: number;
  address: string;
  genesis_address: string;
  genesis_block_height: number;
  genesis_block_hash: string;
  genesis_tx_id: string;
  genesis_fee: string;
  genesis_timestamp: number;
  tx_id: string;
  location: string;
  output: string;
  value: string;
  offset: string;
  sat_ordinal: string;
  sat_rarity: string;
  sat_coinbase_height: number;
  mime_type: string;
  content_type: string;
  content_length: number;
  timestamp: number;
};

// Metadata for inscription stored in KV
export type InscriptionMeta = {
  id: string;
  number: number;
  address: string;
  content_type: string;
  content_length: number;
  genesis_block_height: number;
  genesis_tx_id: string;
  timestamp: string;
  last_updated: string;
  news_number?: number;
  news_author?: string;
};

// News standard schema (p=ons)
export type OrdinalNews = {
  p: 'ons';
  op: 'post' | 'reply' | 'repost';
  title: string;
  url?: string;
  body?: string;
  author?: string;
  authorAddress?: string;
  signature?: string;
};

// Combined news item with metadata (used internally for display)
export type NewsItem = {
  meta: InscriptionMeta;
  news: OrdinalNews;
};

// API response for /api/data/ord-news (list endpoint)
export type NewsListResponse = {
  list_complete: boolean;
  keys: {
    name: string;
    metadata: InscriptionMeta;
  }[];
};

// API response for /api/data/{id} (single item - flat structure)
export type NewsDataResponse = InscriptionMeta & OrdinalNews;
