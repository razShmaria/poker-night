import { Tabs } from "expo-router";
import { Text, View } from "react-native";

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1">
      <Text className={`text-xl ${focused ? "opacity-100" : "opacity-50"}`}>{emoji}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f1e2e",
          borderTopColor: "#1e3a52",
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#d4af37",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "משחק",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🃏" label="משחק" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarLabel: "היסטוריה",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📜" label="היסטוריה" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "פרופיל",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="פרופיל" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
