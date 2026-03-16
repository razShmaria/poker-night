import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

type Mode = "signin" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert("שגיאה", "נא למלא אימייל וסיסמה");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      Alert.alert("שגיאה", "נא להזין שם מלא");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            name: name.trim(),
            avatar_url: null,
            phone: null,
          });
        }
        Alert.alert("✅ נרשמת בהצלחה", "ברוך הבא לפוקר נייט!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
      Alert.alert("שגיאה", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            {/* Logo */}
            <View className="items-center mb-12">
              <Text className="text-7xl mb-3">♠</Text>
              <Text className="text-white text-4xl font-bold tracking-wide">פוקר נייט</Text>
              <Text className="text-gray-400 mt-2 text-base">נהל את לילות הפוקר שלך</Text>
            </View>

            {/* Mode toggle */}
            <View className="flex-row bg-[#162437] rounded-xl p-1 mb-6">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${mode === "signin" ? "bg-[#d4af37]" : ""}`}
                onPress={() => setMode("signin")}
              >
                <Text className={`font-semibold ${mode === "signin" ? "text-[#0a1628]" : "text-gray-400"}`}>
                  כניסה
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg items-center ${mode === "signup" ? "bg-[#d4af37]" : ""}`}
                onPress={() => setMode("signup")}
              >
                <Text className={`font-semibold ${mode === "signup" ? "text-[#0a1628]" : "text-gray-400"}`}>
                  הרשמה
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View className="gap-3">
              {mode === "signup" && (
                <View>
                  <Text className="text-gray-400 text-sm mb-1 text-right">שם מלא</Text>
                  <TextInput
                    className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-right"
                    placeholder="ישראל ישראלי"
                    placeholderTextColor="#4b5563"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View>
                <Text className="text-gray-400 text-sm mb-1 text-right">אימייל</Text>
                <TextInput
                  className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-right"
                  placeholder="example@gmail.com"
                  placeholderTextColor="#4b5563"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="text-gray-400 text-sm mb-1 text-right">סיסמה</Text>
                <TextInput
                  className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-right"
                  placeholder="לפחות 6 תווים"
                  placeholderTextColor="#4b5563"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                className="bg-[#d4af37] py-4 rounded-xl items-center mt-2"
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#0a1628" />
                ) : (
                  <Text className="text-[#0a1628] font-bold text-lg">
                    {mode === "signin" ? "כניסה למערכת" : "יצירת חשבון"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Card suits decoration */}
            <View className="flex-row justify-center mt-12 gap-4">
              {["♠", "♥", "♦", "♣"].map((suit, i) => (
                <Text
                  key={i}
                  className={`text-2xl opacity-20 ${i % 2 !== 0 ? "text-red-400" : "text-white"}`}
                >
                  {suit}
                </Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
