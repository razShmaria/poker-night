import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { useSessionStore } from "../../stores/sessionStore";
import { useAuthStore } from "../../stores/authStore";
import { calculatePlayerBalances } from "../../lib/settlement";
import type { SessionWithDetails } from "../../types";

function SessionHistoryCard({ session, userId }: { session: SessionWithDetails; userId: string }) {
  const router = useRouter();

  const myPlayer = session.session_players.find((p) => p.player_id === userId);
  let myNet: number | null = null;

  if (myPlayer && myPlayer.final_chips !== null) {
    const chipValue = session.buy_in_amount / session.chip_ratio;
    const spent = myPlayer.total_buy_ins * session.buy_in_amount;
    const won = myPlayer.final_chips * chipValue;
    myNet = won - spent;
  }

  const totalPot = session.session_players.reduce(
    (sum, p) => sum + p.total_buy_ins * session.buy_in_amount,
    0
  );

  return (
    <TouchableOpacity
      className="bg-[#111f2e] rounded-2xl p-4 mb-3 border border-[#1e3a52]"
      onPress={() => router.push(`/session/${session.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-400 text-sm">
            {format(new Date(session.date), "dd/MM/yyyy")}
          </Text>
          <View className="bg-[#0a3020] px-2 py-0.5 rounded-full">
            <Text className="text-green-400 text-xs">הושלם</Text>
          </View>
        </View>
        {myNet !== null && (
          <Text
            className={`text-base font-bold ${myNet >= 0 ? "text-green-400" : "text-red-400"}`}
          >
            {myNet >= 0 ? "+" : ""}
            {myNet.toFixed(0)}₪
          </Text>
        )}
      </View>

      <View className="flex-row justify-between mt-3">
        <View>
          <Text className="text-gray-500 text-xs text-right">שחקנים</Text>
          <Text className="text-white text-sm font-semibold text-right">
            {session.session_players.length}
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-xs text-right">כניסה</Text>
          <Text className="text-white text-sm font-semibold text-right">
            {session.buy_in_amount}₪
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-xs text-right">סה"כ קופה</Text>
          <Text className="text-[#d4af37] text-sm font-semibold text-right">
            {totalPot}₪
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-xs text-right">העברות</Text>
          <Text className="text-white text-sm font-semibold text-right">
            {session.settlements?.length ?? 0}
          </Text>
        </View>
      </View>

      {session.session_players.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mt-3">
          {session.session_players.slice(0, 5).map((sp) => (
            <View key={sp.id} className="bg-[#162437] px-2 py-0.5 rounded-full">
              <Text className="text-gray-300 text-xs">{sp.profile?.name ?? "?"}</Text>
            </View>
          ))}
          {session.session_players.length > 5 && (
            <View className="bg-[#162437] px-2 py-0.5 rounded-full">
              <Text className="text-gray-400 text-xs">+{session.session_players.length - 5}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { sessions, fetchSessions, loading } = useSessionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) fetchSessions(user.id);
  }, [user]);

  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 flex-row justify-between items-center">
        <Text className="text-[#d4af37] text-2xl font-bold">📜 היסטוריה</Text>
        <Text className="text-gray-500 text-sm">{completedSessions.length} משחקים</Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => user && fetchSessions(user.id)}
            tintColor="#d4af37"
          />
        }
      >
        {completedSessions.length === 0 ? (
          <View className="items-center mt-20">
            <Text className="text-5xl mb-4">🃏</Text>
            <Text className="text-white text-lg font-semibold">אין היסטוריה עדיין</Text>
            <Text className="text-gray-500 mt-2 text-center">
              לאחר סיום המשחק הראשון,{"\n"}הוא יופיע כאן
            </Text>
          </View>
        ) : (
          completedSessions.map((session) => (
            <SessionHistoryCard
              key={session.id}
              session={session}
              userId={user?.id ?? ""}
            />
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
