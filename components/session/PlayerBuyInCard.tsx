import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useSessionStore } from "../../stores/sessionStore";
import type { SessionPlayerWithProfile } from "../../types";

interface Props {
  player: SessionPlayerWithProfile;
  buyInAmount: number;
  chipRatio: number;
}

export function PlayerBuyInCard({ player, buyInAmount, chipRatio }: Props) {
  const { addBuyIn, removeBuyIn, setFinalChips, removePlayerFromSession } = useSessionStore();
  const [showChipInput, setShowChipInput] = useState(false);
  const [chipInput, setChipInput] = useState(
    player.final_chips !== null ? String(player.final_chips) : ""
  );
  const [saving, setSaving] = useState(false);

  const totalSpent = player.total_buy_ins * buyInAmount;
  const totalChips = player.total_buy_ins * chipRatio;

  async function handleSaveChips() {
    const chips = Number(chipInput);
    if (isNaN(chips) || chips < 0) {
      Alert.alert("שגיאה", "נא להזין מספר תקין");
      return;
    }
    setSaving(true);
    await setFinalChips(player.id, chips);
    setSaving(false);
    setShowChipInput(false);
  }

  function handleRemove() {
    Alert.alert(
      "הסרת שחקן",
      `להסיר את ${player.profile?.name} מהמשחק?`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "הסר",
          style: "destructive",
          onPress: () => removePlayerFromSession(player.id),
        },
      ]
    );
  }

  const hasChips = player.final_chips !== null;
  const chipValue = buyInAmount / chipRatio;
  const finalWorth = hasChips ? (player.final_chips! * chipValue) : null;
  const net = finalWorth !== null ? finalWorth - totalSpent : null;

  return (
    <View className="bg-[#111f2e] rounded-2xl p-4 mb-3 border border-[#1e3a52]">
      {/* Player header */}
      <View className="flex-row justify-between items-center mb-3">
        <TouchableOpacity onPress={handleRemove}>
          <Text className="text-gray-600 text-xs">✕</Text>
        </TouchableOpacity>
        <View className="flex-row items-center gap-3">
          <View className="items-end">
            <Text className="text-white font-bold text-base">
              {player.profile?.name ?? "שחקן"}
            </Text>
            <Text className="text-gray-500 text-xs">
              {totalSpent}₪ • {totalChips} צ׳יפס
            </Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-[#d4af37] items-center justify-center">
            <Text className="text-[#0a1628] font-bold">
              {(player.profile?.name ?? "?")[0].toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Buy-in controls */}
      <View className="flex-row justify-between items-center bg-[#0a1628] rounded-xl p-3 mb-3">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="w-8 h-8 rounded-lg bg-[#d4af37] items-center justify-center"
            onPress={() => addBuyIn(player.id)}
          >
            <Text className="text-[#0a1628] font-bold text-lg">+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-8 h-8 rounded-lg bg-[#162437] border border-[#2d4a6a] items-center justify-center"
            onPress={() => removeBuyIn(player.id)}
            disabled={player.total_buy_ins <= 1}
          >
            <Text
              className={`font-bold text-lg ${
                player.total_buy_ins <= 1 ? "text-gray-700" : "text-white"
              }`}
            >
              -
            </Text>
          </TouchableOpacity>
        </View>
        <View className="items-center">
          <Text className="text-[#d4af37] text-2xl font-bold">
            x{player.total_buy_ins}
          </Text>
          <Text className="text-gray-500 text-xs">כניסות</Text>
        </View>
        <View className="items-end">
          <Text className="text-white font-bold">{totalSpent}₪</Text>
          <Text className="text-gray-500 text-xs">הושקע</Text>
        </View>
      </View>

      {/* Final chips section */}
      {showChipInput ? (
        <View className="flex-row gap-2 items-center">
          <TouchableOpacity
            className="bg-[#d4af37] px-3 py-2 rounded-xl"
            onPress={handleSaveChips}
            disabled={saving}
          >
            <Text className="text-[#0a1628] font-bold">✓ שמור</Text>
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-[#162437] text-white px-3 py-2 rounded-xl border border-[#2d4a6a] text-right"
            value={chipInput}
            onChangeText={setChipInput}
            keyboardType="numeric"
            placeholder="מספר צ׳יפס סופי"
            placeholderTextColor="#4b5563"
            autoFocus
          />
          <Text className="text-gray-400 text-sm">🪙</Text>
        </View>
      ) : (
        <TouchableOpacity
          className={`rounded-xl p-2.5 items-center flex-row justify-center gap-2 ${
            hasChips
              ? "bg-[#0f3d1c] border border-[#1a5c2a]"
              : "bg-[#162437] border border-dashed border-[#2d4a6a]"
          }`}
          onPress={() => {
            setChipInput(player.final_chips !== null ? String(player.final_chips) : "");
            setShowChipInput(true);
          }}
        >
          {hasChips ? (
            <>
              <Text
                className={`font-bold ${net !== null && net >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {net !== null ? `${net >= 0 ? "+" : ""}${net.toFixed(0)}₪` : ""}
              </Text>
              <Text className="text-green-300 text-sm">
                🪙 {player.final_chips} צ׳יפס
              </Text>
            </>
          ) : (
            <Text className="text-gray-500 text-sm">📊 הזן צ׳יפס סופיים</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
