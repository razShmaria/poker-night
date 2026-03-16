import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  message?: string;
}

export function LoadingScreen({ message = "טוען..." }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-[#0a1628] items-center justify-center">
      <Text className="text-5xl mb-6">♠</Text>
      <ActivityIndicator size="large" color="#d4af37" />
      <Text className="text-gray-400 mt-4 text-base">{message}</Text>
    </SafeAreaView>
  );
}
