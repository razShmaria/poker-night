import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { format } from "date-fns";
import { useSessionStore } from "../../stores/sessionStore";
import type { SessionWithDetails, Transfer, PlayerBalance } from "../../types";
import { calculatePlayerBalances, calculateTransfers } from "../../lib/settlement";

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchSessionById } = useSessionStore();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSessionById(id).then((data) => {
        setSession(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0a1628] items-center justify-center">
        <ActivityIndicator size="large" color="#d4af37" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-[#0a1628] items-center justify-center">
        <Text className="text-white text-lg">המשחק לא נמצא</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-[#d4af37]">חזור</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const balances: PlayerBalance[] = calculatePlayerBalances(
    session.session_players.map((sp) => ({
      playerId: sp.player_id,
      name: sp.profile?.name ?? "שחקן",
      avatarUrl: sp.profile?.avatar_url ?? null,
      totalBuyIns: sp.total_buy_ins,
      finalChips: sp.final_chips ?? 0,
    })),
    session.buy_in_amount,
    session.chip_ratio,
    session.host_cost ?? 0
  );

  const transfers: Transfer[] = calculateTransfers(balances);
  const totalPot = session.session_players.reduce(
    (sum, p) => sum + p.total_buy_ins * session.buy_in_amount,
    0
  );
  const winner = [...balances].sort((a, b) => b.netBalance - a.netBalance)[0];

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#111f2e] px-3 py-1.5 rounded-lg"
          >
            <Text className="text-[#d4af37]">← חזור</Text>
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">
            📅 {format(new Date(session.date), "dd/MM/yyyy")}
          </Text>
        </View>

        <View className="px-4 gap-4 pb-8">
          {/* Summary */}
          <View className="bg-[#1a5c2a] rounded-2xl p-4">
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-[#d4af37] text-2xl font-bold">{totalPot}₪</Text>
                <Text className="text-green-300 text-xs">קופה</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">
                  {session.session_players.length}
                </Text>
                <Text className="text-green-300 text-xs">שחקנים</Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-bold">
                  {session.buy_in_amount}₪
                </Text>
                <Text className="text-green-300 text-xs">כניסה</Text>
              </View>
              {session.host_cost && (
                <View className="items-center">
                  <Text className="text-orange-300 text-2xl font-bold">
                    {session.host_cost}₪
                  </Text>
                  <Text className="text-green-300 text-xs">אירוח</Text>
                </View>
              )}
            </View>
            {winner && (
              <View className="bg-[#0f3d1c] rounded-xl p-2 mt-3 flex-row items-center justify-center gap-2">
                <Text className="text-2xl">🏆</Text>
                <Text className="text-[#d4af37] font-bold">
                  {winner.name} ניצח עם +{winner.netBalance.toFixed(0)}₪
                </Text>
              </View>
            )}
          </View>

          {/* Player Results */}
          <View>
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              תוצאות שחקנים
            </Text>
            {balances
              .sort((a, b) => b.netBalance - a.netBalance)
              .map((b) => {
                const sp = session.session_players.find((p) => p.player_id === b.playerId);
                return (
                  <View
                    key={b.playerId}
                    className="bg-[#111f2e] rounded-xl p-3 mb-2 flex-row justify-between items-center border border-[#1e3a52]"
                  >
                    <View className="items-start gap-1">
                      <Text
                        className={`text-lg font-bold ${
                          b.netBalance >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {b.netBalance >= 0 ? "+" : ""}
                        {b.netBalance.toFixed(0)}₪
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        קנה: {b.totalSpent}₪ | צ׳יפס: {sp?.final_chips ?? 0}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-semibold">{b.name}</Text>
                      <View className="w-9 h-9 rounded-full bg-[#d4af37] items-center justify-center">
                        <Text className="text-[#0a1628] font-bold text-sm">
                          {b.name[0].toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>

          {/* Settlements */}
          <View>
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              💸 סילוקים
            </Text>
            {transfers.length === 0 ? (
              <View className="bg-[#0f3d1c] rounded-xl p-4 items-center">
                <Text className="text-green-300 font-semibold">🎉 אין העברות נדרשות</Text>
              </View>
            ) : (
              transfers.map((t, i) => (
                <View
                  key={i}
                  className="bg-[#111f2e] rounded-xl p-4 mb-2 border border-[#1e3a52]"
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-[#d4af37] font-bold text-lg">
                      {t.amount.toFixed(0)}₪
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-green-400 font-semibold">{t.toName}</Text>
                      <Text className="text-gray-400 text-lg">←</Text>
                      <Text className="text-red-400 font-semibold">{t.fromName}</Text>
                    </View>
                  </View>
                  <Text className="text-gray-500 text-xs text-right mt-1">
                    {t.fromName} משלם {t.amount.toFixed(0)}₪ ל{t.toName}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
