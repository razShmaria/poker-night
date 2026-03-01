import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSessionStore } from "../../stores/sessionStore";
import { useAuthStore } from "../../stores/authStore";
import { PlayerBuyInCard } from "../../components/session/PlayerBuyInCard";
import { supabase } from "../../lib/supabase";

export default function HomeScreen() {
  const {
    activeSession,
    sessionPlayers,
    fetchActiveSession,
    loading,
  } = useSessionStore();
  const { profile, user } = useAuthStore();

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const totalPot = activeSession
    ? sessionPlayers.reduce(
        (sum, p) => sum + p.total_buy_ins * activeSession.buy_in_amount,
        0
      )
    : 0;

  const totalChipsDistributed = activeSession
    ? sessionPlayers.reduce(
        (sum, p) => sum + p.total_buy_ins * activeSession.chip_ratio,
        0
      )
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchActiveSession}
            tintColor="#d4af37"
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2 flex-row justify-between items-center">
          <Text className="text-[#d4af37] text-2xl font-bold">♠ פוקר נייט</Text>
          <Text className="text-gray-400 text-sm">
            שלום, {profile?.name ?? "שחקן"} 👋
          </Text>
        </View>

        {activeSession ? (
          <ActiveSession
            session={activeSession}
            players={sessionPlayers}
            totalPot={totalPot}
            totalChips={totalChipsDistributed}
          />
        ) : (
          <NoSession />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NoSession() {
  return (
    <View className="flex-1 items-center justify-center px-6 mt-24">
      <Text className="text-6xl mb-4">🃏</Text>
      <Text className="text-white text-2xl font-bold text-center mb-2">
        אין משחק פעיל
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        צור משחק חדש כדי להתחיל לעקוב{"\n"}אחר הפוקר הלילה
      </Text>
      <TouchableOpacity
        className="bg-[#d4af37] px-8 py-4 rounded-2xl w-full items-center"
        onPress={() => router.push("/session/new")}
        activeOpacity={0.8}
      >
        <Text className="text-[#0a1628] font-bold text-xl">🎲 משחק חדש</Text>
      </TouchableOpacity>
    </View>
  );
}

function ActiveSession({
  session,
  players,
  totalPot,
  totalChips,
}: {
  session: import("../../types").Session;
  players: import("../../types").SessionPlayerWithProfile[];
  totalPot: number;
  totalChips: number;
}) {
  const { addPlayerToSession, completeSession, setError } = useSessionStore();
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);

  async function handleEndGame() {
    // Validate all players have entered final chips
    const missing = players.filter((p) => p.final_chips === null);
    if (missing.length > 0) {
      Alert.alert(
        "שגיאה",
        `${missing.length} שחקנים עדיין לא הזינו צ'יפים סופיים:\n${missing
          .map((p) => p.profile?.name)
          .join(", ")}`
      );
      return;
    }
    setShowEndGame(true);
  }

  const allChipsEntered = players.length > 0 && players.every((p) => p.final_chips !== null);
  const collectedChips = players.reduce((sum, p) => sum + (p.final_chips ?? 0), 0);
  const chipDiff = Math.abs(totalChips - collectedChips);
  const chipsBalanced = chipDiff <= 5;

  return (
    <View className="px-4 pb-6">
      {/* Session info banner */}
      <View className="bg-[#1a5c2a] rounded-2xl p-4 mt-3 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <View className="bg-[#0f3d1c] px-3 py-1 rounded-full">
            <Text className="text-green-300 text-xs font-semibold">🔴 משחק פעיל</Text>
          </View>
          <Text className="text-green-200 text-xs">
            כניסה: {session.buy_in_amount}₪ = {session.chip_ratio} צ׳יפס
          </Text>
        </View>
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-[#d4af37] text-2xl font-bold">{totalPot}₪</Text>
            <Text className="text-green-300 text-xs">סה"כ קופה</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">{players.length}</Text>
            <Text className="text-green-300 text-xs">שחקנים</Text>
          </View>
          <View className="items-center">
            <Text className="text-white text-2xl font-bold">{totalChips}</Text>
            <Text className="text-green-300 text-xs">צ׳יפס בשוק</Text>
          </View>
        </View>
      </View>

      {/* Players list */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-gray-400 text-sm font-semibold">שחקנים</Text>
        {players.length < 10 && (
          <TouchableOpacity
            className="bg-[#162437] px-3 py-1.5 rounded-xl border border-[#2d4a6a] flex-row items-center gap-1"
            onPress={() => setShowAddPlayer(true)}
          >
            <Text className="text-[#d4af37] text-sm font-semibold">+ הוסף שחקן</Text>
          </TouchableOpacity>
        )}
      </View>

      {players.length === 0 ? (
        <View className="bg-[#111f2e] rounded-2xl p-8 items-center border border-dashed border-[#2d4a6a]">
          <Text className="text-4xl mb-3">👥</Text>
          <Text className="text-gray-400 text-center">
            לחץ על "הוסף שחקן" כדי להתחיל
          </Text>
        </View>
      ) : (
        players.map((player) => (
          <PlayerBuyInCard
            key={player.id}
            player={player}
            buyInAmount={session.buy_in_amount}
            chipRatio={session.chip_ratio}
          />
        ))
      )}

      {/* Chip validation warning */}
      {allChipsEntered && !chipsBalanced && (
        <View className="bg-[#3d1515] border border-[#7f2020] rounded-xl p-3 mt-3 flex-row items-center gap-2">
          <Text className="text-2xl">⚠️</Text>
          <View className="flex-1">
            <Text className="text-red-300 font-semibold text-right">חוסר איזון בצ׳יפס</Text>
            <Text className="text-red-400 text-xs text-right">
              חולקו: {totalChips} | נספרו: {collectedChips} | הפרש: {chipDiff}
            </Text>
          </View>
        </View>
      )}

      {allChipsEntered && chipsBalanced && (
        <View className="bg-[#0f3d1c] border border-[#1a5c2a] rounded-xl p-3 mt-3 flex-row items-center gap-2">
          <Text className="text-2xl">✅</Text>
          <Text className="text-green-300 font-semibold">הצ׳יפס מאוזנים! ניתן לסיים</Text>
        </View>
      )}

      {/* End game button */}
      {players.length > 0 && (
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center mt-4 ${
            allChipsEntered && chipsBalanced
              ? "bg-[#d4af37]"
              : "bg-[#162437] border border-[#2d4a6a]"
          }`}
          onPress={handleEndGame}
          activeOpacity={0.8}
        >
          <Text
            className={`font-bold text-lg ${
              allChipsEntered && chipsBalanced ? "text-[#0a1628]" : "text-gray-400"
            }`}
          >
            🏁 סיים משחק וחשב סילוקים
          </Text>
        </TouchableOpacity>
      )}

      {/* Add Player Modal */}
      <AddPlayerModal
        visible={showAddPlayer}
        sessionId={session.id}
        existingPlayerIds={players.map((p) => p.player_id)}
        onClose={() => setShowAddPlayer(false)}
      />

      {/* End Game Modal */}
      {showEndGame && (
        <EndGameModal
          session={session}
          players={players}
          onClose={() => setShowEndGame(false)}
        />
      )}
    </View>
  );
}

function AddPlayerModal({
  visible,
  sessionId,
  existingPlayerIds,
  onClose,
}: {
  visible: boolean;
  sessionId: string;
  existingPlayerIds: string[];
  onClose: () => void;
}) {
  const { addPlayerToSession } = useSessionStore();
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<import("../../types").Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) searchProfiles("");
  }, [visible]);

  async function searchProfiles(query: string) {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("name", `%${query}%`)
      .not("id", "in", `(${existingPlayerIds.join(",") || "null"})`)
      .limit(20);
    setProfiles((data as import("../../types").Profile[]) ?? []);
    setLoading(false);
  }

  async function handleAddPlayer(profileId: string) {
    const added = await addPlayerToSession(sessionId, profileId);
    if (added) onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-[#111f2e] rounded-t-3xl p-5 pb-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">הוסף שחקן</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-right mb-4"
            placeholder="חפש לפי שם..."
            placeholderTextColor="#4b5563"
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              searchProfiles(t);
            }}
          />

          {loading ? (
            <ActivityIndicator color="#d4af37" />
          ) : profiles.length === 0 ? (
            <Text className="text-gray-500 text-center py-4">לא נמצאו שחקנים</Text>
          ) : (
            <FlatList
              data={profiles}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center justify-between py-3 border-b border-[#1e3a52]"
                  onPress={() => handleAddPlayer(item.id)}
                >
                  <Text className="text-[#d4af37] font-semibold">+ הוסף</Text>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-white font-semibold">{item.name}</Text>
                    <View className="w-9 h-9 rounded-full bg-[#d4af37] items-center justify-center">
                      <Text className="text-[#0a1628] font-bold">
                        {item.name[0].toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

function EndGameModal({
  session,
  players,
  onClose,
}: {
  session: import("../../types").Session;
  players: import("../../types").SessionPlayerWithProfile[];
  onClose: () => void;
}) {
  const { saveSettlements, completeSession } = useSessionStore();
  const [saving, setSaving] = useState(false);

  const { calculatePlayerBalances, calculateTransfers } = require("../../lib/settlement");

  const balances = calculatePlayerBalances(
    players.map((p) => ({
      playerId: p.player_id,
      name: p.profile?.name ?? "שחקן",
      avatarUrl: p.profile?.avatar_url ?? null,
      totalBuyIns: p.total_buy_ins,
      finalChips: p.final_chips ?? 0,
    })),
    session.buy_in_amount,
    session.chip_ratio,
    session.host_cost ?? 0
  );

  const transfers: import("../../types").Transfer[] = calculateTransfers(balances);

  async function handleSave() {
    setSaving(true);
    await saveSettlements(session.id, transfers);
    await completeSession(session.id);
    setSaving(false);
    onClose();
    Alert.alert("✅ המשחק הסתיים!", "הסילוקים נשמרו בהיסטוריה");
  }

  return (
    <Modal visible transparent animationType="slide">
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-[#111f2e] rounded-t-3xl p-5 pb-10 max-h-[85%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">🏆 תוצאות המשחק</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Balances */}
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              רווח / הפסד לשחקן
            </Text>
            {balances
              .sort((a: import("../../types").PlayerBalance, b: import("../../types").PlayerBalance) => b.netBalance - a.netBalance)
              .map((b: import("../../types").PlayerBalance) => (
                <View
                  key={b.playerId}
                  className="flex-row justify-between items-center py-2.5 border-b border-[#1e3a52]"
                >
                  <Text
                    className={`font-bold text-base ${
                      b.netBalance >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {b.netBalance >= 0 ? "+" : ""}
                    {b.netBalance.toFixed(0)}₪
                  </Text>
                  <Text className="text-white font-semibold">{b.name}</Text>
                </View>
              ))}

            {/* Transfers */}
            {transfers.length > 0 && (
              <>
                <Text className="text-gray-400 text-sm font-semibold mt-4 mb-2 text-right">
                  💸 סילוקים ({transfers.length} העברות)
                </Text>
                {transfers.map((t: import("../../types").Transfer, i: number) => (
                  <View
                    key={i}
                    className="bg-[#162437] rounded-xl p-3 mb-2 flex-row justify-between items-center"
                  >
                    <Text className="text-[#d4af37] font-bold">{t.amount.toFixed(0)}₪</Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-sm">{t.toName}</Text>
                      <Text className="text-gray-400">←</Text>
                      <Text className="text-red-300 text-sm">{t.fromName}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {transfers.length === 0 && (
              <View className="bg-[#0f3d1c] rounded-xl p-4 mt-3 items-center">
                <Text className="text-green-300 font-semibold">🎉 אין העברות נדרשות!</Text>
              </View>
            )}

            <TouchableOpacity
              className="bg-[#d4af37] py-4 rounded-2xl items-center mt-5"
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0a1628" />
              ) : (
                <Text className="text-[#0a1628] font-bold text-lg">
                  💾 שמור וסיים משחק
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
