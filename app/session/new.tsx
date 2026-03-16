import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSessionStore } from "../../stores/sessionStore";
import { useAuthStore } from "../../stores/authStore";
import { format } from "date-fns";

export default function NewSessionScreen() {
  const { createSession, activeSession } = useSessionStore();
  const { user } = useAuthStore();

  const today = format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(today);
  const [buyIn, setBuyIn] = useState("50");
  const [chipRatio, setChipRatio] = useState("250");
  const [hasHostCost, setHasHostCost] = useState(false);
  const [hostCost, setHostCost] = useState("0");
  const [loading, setLoading] = useState(false);

  const chipValue = (Number(buyIn) / Number(chipRatio)).toFixed(3);

  async function handleCreate() {
    if (activeSession) {
      Alert.alert("שגיאה", "יש כבר משחק פעיל. סיים אותו לפני שתתחיל חדש.");
      return;
    }

    const buyInNum = Number(buyIn);
    const chipRatioNum = Number(chipRatio);

    if (!buyInNum || !chipRatioNum) {
      Alert.alert("שגיאה", "נא להזין ערכי כניסה ויחס צ׳יפס תקינים");
      return;
    }

    if (!user) {
      Alert.alert("שגיאה", "יש להתחבר קודם");
      return;
    }

    setLoading(true);

    const session = await createSession({
      date,
      buy_in_amount: buyInNum,
      chip_ratio: chipRatioNum,
      host_cost: hasHostCost ? Number(hostCost) : undefined,
      created_by: user.id,
    });

    setLoading(false);

    if (session) {
      router.back();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 pt-4 pb-4 flex-row justify-between items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[#d4af37] text-base">✕ ביטול</Text>
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">🎲 משחק חדש</Text>
        </View>

        <View className="px-5 gap-5 pb-10">
          {/* Date */}
          <View>
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              📅 תאריך
            </Text>
            <TextInput
              className="bg-[#111f2e] text-white px-4 py-3 rounded-xl border border-[#1e3a52] text-right"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#4b5563"
            />
          </View>

          {/* Buy-in amount */}
          <View>
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              💵 סכום כניסה (₪)
            </Text>
            <View className="flex-row gap-3">
              {["20", "50", "100", "200"].map((v) => (
                <TouchableOpacity
                  key={v}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    buyIn === v ? "bg-[#d4af37]" : "bg-[#111f2e] border border-[#1e3a52]"
                  }`}
                  onPress={() => setBuyIn(v)}
                >
                  <Text
                    className={`font-bold ${
                      buyIn === v ? "text-[#0a1628]" : "text-gray-300"
                    }`}
                  >
                    {v}₪
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              className="bg-[#111f2e] text-white px-4 py-3 rounded-xl border border-[#1e3a52] text-right mt-2"
              value={buyIn}
              onChangeText={setBuyIn}
              keyboardType="numeric"
              placeholder="סכום מותאם אישית"
              placeholderTextColor="#4b5563"
            />
          </View>

          {/* Chip ratio */}
          <View>
            <Text className="text-gray-400 text-sm font-semibold mb-2 text-right">
              🪙 יחס צ׳יפס (צ׳יפס לכל כניסה)
            </Text>
            <View className="flex-row gap-3">
              {["100", "250", "500", "1000"].map((v) => (
                <TouchableOpacity
                  key={v}
                  className={`flex-1 py-3 rounded-xl items-center ${
                    chipRatio === v ? "bg-[#d4af37]" : "bg-[#111f2e] border border-[#1e3a52]"
                  }`}
                  onPress={() => setChipRatio(v)}
                >
                  <Text
                    className={`font-bold text-xs ${
                      chipRatio === v ? "text-[#0a1628]" : "text-gray-300"
                    }`}
                  >
                    {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              className="bg-[#111f2e] text-white px-4 py-3 rounded-xl border border-[#1e3a52] text-right mt-2"
              value={chipRatio}
              onChangeText={setChipRatio}
              keyboardType="numeric"
              placeholder="יחס מותאם אישית"
              placeholderTextColor="#4b5563"
            />
          </View>

          {/* Chip value display */}
          <View className="bg-[#111f2e] rounded-xl p-4 border border-[#1e3a52]">
            <Text className="text-gray-400 text-sm text-center mb-1">ערך צ׳יפ</Text>
            <Text className="text-[#d4af37] text-2xl font-bold text-center">
              1 צ׳יפ = {chipValue}₪
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              כניסה של {buyIn}₪ = {chipRatio} צ׳יפס
            </Text>
          </View>

          {/* Host cost */}
          <View className="bg-[#111f2e] rounded-xl p-4 border border-[#1e3a52]">
            <View className="flex-row justify-between items-center">
              <Switch
                value={hasHostCost}
                onValueChange={setHasHostCost}
                trackColor={{ false: "#374151", true: "#d4af37" }}
                thumbColor={hasHostCost ? "#0a1628" : "#6b7280"}
              />
              <Text className="text-white font-semibold">🍕 עלות אירוח / אוכל</Text>
            </View>
            {hasHostCost && (
              <TextInput
                className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-right mt-3"
                value={hostCost}
                onChangeText={setHostCost}
                keyboardType="numeric"
                placeholder="סכום באיחסון (₪)"
                placeholderTextColor="#4b5563"
              />
            )}
            {hasHostCost && (
              <Text className="text-gray-500 text-xs text-right mt-2">
                * מחושב לפי רווחים — מנצחים משלמים יותר
              </Text>
            )}
          </View>

          {/* Create button */}
          <TouchableOpacity
            className="bg-[#d4af37] py-4 rounded-2xl items-center"
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a1628" />
            ) : (
              <Text className="text-[#0a1628] font-bold text-xl">
                🚀 התחל משחק
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
