import { useState, useEffect, useCallback } from "react";
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
  Modal,
  RefreshControl,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { searchCases, getTopics, type SearchResult, type Topic } from "@/api/client";

const RESULTS_PER_PAGE = 10;

const colors = {
  primary: "#1e40af",
  primaryLight: "#eff6ff",
  bg: "#f8fafc",
  surface: "#ffffff",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  error: "#dc2626",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  blueBg: "#eff6ff",
};

function SimilarityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const isHigh = pct >= 80;
  return (
    <View style={[styles.badge, { backgroundColor: isHigh ? colors.greenBg : colors.blueBg }]}>
      <Text style={[styles.badgeText, { color: isHigh ? colors.green : colors.primary }]}>
        {pct}%
      </Text>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [topicModalVisible, setTopicModalVisible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  useEffect(() => {
    getTopics().then(setTopics).catch(() => {});
  }, []);

  const handleSearch = useCallback(
    async (pageNum = 0) => {
      setLoading(true);
      setSearched(true);
      setError(null);
      setPage(pageNum);
      try {
        const data = await searchCases({
          q: query || undefined,
          topic_ids: selectedTopic || undefined,
          year_from: yearFrom ? parseInt(yearFrom) : undefined,
          year_to: yearTo ? parseInt(yearTo) : undefined,
          limit: RESULTS_PER_PAGE,
          offset: pageNum * RESULTS_PER_PAGE,
        });
        setResults(data);
      } catch {
        setResults([]);
        setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [query, selectedTopic, yearFrom, yearTo]
  );

  const onRefresh = useCallback(async () => {
    if (!searched) return;
    setRefreshing(true);
    await handleSearch(page);
    setRefreshing(false);
  }, [searched, handleSearch, page]);

  const selectedTopicName = topics.find((t) => String(t.id) === selectedTopic)?.name;
  const hasFilters = selectedTopic || yearFrom || yearTo;

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/cases/${item.case.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.caseName} numberOfLines={2}>
          {item.case.case_name}
        </Text>
        {item.similarity != null && <SimilarityBadge value={item.similarity} />}
      </View>
      <Text style={styles.meta}>
        {item.case.citation} · {item.case.year}
      </Text>
      {item.case.snippet && (
        <Text style={styles.snippet} numberOfLines={2}>
          {item.case.snippet}
        </Text>
      )}
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.inputWrapper}>
          <Text style={styles.searchIcon}>&#x1F50D;</Text>
          <TextInput
            style={styles.input}
            placeholder="Search cases by concept or keyword..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(0)}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={() => handleSearch(0)}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setFiltersExpanded(!filtersExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.filterToggleText}>
          Filters{hasFilters ? " (active)" : ""}
        </Text>
        <Text style={styles.filterChevron}>{filtersExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {/* Filters Panel */}
      {filtersExpanded && (
        <View style={styles.filtersPanel}>
          {/* Topic Picker */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Topic</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setTopicModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerButtonText,
                  !selectedTopic && { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {selectedTopicName || "All topics"}
              </Text>
              <Text style={styles.pickerChevron}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Year Range */}
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Year</Text>
            <View style={styles.yearRow}>
              <TextInput
                style={styles.yearInput}
                placeholder="From"
                placeholderTextColor={colors.textMuted}
                value={yearFrom}
                onChangeText={setYearFrom}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.yearDash}>–</Text>
              <TextInput
                style={styles.yearInput}
                placeholder="To"
                placeholderTextColor={colors.textMuted}
                value={yearTo}
                onChangeText={setYearTo}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>

          {hasFilters && (
            <TouchableOpacity
              onPress={() => {
                setSelectedTopic("");
                setYearFrom("");
                setYearTo("");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFilters}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Results Header */}
      {searched && !loading && results !== null && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length === 0
              ? "No results"
              : `Showing ${page * RESULTS_PER_PAGE + 1}–${page * RESULTS_PER_PAGE + results.length}`}
          </Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => handleSearch(page)} activeOpacity={0.7}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const ListFooter = () => {
    if (!searched || !results || results.length === 0) return null;
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
          onPress={() => page > 0 && handleSearch(page - 1)}
          disabled={page === 0}
          activeOpacity={0.7}
        >
          <Text style={[styles.pageButtonText, page === 0 && styles.pageButtonTextDisabled]}>
            ← Previous
          </Text>
        </TouchableOpacity>
        <Text style={styles.pageIndicator}>Page {page + 1}</Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            results.length < RESULTS_PER_PAGE && styles.pageButtonDisabled,
          ]}
          onPress={() => results.length >= RESULTS_PER_PAGE && handleSearch(page + 1)}
          disabled={results.length < RESULTS_PER_PAGE}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.pageButtonText,
              results.length < RESULTS_PER_PAGE && styles.pageButtonTextDisabled,
            ]}
          >
            Next →
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const EmptyState = () => {
    if (loading) return null;
    if (searched && results?.length === 0 && !error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No cases found</Text>
          <Text style={styles.emptySubtitle}>Try different keywords or broaden your filters.</Text>
        </View>
      );
    }
    if (!searched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Search Supreme Court Cases</Text>
          <Text style={styles.emptySubtitle}>
            Enter a query above to search across landmark decisions, or hit Search to browse all.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FlatList
        data={searched && !error ? results ?? [] : []}
        keyExtractor={(r) => String(r.case.id)}
        renderItem={renderResult}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        keyboardShouldPersistTaps="handled"
      />

      {/* Topic Picker Modal */}
      <Modal
        visible={topicModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTopicModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setTopicModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Topic</Text>
              <TouchableOpacity onPress={() => setTopicModalVisible(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: 0, name: "All topics", slug: "" }, ...topics]}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item }) => {
                const isSelected = item.id === 0 ? !selectedTopic : String(item.id) === selectedTopic;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setSelectedTopic(item.id === 0 ? "" : String(item.id));
                      setTopicModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                      {item.name}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 16, paddingBottom: 32 },

  searchRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  searchButton: {
    paddingHorizontal: 20,
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
  },
  searchButtonDisabled: { opacity: 0.6 },
  searchButtonText: { color: "white", fontWeight: "600", fontSize: 15 },

  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  filterToggleText: { fontSize: 14, fontWeight: "500", color: colors.textSecondary },
  filterChevron: { fontSize: 10, color: colors.textMuted },

  filtersPanel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  filterRow: { marginBottom: 14 },
  filterLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginBottom: 6 },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerButtonText: { fontSize: 14, color: colors.text, flex: 1 },
  pickerChevron: { fontSize: 10, color: colors.textMuted, marginLeft: 8 },

  yearRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  yearInput: {
    flex: 1,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    textAlign: "center",
  },
  yearDash: { color: colors.textMuted, fontSize: 16 },

  clearFilters: { fontSize: 13, color: colors.primary, fontWeight: "500", marginTop: 2 },

  resultsHeader: { marginBottom: 8, marginTop: 4 },
  resultsCount: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  caseName: { fontWeight: "600", fontSize: 15, color: colors.text, flex: 1, lineHeight: 21 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  snippet: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginTop: 8 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pageButton: { paddingVertical: 8, paddingHorizontal: 4 },
  pageButtonDisabled: { opacity: 0.3 },
  pageButtonText: { fontSize: 14, fontWeight: "500", color: colors.primary },
  pageButtonTextDisabled: { color: colors.textMuted },
  pageIndicator: { fontSize: 12, color: colors.textMuted },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.text, marginBottom: 6 },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
  },

  errorBox: { alignItems: "center", paddingVertical: 24 },
  errorText: { fontSize: 14, color: colors.error, marginBottom: 8 },
  retryText: { fontSize: 14, color: colors.primary, fontWeight: "500" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  modalClose: { fontSize: 15, fontWeight: "600", color: colors.primary },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalItemSelected: { backgroundColor: colors.primaryLight },
  modalItemText: { fontSize: 15, color: colors.text },
  modalItemTextSelected: { fontWeight: "600", color: colors.primary },
  checkmark: { fontSize: 16, color: colors.primary, fontWeight: "700" },
});
