import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { demoState, getRelativeDate } from "./src/data/demo";
import {
  PlayFormat,
  PlayRequest,
  RallyMateState,
  SkillLevel,
  TabKey
} from "./src/types";

const storageKey = "rallymate-mobile-state-v1";

const levels: SkillLevel[] = ["beginner", "improver", "intermediate", "advanced"];
const tabs: { key: TabKey; label: string }[] = [
  { key: "requests", label: "Requests" },
  { key: "create", label: "Create" },
  { key: "matches", label: "Matches" },
  { key: "profile", label: "Profile" }
];

const emptyRequestForm = {
  area: "Edgbaston",
  date: getRelativeDate(1),
  time: "18:00 to 20:00",
  level: "intermediate" as SkillLevel,
  format: "Singles" as PlayFormat,
  note: ""
};

function createEmptyRequestForm() {
  return { ...emptyRequestForm };
}

export default function App() {
  const [state, setState] = useState<RallyMateState>(demoState);
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [areaFilter, setAreaFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | "">("");
  const [notice, setNotice] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [requestForm, setRequestForm] = useState(createEmptyRequestForm);
  const [profileForm, setProfileForm] = useState({
    name: "",
    level: "beginner" as SkillLevel,
    area: "",
    bio: ""
  });

  const activePlayer = useMemo(
    () => state.players.find((player) => player.id === state.activeUserId),
    [state.activeUserId, state.players]
  );

  const openRequests = useMemo(() => {
    const area = areaFilter.trim().toLowerCase();

    return state.requests
      .filter((request) => request.status === "open")
      .filter((request) => !area || request.area.toLowerCase().includes(area))
      .filter((request) => !levelFilter || request.level === levelFilter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [areaFilter, levelFilter, state.requests]);

  const matches = useMemo(
    () =>
      state.requests.filter(
        (request) =>
          request.status === "matched" &&
          (request.creatorId === state.activeUserId ||
            request.acceptedUserId === state.activeUserId)
      ),
    [state.activeUserId, state.requests]
  );

  useEffect(() => {
    async function loadState() {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          setState(JSON.parse(stored) as RallyMateState);
        }
      } catch {
        setNotice("Demo data loaded.");
      } finally {
        setHasLoaded(true);
      }
    }

    loadState();
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(state));
  }, [hasLoaded, state]);

  useEffect(() => {
    if (!activePlayer) return;

    setProfileForm({
      name: activePlayer.name,
      level: activePlayer.level,
      area: activePlayer.area,
      bio: activePlayer.bio
    });
  }, [activePlayer?.id]);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  function updateState(nextState: RallyMateState) {
    setState(nextState);
  }

  function getPlayer(playerId: string | null) {
    if (!playerId) return undefined;
    return state.players.find((player) => player.id === playerId);
  }

  function showNotice(message: string) {
    setNotice(message);
  }

  function switchDemoPlayer(playerId: string) {
    updateState({
      ...state,
      activeUserId: playerId
    });
    showNotice("Demo player switched.");
  }

  function markInterest(requestId: string) {
    const nextRequests = state.requests.map((request) => {
      if (request.id !== requestId || request.creatorId === state.activeUserId) {
        return request;
      }

      if (request.interestedIds.includes(state.activeUserId)) {
        return request;
      }

      return {
        ...request,
        interestedIds: [...request.interestedIds, state.activeUserId]
      };
    });

    updateState({ ...state, requests: nextRequests });
    showNotice("Interest sent.");
  }

  function acceptInterest(requestId: string, userId: string) {
    const nextRequests = state.requests.map((request) => {
      if (request.id !== requestId || request.creatorId !== state.activeUserId) {
        return request;
      }

      return {
        ...request,
        status: "matched" as const,
        acceptedUserId: userId
      };
    });

    updateState({ ...state, requests: nextRequests });
    setActiveTab("matches");
    showNotice("Match created.");
  }

  function createRequest() {
    if (!requestForm.area.trim() || !requestForm.date.trim() || !requestForm.time.trim()) {
      showNotice("Add an area, date, and time.");
      return;
    }

    const nextRequest: PlayRequest = {
      id: `request-${Date.now()}`,
      creatorId: state.activeUserId,
      area: requestForm.area.trim(),
      date: requestForm.date.trim(),
      time: requestForm.time.trim(),
      level: requestForm.level,
      format: requestForm.format,
      note: requestForm.note.trim(),
      status: "open",
      interestedIds: [],
      acceptedUserId: null,
      createdAt: Date.now()
    };

    updateState({
      ...state,
      requests: [nextRequest, ...state.requests]
    });
    setRequestForm(createEmptyRequestForm());
    setActiveTab("requests");
    showNotice("Your request is live.");
  }

  function saveProfile() {
    if (!profileForm.name.trim() || !profileForm.area.trim()) {
      showNotice("Add your name and area.");
      return;
    }

    updateState({
      ...state,
      players: state.players.map((player) =>
        player.id === state.activeUserId
          ? {
              ...player,
              name: profileForm.name.trim(),
              level: profileForm.level,
              area: profileForm.area.trim(),
              bio: profileForm.bio.trim()
            }
          : player
      )
    });
    showNotice("Profile saved.");
  }

  function resetDemoData() {
    updateState(demoState);
    setRequestForm(createEmptyRequestForm());
    setActiveTab("requests");
    showNotice("Demo data reset.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>R</Text>
            </View>
            <View>
              <Text style={styles.brandName}>RallyMate</Text>
              <Text style={styles.brandSubline}>Birmingham tennis matches</Text>
            </View>
          </View>
          <View style={styles.modePill}>
            <Text style={styles.modePillText}>Mobile MVP</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroller}
          contentContainerStyle={styles.tabRow}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === tab.key && styles.tabButtonTextActive
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          keyboardShouldPersistTaps="handled"
        >
          <HeroPanel
            activeName={activePlayer?.name || "Guest player"}
            activeMeta={`${formatLevel(activePlayer?.level || "beginner")} - ${
              activePlayer?.area || "Birmingham"
            }`}
            initials={getInitials(activePlayer?.name || "RM")}
            openCount={state.requests.filter((request) => request.status === "open").length}
            matchCount={matches.length}
          />

          {activeTab === "requests" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.eyebrow}>Open requests</Text>
                  <Text style={styles.sectionTitle}>Nearby players</Text>
                </View>
                <Pressable style={styles.primaryButton} onPress={() => setActiveTab("create")}>
                  <Text style={styles.primaryButtonText}>New</Text>
                </Pressable>
              </View>

              <View style={styles.filterPanel}>
                <FieldLabel label="Area">
                  <TextInput
                    value={areaFilter}
                    onChangeText={setAreaFilter}
                    placeholder="Any area"
                    placeholderTextColor="#87918d"
                    style={styles.input}
                  />
                </FieldLabel>
                <SegmentedControl
                  label="Level"
                  options={["", ...levels]}
                  value={levelFilter}
                  onChange={(value) => setLevelFilter(value as SkillLevel | "")}
                  formatLabel={(value) => (value ? formatLevel(value as SkillLevel) : "Any")}
                />
              </View>

              {openRequests.length ? (
                openRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    creator={getPlayer(request.creatorId)}
                    activeUserId={state.activeUserId}
                    interestedPlayers={request.interestedIds
                      .map((id) => getPlayer(id))
                      .filter(Boolean)}
                    onInterest={() => markInterest(request.id)}
                    onAccept={(userId) => acceptInterest(request.id, userId)}
                  />
                ))
              ) : (
                <EmptyState text="No open requests match these filters yet." />
              )}
            </View>
          )}

          {activeTab === "create" && (
            <View style={styles.section}>
              <Text style={styles.eyebrow}>Create request</Text>
              <Text style={styles.sectionTitle}>Say when you want to play</Text>

              <View style={styles.formCard}>
                <FieldLabel label="Area or postcode">
                  <TextInput
                    value={requestForm.area}
                    onChangeText={(area) => setRequestForm({ ...requestForm, area })}
                    placeholder="Moseley or B13"
                    placeholderTextColor="#87918d"
                    style={styles.input}
                  />
                </FieldLabel>
                <FieldLabel label="Date">
                  <TextInput
                    value={requestForm.date}
                    onChangeText={(date) => setRequestForm({ ...requestForm, date })}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#87918d"
                    style={styles.input}
                  />
                </FieldLabel>
                <FieldLabel label="Time window">
                  <TextInput
                    value={requestForm.time}
                    onChangeText={(time) => setRequestForm({ ...requestForm, time })}
                    placeholder="18:00 to 20:00"
                    placeholderTextColor="#87918d"
                    style={styles.input}
                  />
                </FieldLabel>
                <SegmentedControl
                  label="Skill level wanted"
                  options={levels}
                  value={requestForm.level}
                  onChange={(level) =>
                    setRequestForm({ ...requestForm, level: level as SkillLevel })
                  }
                  formatLabel={(value) => formatLevel(value as SkillLevel)}
                />
                <SegmentedControl
                  label="Format"
                  options={["Singles", "Doubles"]}
                  value={requestForm.format}
                  onChange={(format) =>
                    setRequestForm({ ...requestForm, format: format as PlayFormat })
                  }
                />
                <FieldLabel label="Note">
                  <TextInput
                    value={requestForm.note}
                    onChangeText={(note) => setRequestForm({ ...requestForm, note })}
                    placeholder="I can bring balls and play a friendly set."
                    placeholderTextColor="#87918d"
                    style={[styles.input, styles.textarea]}
                    multiline
                  />
                </FieldLabel>
                <Pressable style={styles.primaryButtonWide} onPress={createRequest}>
                  <Text style={styles.primaryButtonText}>Post request</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === "matches" && (
            <View style={styles.section}>
              <Text style={styles.eyebrow}>Accepted requests</Text>
              <Text style={styles.sectionTitle}>Your matches</Text>
              {matches.length ? (
                matches.map((request) => (
                  <MatchCard
                    key={request.id}
                    request={request}
                    creator={getPlayer(request.creatorId)}
                    acceptedPlayer={getPlayer(request.acceptedUserId)}
                  />
                ))
              ) : (
                <EmptyState text="No matches yet. Accept an interested player to create one." />
              )}
            </View>
          )}

          {activeTab === "profile" && (
            <View style={styles.section}>
              <Text style={styles.eyebrow}>Profile</Text>
              <Text style={styles.sectionTitle}>Your player details</Text>

              <View style={styles.formCard}>
                <FieldLabel label="Display name">
                  <TextInput
                    value={profileForm.name}
                    onChangeText={(name) => setProfileForm({ ...profileForm, name })}
                    style={styles.input}
                  />
                </FieldLabel>
                <SegmentedControl
                  label="Skill level"
                  options={levels}
                  value={profileForm.level}
                  onChange={(level) =>
                    setProfileForm({ ...profileForm, level: level as SkillLevel })
                  }
                  formatLabel={(value) => formatLevel(value as SkillLevel)}
                />
                <FieldLabel label="Preferred area or postcode">
                  <TextInput
                    value={profileForm.area}
                    onChangeText={(area) => setProfileForm({ ...profileForm, area })}
                    style={styles.input}
                  />
                </FieldLabel>
                <FieldLabel label="Short bio">
                  <TextInput
                    value={profileForm.bio}
                    onChangeText={(bio) => setProfileForm({ ...profileForm, bio })}
                    style={[styles.input, styles.textarea]}
                    multiline
                  />
                </FieldLabel>
                <Pressable style={styles.primaryButtonWide} onPress={saveProfile}>
                  <Text style={styles.primaryButtonText}>Save profile</Text>
                </Pressable>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.eyebrow}>Demo player</Text>
                <View style={styles.playerSwitchList}>
                  {state.players.map((player) => (
                    <Pressable
                      key={player.id}
                      style={[
                        styles.playerSwitch,
                        player.id === state.activeUserId && styles.playerSwitchActive
                      ]}
                      onPress={() => switchDemoPlayer(player.id)}
                    >
                      <Text
                        style={[
                          styles.playerSwitchName,
                          player.id === state.activeUserId && styles.playerSwitchNameActive
                        ]}
                      >
                        {player.name}
                      </Text>
                      <Text style={styles.playerSwitchMeta}>
                        {formatLevel(player.level)} - {player.area}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable style={styles.secondaryButtonWide} onPress={resetDemoData}>
                  <Text style={styles.secondaryButtonText}>Reset demo data</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        {notice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeroPanel({
  activeName,
  activeMeta,
  initials,
  openCount,
  matchCount
}: {
  activeName: string;
  activeMeta: string;
  initials: string;
  openCount: number;
  matchCount: number;
}) {
  return (
    <View style={styles.heroPanel}>
      <View>
        <Text style={styles.eyebrow}>Today</Text>
        <Text style={styles.heroTitle}>Find a player nearby.</Text>
      </View>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={styles.profileName}>{activeName}</Text>
          <Text style={styles.profileMeta}>{activeMeta}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <StatBox label="Open requests" value={openCount} />
        <StatBox label="Matches" value={matchCount} />
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
  formatLabel = (option) => option
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  formatLabel?: (option: string) => string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.segmentWrap}>
        {options.map((option) => {
          const isActive = option === value;
          return (
            <Pressable
              key={option || "any"}
              onPress={() => onChange(option)}
              style={[styles.segment, isActive && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {formatLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function RequestCard({
  request,
  creator,
  activeUserId,
  interestedPlayers,
  onInterest,
  onAccept
}: {
  request: PlayRequest;
  creator?: { id: string; name: string; level: SkillLevel; area: string };
  activeUserId: string;
  interestedPlayers: Array<
    { id: string; name: string; level: SkillLevel; area: string } | undefined
  >;
  onInterest: () => void;
  onAccept: (userId: string) => void;
}) {
  const isOwnRequest = request.creatorId === activeUserId;
  const hasInterest = request.interestedIds.includes(activeUserId);
  const visibleInterestedPlayers = interestedPlayers.filter(Boolean) as Array<{
    id: string;
    name: string;
    level: SkillLevel;
    area: string;
  }>;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopline}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.eyebrow}>{creator?.name || "Player"}</Text>
          <Text style={styles.cardTitle}>
            {request.area} - {formatDate(request.date)}
          </Text>
        </View>
        <Tag text={request.format} />
      </View>
      <View style={styles.tagRow}>
        <Tag text={request.time} />
        <Tag text={formatLevel(request.level)} />
        {isOwnRequest ? <Tag text="Your request" tone="warning" /> : null}
      </View>
      <Text style={styles.cardNote}>{request.note || "No extra note added."}</Text>

      {isOwnRequest && visibleInterestedPlayers.length ? (
        <View style={styles.interestPanel}>
          {visibleInterestedPlayers.map((player) => (
            <View key={player.id} style={styles.interestRow}>
              <View style={styles.interestText}>
                <Text style={styles.interestName}>{player.name}</Text>
                <Text style={styles.interestMeta}>
                  {formatLevel(player.level)} - {player.area}
                </Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={() => onAccept(player.id)}>
                <Text style={styles.primaryButtonText}>Accept</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.mutedText}>{visibleInterestedPlayers.length} interested</Text>
        {!isOwnRequest ? (
          <Pressable style={styles.primaryButton} onPress={onInterest}>
            <Text style={styles.primaryButtonText}>
              {hasInterest ? "Interest sent" : "I'm interested"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function MatchCard({
  request,
  creator,
  acceptedPlayer
}: {
  request: PlayRequest;
  creator?: { name: string; level: SkillLevel; area: string; bio: string };
  acceptedPlayer?: { name: string; level: SkillLevel; area: string; bio: string };
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopline}>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.eyebrow}>{request.area}</Text>
          <Text style={styles.cardTitle}>
            {formatDate(request.date)} - {request.time}
          </Text>
        </View>
        <Tag text={request.format} />
      </View>
      <View style={styles.matchGrid}>
        <PlayerBox label="Requester" player={creator} />
        <PlayerBox label="Accepted player" player={acceptedPlayer} />
      </View>
      <View style={styles.chatPlaceholder}>
        <Text style={styles.chatPlaceholderText}>
          Private chat will be added in version 2.
        </Text>
      </View>
    </View>
  );
}

function PlayerBox({
  label,
  player
}: {
  label: string;
  player?: { name: string; level: SkillLevel; area: string; bio: string };
}) {
  if (!player) return null;

  return (
    <View style={styles.playerBox}>
      <Text style={styles.mutedText}>{label}</Text>
      <Text style={styles.playerBoxName}>{player.name}</Text>
      <Text style={styles.playerBoxMeta}>
        {formatLevel(player.level)} - {player.area}
      </Text>
      <Text style={styles.playerBoxBio}>{player.bio}</Text>
    </View>
  );
}

function Tag({ text, tone = "default" }: { text: string; tone?: "default" | "warning" }) {
  return (
    <View style={[styles.tag, tone === "warning" && styles.tagWarning]}>
      <Text style={[styles.tagText, tone === "warning" && styles.tagWarningText]}>
        {text}
      </Text>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{text}</Text>
    </View>
  );
}

function formatLevel(level: SkillLevel) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date(year, month - 1, day));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f9f5"
  },
  keyboardView: {
    flex: 1
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#12352b",
    alignItems: "center",
    justifyContent: "center"
  },
  brandMarkText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900"
  },
  brandName: {
    color: "#17231f",
    fontSize: 20,
    fontWeight: "900"
  },
  brandSubline: {
    color: "#65736d",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 1
  },
  modePill: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 999,
    backgroundColor: "#edf4ec",
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  modePillText: {
    color: "#184b35",
    fontSize: 12,
    fontWeight: "800"
  },
  tabScroller: {
    maxHeight: 54
  },
  tabRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    gap: 8
  },
  tabButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dce4dd",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  tabButtonActive: {
    backgroundColor: "#12352b",
    borderColor: "#12352b"
  },
  tabButtonText: {
    color: "#65736d",
    fontWeight: "800"
  },
  tabButtonTextActive: {
    color: "#ffffff"
  },
  content: {
    flex: 1
  },
  contentInner: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 14
  },
  heroPanel: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 16,
    shadowColor: "#12352b",
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3
  },
  eyebrow: {
    color: "#b95f3c",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 6
  },
  heroTitle: {
    color: "#17231f",
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900"
  },
  profileCard: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#edf4ec",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#184b35",
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  profileText: {
    flex: 1
  },
  profileName: {
    color: "#17231f",
    fontWeight: "900",
    fontSize: 16
  },
  profileMeta: {
    color: "#65736d",
    fontSize: 13,
    marginTop: 3
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 13
  },
  statValue: {
    color: "#17231f",
    fontSize: 26,
    fontWeight: "900"
  },
  statLabel: {
    color: "#65736d",
    fontSize: 12,
    marginTop: 3
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  sectionTitle: {
    color: "#17231f",
    fontSize: 25,
    lineHeight: 29,
    fontWeight: "900"
  },
  filterPanel: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#edf4ec",
    padding: 13,
    gap: 12
  },
  formCard: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 15,
    gap: 13
  },
  field: {
    gap: 7
  },
  fieldLabel: {
    color: "#65736d",
    fontSize: 12,
    fontWeight: "900"
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#17231f",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  segmentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  segment: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    borderColor: "#184b35",
    backgroundColor: "#d9eee1"
  },
  segmentText: {
    color: "#65736d",
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: "#184b35"
  },
  card: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 15,
    gap: 13
  },
  cardTopline: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  cardTitleGroup: {
    flex: 1
  },
  cardTitle: {
    color: "#17231f",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900"
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7
  },
  tag: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: "#edf4ec",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center"
  },
  tagWarning: {
    backgroundColor: "#fff3d7"
  },
  tagText: {
    color: "#184b35",
    fontSize: 12,
    fontWeight: "900"
  },
  tagWarningText: {
    color: "#7a5415"
  },
  cardNote: {
    color: "#65736d",
    fontSize: 14,
    lineHeight: 20
  },
  interestPanel: {
    borderRadius: 8,
    backgroundColor: "#f8faf8",
    padding: 10,
    gap: 8
  },
  interestRow: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  interestText: {
    flex: 1
  },
  interestName: {
    color: "#17231f",
    fontWeight: "900"
  },
  interestMeta: {
    color: "#65736d",
    fontSize: 12,
    marginTop: 2
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: "#184b35",
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonWide: {
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: "#184b35",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "900"
  },
  secondaryButtonWide: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#184b35",
    fontWeight: "900"
  },
  mutedText: {
    color: "#65736d",
    fontSize: 13
  },
  matchGrid: {
    gap: 10
  },
  playerBox: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#f8faf8",
    padding: 12
  },
  playerBoxName: {
    color: "#17231f",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4
  },
  playerBoxMeta: {
    color: "#65736d",
    marginTop: 3
  },
  playerBoxBio: {
    color: "#65736d",
    lineHeight: 19,
    marginTop: 6
  },
  chatPlaceholder: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: "#f8faf8",
    padding: 12
  },
  chatPlaceholderText: {
    color: "#65736d",
    lineHeight: 19
  },
  emptyState: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 18
  },
  emptyStateText: {
    color: "#65736d",
    textAlign: "center",
    lineHeight: 20
  },
  playerSwitchList: {
    gap: 9
  },
  playerSwitch: {
    borderWidth: 1,
    borderColor: "#dce4dd",
    borderRadius: 8,
    backgroundColor: "#ffffff",
    padding: 12
  },
  playerSwitchActive: {
    borderColor: "#184b35",
    backgroundColor: "#d9eee1"
  },
  playerSwitchName: {
    color: "#17231f",
    fontWeight: "900"
  },
  playerSwitchNameActive: {
    color: "#184b35"
  },
  playerSwitchMeta: {
    color: "#65736d",
    fontSize: 13,
    marginTop: 3
  },
  notice: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 8,
    backgroundColor: "#12352b",
    padding: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  noticeText: {
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center"
  }
});
