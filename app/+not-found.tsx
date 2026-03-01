import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0a1628] items-center justify-center px-6">
      <Text className="text-6xl mb-4">♠</Text>
      <Text className="text-white text-2xl font-bold text-center mb-2">
        הדף לא נמצא
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        הקישור שחיפשת לא קיים
      </Text>
      <TouchableOpacity
        className="bg-[#d4af37] px-8 py-4 rounded-2xl"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-[#0a1628] font-bold text-lg">🏠 חזור לדף הבית</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
