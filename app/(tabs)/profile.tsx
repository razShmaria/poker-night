import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../../stores/authStore";
import { useStatsStore } from "../../stores/statsStore";
import { supabase } from "../../lib/supabase";

function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View className="bg-[#111f2e] rounded-xl p-4 flex-1 items-center border border-[#1e3a52]">
      <Text className={`text-xl font-bold ${color}`}>{value}</Text>
      <Text className="text-gray-500 text-xs mt-1 text-center">{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, profile, updateProfile, signOut } = useAuthStore();
  const { myStats, fetchMyStats, loading: statsLoading } = useStatsStore();

  const [name, setName] = useState(profile?.name ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchMyStats(user.id);
  }, [user]);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("שגיאה", "נא להזין שם");
      return;
    }
    setSaving(true);
    await updateProfile({ name: name.trim() });
    setSaving(false);
    setEditing(false);
  }

  async function handleSignOut() {
    Alert.alert("יציאה", "האם אתה בטוח שברצונך לצאת?", [
      { text: "ביטול", style: "cancel" },
      { text: "יציאה", style: "destructive", onPress: signOut },
    ]);
  }

  const avatarLetter = (profile?.name ?? user?.email ?? "?")[0].toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-[#0a1628]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-[#d4af37] text-2xl font-bold">👤 פרופיל</Text>
        </View>

        {/* Avatar + Name */}
        <View className="items-center py-6">
          <View className="w-24 h-24 rounded-full bg-[#d4af37] items-center justify-center mb-3">
            <Text className="text-[#0a1628] text-4xl font-bold">{avatarLetter}</Text>
          </View>

          {editing ? (
            <View className="w-64">
              <TextInput
                className="bg-[#162437] text-white px-4 py-3 rounded-xl border border-[#2d4a6a] text-center text-lg"
                value={name}
                onChangeText={setName}
                placeholder="שם מלא"
                placeholderTextColor="#4b5563"
                autoFocus
              />
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  className="flex-1 bg-[#1e3a52] py-2 rounded-lg items-center"
                  onPress={() => {
                    setName(profile?.name ?? "");
                    setEditing(false);
                  }}
                >
                  <Text className="text-gray-400 font-semibold">ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-[#d4af37] py-2 rounded-lg items-center"
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#0a1628" size="small" />
                  ) : (
                    <Text className="text-[#0a1628] font-bold">שמור</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text className="text-white text-2xl font-bold">
                {profile?.name ?? "שחקן"}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">{user?.email}</Text>
              <TouchableOpacity
                className="mt-2 px-4 py-1 bg-[#162437] rounded-full border border-[#2d4a6a]"
                onPress={() => setEditing(true)}
              >
                <Text className="text-[#d4af37] text-sm">✏️ עריכת שם</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Stats */}
        <View className="px-4 mb-4">
          <Text className="text-gray-400 text-sm font-semibold mb-3 text-right">
            סטטיסטיקות
          </Text>

          {statsLoading ? (
            <ActivityIndicator color="#d4af37" />
          ) : (
            <>
              <View className="flex-row gap-3 mb-3">
                <StatCard
                  label="משחקים"
                  value={String(myStats?.sessionsPlayed ?? 0)}
                />
                <StatCard
                  label='רווח כולל'
                  value={`${(myStats?.totalProfit ?? 0) >= 0 ? "+" : ""}${(myStats?.totalProfit ?? 0).toFixed(0)}₪`}
                  color={
                    (myStats?.totalProfit ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                  }
                />
              </View>
              <View className="flex-row gap-3">
                <StatCard
                  label="ניצחון גדול ביותר"
                  value={`+${(myStats?.biggestWin ?? 0).toFixed(0)}₪`}
                  color="text-green-400"
                />
                <StatCard
                  label="הפסד גדול ביותר"
                  value={`${(myStats?.biggestLoss ?? 0).toFixed(0)}₪`}
                  color="text-red-400"
                />
              </View>
            </>
          )}
        </View>

        {/* Sign out */}
        <View className="px-4 pb-10">
          <TouchableOpacity
            className="bg-[#2d1515] border border-[#5c2020] py-4 rounded-xl items-center"
            onPress={handleSignOut}
          >
            <Text className="text-red-400 font-semibold">🚪 יציאה מהמערכת</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
