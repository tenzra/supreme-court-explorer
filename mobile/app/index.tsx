import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { searchCases, getTopics, type SearchResult, type Topic } from "@/api/client";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchCases({
        q: query || undefined,
        topic_ids: selectedTopic || undefined,
        year_from: yearFrom ? parseInt(yearFrom) : undefined,
        year_to: yearTo ? parseInt(yearTo) : undefined,
      });
      setResults(data);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async () => {
    try {
      const t = await getTopics();
      setTopics(t);
    } catch (e) {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.subtitle}>Semantic search for Indian Supreme Court cases</Text>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Right to privacy, Basic structure..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TouchableOpacity style={styles.filterButton} onPress={loadTopics}>
          <Text style={styles.filterLabel}>
            Topic: {selectedTopic ? topics.find((t) => String(t.id) === selectedTopic)?.name || selectedTopic : "All"}
          </Text>
        </TouchableOpacity>
      </View>

      {searched && results !== null && (
        <View style={styles.results}>
          <Text style={styles.resultCount}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </Text>
          {results.length === 0 ? (
            <Text style={styles.empty}>No cases found.</Text>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(r) => String(r.case.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push(`/cases/${item.case.id}`)}
                >
                  <Text style={styles.caseName}>{item.case.case_name}</Text>
                  <Text style={styles.meta}>
                    {item.case.citation} · {item.case.year}
                    {item.similarity != null && ` · ${Math.round(item.similarity * 100)}% match`}
                  </Text>
                  {item.case.snippet && (
                    <Text style={styles.snippet} numberOfLines={2}>
                      {item.case.snippet}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf8f5", padding: 16 },
  header: { marginBottom: 20 },
  subtitle: { color: "#666", fontSize: 14 },
  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "white",
  },
  button: {
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: "#1e40af",
    borderRadius: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "white", fontWeight: "600" },
  filters: { marginBottom: 20 },
  filterButton: { padding: 8 },
  filterLabel: { fontSize: 14, color: "#666" },
  results: { flex: 1 },
  resultCount: { fontSize: 16, fontWeight: "600", marginBottom: 12 },
  empty: { color: "#666" },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  caseName: { fontWeight: "600", fontSize: 16, marginBottom: 4 },
  meta: { fontSize: 14, color: "#666", marginBottom: 4 },
  snippet: { fontSize: 14, lineHeight: 20, color: "#444" },
});
