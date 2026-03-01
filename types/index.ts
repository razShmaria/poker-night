export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  date: string;
  buy_in_amount: number;
  chip_ratio: number;
  host_cost: number | null;
  created_by: string;
  status: "active" | "completed";
  created_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_id: string;
  total_buy_ins: number;
  final_chips: number | null;
  created_at: string;
}

export interface SessionPlayerWithProfile extends SessionPlayer {
  profile: Profile;
}

export interface Settlement {
  id: string;
  session_id: string;
  from_player: string;
  to_player: string;
  amount: number;
  created_at: string;
}

export interface SettlementWithProfiles extends Settlement {
  from_profile: Profile;
  to_profile: Profile;
}

export interface SessionWithDetails extends Session {
  session_players: SessionPlayerWithProfile[];
  settlements: SettlementWithProfiles[];
}

export interface PlayerBalance {
  playerId: string;
  name: string;
  avatarUrl: string | null;
  totalSpent: number;
  finalChipsWorth: number;
  netBalance: number;
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}
