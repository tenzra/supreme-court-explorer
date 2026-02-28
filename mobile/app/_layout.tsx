import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const HEADER_BG = "#ffffff";
const PRIMARY = "#1e40af";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: HEADER_BG },
          headerTintColor: PRIMARY,
          headerTitleStyle: { fontWeight: "600", fontSize: 17, color: "#0f172a" },
          headerShadowVisible: false,
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Supreme Court Explorer" }} />
        <Stack.Screen name="cases/[id]" options={{ title: "Case Detail" }} />
      </Stack>
    </>
  );
}
