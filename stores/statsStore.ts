import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface PlayerStats {
  profileId: string;
  name: string;
  avatarUrl: string | null;
  sessionsPlayed: number;
  totalProfit: number;
  biggestWin: number;
  biggestLoss: number;
}

interface StatsState {
  myStats: PlayerStats | null;
  loading: boolean;
  fetchMyStats: (userId: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  myStats: null,
  loading: false,

  fetchMyStats: async (userId: string) => {
    set({ loading: true });

    const { data: sessions } = await supabase
      .from("sessions")
      .select(`
        id, buy_in_amount, chip_ratio, status,
        session_players!inner(player_id, total_buy_ins, final_chips)
      `)
      .eq("session_players.player_id", userId)
      .eq("status", "completed");

    if (!sessions) {
      set({ loading: false });
      return;
    }

    let totalProfit = 0;
    let biggestWin = 0;
    let biggestLoss = 0;

    for (const session of sessions) {
      const sp = (session.session_players as Array<{ player_id: string; total_buy_ins: number; final_chips: number | null }>)
        .find((p) => p.player_id === userId);
      if (!sp || sp.final_chips === null) continue;

      const chipValue = session.buy_in_amount / session.chip_ratio;
      const spent = sp.total_buy_ins * session.buy_in_amount;
      const won = sp.final_chips * chipValue;
      const net = won - spent;

      totalProfit += net;
      if (net > biggestWin) biggestWin = net;
      if (net < biggestLoss) biggestLoss = net;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", userId)
      .single();

    set({
      myStats: {
        profileId: userId,
        name: profile?.name ?? "שחקן",
        avatarUrl: profile?.avatar_url ?? null,
        sessionsPlayed: sessions.length,
        totalProfit,
        biggestWin,
        biggestLoss,
      },
      loading: false,
    });
  },
}));
