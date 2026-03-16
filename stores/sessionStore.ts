import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type {
  Session,
  SessionPlayer,
  SessionPlayerWithProfile,
  SettlementWithProfiles,
  SessionWithDetails,
} from "../types";
import type { Transfer } from "../types";

interface SessionState {
  // Active game
  activeSession: Session | null;
  sessionPlayers: SessionPlayerWithProfile[];

  // History
  sessions: SessionWithDetails[];

  // UI state
  loading: boolean;
  error: string | null;

  // Actions
  fetchActiveSession: () => Promise<void>;
  fetchSessionPlayers: (sessionId: string) => Promise<void>;
  fetchSessions: (userId: string) => Promise<void>;
  fetchSessionById: (id: string) => Promise<SessionWithDetails | null>;

  createSession: (data: {
    date: string;
    buy_in_amount: number;
    chip_ratio: number;
    host_cost?: number;
    created_by: string;
  }) => Promise<Session | null>;

  addPlayerToSession: (sessionId: string, playerId: string) => Promise<boolean>;
  removePlayerFromSession: (sessionPlayerId: string) => Promise<void>;
  addBuyIn: (sessionPlayerId: string) => Promise<void>;
  removeBuyIn: (sessionPlayerId: string) => Promise<void>;
  setFinalChips: (sessionPlayerId: string, chips: number) => Promise<void>;

  saveSettlements: (sessionId: string, transfers: Transfer[]) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  setError: (error: string | null) => void;
  clearActiveSession: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  sessionPlayers: [],
  sessions: [],
  loading: false,
  error: null,

  setError: (error) => set({ error }),
  clearActiveSession: () => set({ activeSession: null, sessionPlayers: [] }),

  fetchActiveSession: async () => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      set({ error: error.message, loading: false });
      return;
    }

    if (data) {
      set({ activeSession: data as Session });
      await get().fetchSessionPlayers(data.id);
    } else {
      set({ activeSession: null, sessionPlayers: [] });
    }
    set({ loading: false });
  },

  fetchSessionPlayers: async (sessionId: string) => {
    const { data, error } = await supabase
      .from("session_players")
      .select("*, profile:profiles(*)")
      .eq("session_id", sessionId)
      .order("created_at");

    if (!error && data) {
      set({ sessionPlayers: data as SessionPlayerWithProfile[] });
    }
  },

  fetchSessions: async (userId: string) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        session_players(*, profile:profiles(*)),
        settlements(*, from_profile:profiles!settlements_from_player_fkey(*), to_profile:profiles!settlements_to_player_fkey(*))
      `)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      set({ error: error.message });
    } else {
      set({ sessions: (data ?? []) as SessionWithDetails[] });
    }
    set({ loading: false });
  },

  fetchSessionById: async (id: string) => {
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        session_players(*, profile:profiles(*)),
        settlements(*, from_profile:profiles!settlements_from_player_fkey(*), to_profile:profiles!settlements_to_player_fkey(*))
      `)
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as SessionWithDetails;
  },

  createSession: async (sessionData) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("sessions")
      .insert({ ...sessionData, status: "active" })
      .select()
      .single();

    if (error) {
      set({ error: error.message, loading: false });
      return null;
    }

    set({ activeSession: data as Session, loading: false });
    return data as Session;
  },

  addPlayerToSession: async (sessionId: string, playerId: string) => {
    // Check if already added
    const existing = get().sessionPlayers.find((p) => p.player_id === playerId);
    if (existing) return false;

    const { error } = await supabase.from("session_players").insert({
      session_id: sessionId,
      player_id: playerId,
      total_buy_ins: 1,
      final_chips: null,
    });

    if (error) {
      set({ error: error.message });
      return false;
    }

    await get().fetchSessionPlayers(sessionId);
    return true;
  },

  removePlayerFromSession: async (sessionPlayerId: string) => {
    const player = get().sessionPlayers.find((p) => p.id === sessionPlayerId);
    const { error } = await supabase
      .from("session_players")
      .delete()
      .eq("id", sessionPlayerId);

    if (!error && player) {
      await get().fetchSessionPlayers(player.session_id);
    }
  },

  addBuyIn: async (sessionPlayerId: string) => {
    const player = get().sessionPlayers.find((p) => p.id === sessionPlayerId);
    if (!player) return;

    const { error } = await supabase
      .from("session_players")
      .update({ total_buy_ins: player.total_buy_ins + 1 })
      .eq("id", sessionPlayerId);

    if (!error) await get().fetchSessionPlayers(player.session_id);
  },

  removeBuyIn: async (sessionPlayerId: string) => {
    const player = get().sessionPlayers.find((p) => p.id === sessionPlayerId);
    if (!player || player.total_buy_ins <= 1) return;

    const { error } = await supabase
      .from("session_players")
      .update({ total_buy_ins: player.total_buy_ins - 1 })
      .eq("id", sessionPlayerId);

    if (!error) await get().fetchSessionPlayers(player.session_id);
  },

  setFinalChips: async (sessionPlayerId: string, chips: number) => {
    const player = get().sessionPlayers.find((p) => p.id === sessionPlayerId);
    if (!player) return;

    const { error } = await supabase
      .from("session_players")
      .update({ final_chips: chips })
      .eq("id", sessionPlayerId);

    if (!error) await get().fetchSessionPlayers(player.session_id);
  },

  saveSettlements: async (sessionId: string, transfers: Transfer[]) => {
    const rows = transfers.map((t) => ({
      session_id: sessionId,
      from_player: t.fromId,
      to_player: t.toId,
      amount: t.amount,
    }));

    // Delete existing settlements for this session first
    await supabase.from("settlements").delete().eq("session_id", sessionId);

    if (rows.length > 0) {
      const { error } = await supabase.from("settlements").insert(rows);
      if (error) set({ error: error.message });
    }
  },

  completeSession: async (sessionId: string) => {
    const { error } = await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    if (!error) {
      set({ activeSession: null, sessionPlayers: [] });
    }
  },

  deleteSession: async (sessionId: string) => {
    await supabase.from("sessions").delete().eq("id", sessionId);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSession: state.activeSession?.id === sessionId ? null : state.activeSession,
    }));
  },
}));
