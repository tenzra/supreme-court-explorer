import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: "Supreme Court Explorer" }} />
        <Stack.Screen name="cases/[id]" options={{ title: "Case Detail" }} />
      </Stack>
    </>
  );
}
