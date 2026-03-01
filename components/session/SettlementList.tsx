import { View, Text } from "react-native";
import type { Transfer } from "../../types";

interface Props {
  transfers: Transfer[];
}

export function SettlementList({ transfers }: Props) {
  if (transfers.length === 0) {
    return (
      <View className="bg-[#0f3d1c] rounded-2xl p-6 items-center">
        <Text className="text-3xl mb-2">🎉</Text>
        <Text className="text-green-300 font-bold text-lg">אין סילוקים נדרשים!</Text>
        <Text className="text-green-500 text-sm mt-1">כולם בשיווי משקל</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {transfers.map((t, i) => (
        <View
          key={i}
          className="bg-[#111f2e] rounded-2xl p-4 border border-[#1e3a52] flex-row items-center justify-between"
        >
          <View className="bg-[#d4af37] rounded-full px-3 py-1">
            <Text className="text-[#0a1628] font-bold text-base">
              {t.amount.toFixed(0)}₪
            </Text>
          </View>

          <View className="flex-row items-center gap-2 flex-1 justify-end">
            <View className="items-end">
              <Text className="text-green-400 font-semibold text-sm">{t.toName}</Text>
              <Text className="text-gray-500 text-xs">מקבל</Text>
            </View>
            <Text className="text-gray-400 text-lg">←</Text>
            <View className="items-end">
              <Text className="text-red-400 font-semibold text-sm">{t.fromName}</Text>
              <Text className="text-gray-500 text-xs">משלם</Text>
            </View>
          </View>
        </View>
      ))}

      <View className="bg-[#111f2e] rounded-xl p-3 border border-[#1e3a52] mt-1">
        <Text className="text-gray-400 text-xs text-center">
          {transfers.length} העברות מינימליות לסילוק מלא
        </Text>
      </View>
    </View>
  );
}
