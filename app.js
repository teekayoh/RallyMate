import { supabaseConfig } from "./config.js";

const storageKey = "rallymate-state-v1";
const supabaseModuleUrl = "https://esm.sh/@supabase/supabase-js@2";

const demoState = {
  mode: "local",
  activeUserId: "user-amina",
  users: [
    {
      id: "user-amina",
      name: "Amina Malik",
      email: "amina@example.com",
      level: "intermediate",
      area: "Edgbaston",
      bio: "Free most weekday evenings. I prefer friendly singles and can travel across south Birmingham."
    },
    {
      id: "user-james",
      name: "James Carter",
      email: "james@example.com",
      level: "improver",
      area: "Moseley",
      bio: "Getting back into tennis and looking for regular rallies."
    },
    {
      id: "user-sophia",
      name: "Sophia Evans",
      email: "sophia@example.com",
      level: "advanced",
      area: "Harborne",
      bio: "Competitive club player. Happy to hit or play a proper set."
    },
    {
      id: "user-daniel",
      name: "Daniel Okafor",
      email: "daniel@example.com",
      level: "intermediate",
      area: "Sutton Coldfield",
      bio: "Usually available after work and on Sunday mornings."
    }
  ],
  requests: [
    {
      id: "request-1",
      creatorId: "user-james",
      area: "Moseley",
      date: getRelativeDate(1),
      time: "18:00 to 20:00",
      level: "improver",
      format: "Singles",
      note: "Looking for a relaxed hit after work. Cannon Hill or Moseley works well.",
      status: "open",
      interestedIds: ["user-amina"],
      acceptedUserId: null,
      createdAt: Date.now() - 1000 * 60 * 80
    },
    {
      id: "request-2",
      creatorId: "user-sophia",
      area: "Harborne",
      date: getRelativeDate(2),
      time: "09:00 to 11:00",
      level: "advanced",
      format: "Singles",
      note: "Want to play a proper set and do some serving practice.",
      status: "open",
      interestedIds: [],
      acceptedUserId: null,
      createdAt: Date.now() - 1000 * 60 * 150
    },
    {
      id: "request-3",
      creatorId: "user-amina",
      area: "Edgbaston",
      date: getRelativeDate(3),
      time: "19:00 to 21:00",
      level: "intermediate",
      format: "Doubles",
      note: "We have two players already and need two more for doubles.",
      status: "open",
      interestedIds: ["user-james", "user-daniel"],
      acceptedUserId: null,
      createdAt: Date.now() - 1000 * 60 * 210
    }
  ]
};

const elements = {
  areaFilter: document.querySelector("#areaFilter"),
  levelFilter: document.querySelector("#levelFilter"),
  requestList: document.querySelector("#requestList"),
  matchList: document.querySelector("#matchList"),
  requestForm: document.querySelector("#requestForm"),
  profileForm: document.querySelector("#profileForm"),
  signInForm: document.querySelector("#signInForm"),
  signUpForm: document.querySelector("#signUpForm"),
  signOutButton: document.querySelector("#signOutButton"),
  openCount: document.querySelector("#openCount"),
  matchCount: document.querySelector("#matchCount"),
  activeAvatar: document.querySelector("#activeAvatar"),
  activeName: document.querySelector("#activeName"),
  activeMeta: document.querySelector("#activeMeta"),
  backendStatus: document.querySelector("#backendStatus"),
  authPanel: document.querySelector("#authPanel"),
  profileEditor: document.querySelector("#profileEditor"),
  toast: document.querySelector("#toast")
};

let backend;
let state = emptyState("local");

bootstrap();

async function bootstrap() {
  backend = await createBackend();
  state = await backend.loadState();
  bindEvents();
  fillProfileForm();
  render();
}

function bindEvents() {
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.viewTarget));
  });

  elements.areaFilter.addEventListener("input", render);
  elements.levelFilter.addEventListener("change", render);
  elements.requestForm.addEventListener("submit", createRequest);
  elements.profileForm.addEventListener("submit", saveProfile);
  elements.signInForm.addEventListener("submit", signIn);
  elements.signUpForm.addEventListener("submit", signUp);
  elements.signOutButton.addEventListener("click", signOut);

  document.addEventListener("click", async (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;

    const requestId = action.dataset.requestId;
    const userId = action.dataset.userId;

    if (action.dataset.action === "interest") {
      await markInterest(requestId);
    }

    if (action.dataset.action === "accept") {
      await acceptInterest(requestId, userId);
    }

    if (action.dataset.action === "view-match") {
      setView("matches");
    }
  });
}

async function createBackend() {
  if (!hasSupabaseConfig()) {
    return createLocalBackend();
  }

  try {
    const { createClient } = await import(supabaseModuleUrl);
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey);
    return createSupabaseBackend(client);
  } catch (error) {
    console.error(error);
    showToast("Supabase client could not load. Demo mode is still available.");
    return createLocalBackend();
  }
}

function createLocalBackend() {
  return {
    mode: "local",
    async loadState() {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return structuredClone(demoState);

      try {
        return normalizeLoadedState(JSON.parse(stored), "local");
      } catch {
        return structuredClone(demoState);
      }
    },
    async signIn() {
      showToast("Demo mode is already signed in as Amina.");
      return this.loadState();
    },
    async signUp() {
      showToast("Add Supabase credentials in config.js to create accounts.");
      return this.loadState();
    },
    async signOut() {
      showToast("Demo mode keeps one active player for testing.");
      return this.loadState();
    },
    async saveProfile(profile) {
      const next = await this.loadState();
      const user = next.users.find((item) => item.id === next.activeUserId);
      Object.assign(user, profile);
      saveLocalState(next);
      return next;
    },
    async createRequest(request) {
      const next = await this.loadState();
      next.requests.unshift({
        id: `request-${crypto.randomUUID()}`,
        creatorId: next.activeUserId,
        ...request,
        status: "open",
        interestedIds: [],
        acceptedUserId: null,
        createdAt: Date.now()
      });
      saveLocalState(next);
      return next;
    },
    async markInterest(requestId) {
      const next = await this.loadState();
      const request = next.requests.find((item) => item.id === requestId);
      if (!request || request.creatorId === next.activeUserId) return next;

      if (!request.interestedIds.includes(next.activeUserId)) {
        request.interestedIds.push(next.activeUserId);
      }

      saveLocalState(next);
      return next;
    },
    async acceptInterest(requestId, userId) {
      const next = await this.loadState();
      const request = next.requests.find((item) => item.id === requestId);
      if (!request || request.creatorId !== next.activeUserId) return next;

      request.status = "matched";
      request.acceptedUserId = userId;
      saveLocalState(next);
      return next;
    }
  };
}

function createSupabaseBackend(client) {
  return {
    mode: "supabase",
    async loadState() {
      const {
        data: { session },
        error: sessionError
      } = await client.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.user) return emptyState("supabase");

      await ensureProfile(client, session.user);

      const [profilesResult, requestsResult, interestsResult] = await Promise.all([
        client.from("profiles").select("*").order("display_name"),
        client.from("play_requests").select("*").order("play_date", { ascending: true }),
        client.from("request_interests").select("*")
      ]);

      assertSupabaseResult(profilesResult);
      assertSupabaseResult(requestsResult);
      assertSupabaseResult(interestsResult);

      return mapSupabaseState({
        activeUserId: session.user.id,
        profiles: profilesResult.data || [],
        requests: requestsResult.data || [],
        interests: interestsResult.data || []
      });
    },
    async signIn({ email, password }) {
      const result = await client.auth.signInWithPassword({ email, password });
      assertSupabaseResult(result);
      return this.loadState();
    },
    async signUp({ email, password, name, level, area }) {
      const result = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            skill_level: level,
            preferred_area: area
          }
        }
      });
      assertSupabaseResult(result);

      if (result.data.session?.user) {
        await ensureProfile(client, result.data.session.user, { name, level, area });
      }

      return this.loadState();
    },
    async signOut() {
      const result = await client.auth.signOut();
      assertSupabaseResult(result);
      return emptyState("supabase");
    },
    async saveProfile(profile) {
      requireSession();
      const result = await client.from("profiles").upsert({
        id: state.activeUserId,
        display_name: profile.name,
        skill_level: profile.level,
        preferred_area: profile.area,
        bio: profile.bio
      });
      assertSupabaseResult(result);
      return this.loadState();
    },
    async createRequest(request) {
      requireSession();
      const result = await client.from("play_requests").insert({
        creator_id: state.activeUserId,
        area: request.area,
        play_date: request.date,
        time_window: request.time,
        skill_level_wanted: request.level,
        format: request.format.toLowerCase(),
        note: request.note
      });
      assertSupabaseResult(result);
      return this.loadState();
    },
    async markInterest(requestId) {
      requireSession();
      const result = await client.from("request_interests").insert({
        request_id: requestId,
        player_id: state.activeUserId
      });

      if (result.error?.code !== "23505") {
        assertSupabaseResult(result);
      }

      return this.loadState();
    },
    async acceptInterest(requestId, userId) {
      requireSession();
      const result = await client
        .from("play_requests")
        .update({
          status: "matched",
          accepted_player_id: userId
        })
        .eq("id", requestId);
      assertSupabaseResult(result);
      return this.loadState();
    }
  };
}

function emptyState(mode) {
  return {
    mode,
    activeUserId: null,
    users: [],
    requests: []
  };
}

function normalizeLoadedState(loaded, mode) {
  return {
    ...structuredClone(demoState),
    ...loaded,
    mode
  };
}

function saveLocalState(nextState) {
  localStorage.setItem(storageKey, JSON.stringify(nextState));
}

function hasSupabaseConfig() {
  return Boolean(
    supabaseConfig.url &&
      supabaseConfig.anonKey &&
      supabaseConfig.url.startsWith("https://") &&
      supabaseConfig.anonKey.length > 20
  );
}

async function ensureProfile(client, user, fallback = {}) {
  const existing = await client.from("profiles").select("id").eq("id", user.id).maybeSingle();
  assertSupabaseResult(existing);

  if (existing.data) return;

  const metadata = user.user_metadata || {};
  const result = await client.from("profiles").insert({
    id: user.id,
    display_name:
      fallback.name || metadata.display_name || user.email?.split("@")[0] || "New player",
    skill_level: fallback.level || metadata.skill_level || "beginner",
    preferred_area: fallback.area || metadata.preferred_area || "Birmingham",
    bio: ""
  });
  assertSupabaseResult(result);
}

function mapSupabaseState({ activeUserId, profiles, requests, interests }) {
  const users = profiles.map((profile) => ({
    id: profile.id,
    name: profile.display_name,
    level: profile.skill_level,
    area: profile.preferred_area,
    bio: profile.bio || ""
  }));

  const mappedRequests = requests.map((request) => ({
    id: request.id,
    creatorId: request.creator_id,
    area: request.area,
    date: request.play_date,
    time: request.time_window,
    level: request.skill_level_wanted,
    format: formatPlayFormat(request.format),
    note: request.note || "",
    status: request.status,
    acceptedUserId: request.accepted_player_id,
    interestedIds: interests
      .filter((interest) => interest.request_id === request.id)
      .map((interest) => interest.player_id),
    createdAt: new Date(request.created_at).getTime()
  }));

  return {
    mode: "supabase",
    activeUserId,
    users,
    requests: mappedRequests
  };
}

function assertSupabaseResult(result) {
  if (result.error) {
    throw result.error;
  }
}

function requireSession() {
  if (!state.activeUserId) {
    setView("profile");
    throw new Error("Please sign in first.");
  }
}

function getRelativeDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getUser(userId) {
  return state.users.find((user) => user.id === userId);
}

function getActiveUser() {
  return getUser(state.activeUserId);
}

function formatLevel(level) {
  if (!level) return "Beginner";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatPlayFormat(format) {
  return format === "doubles" ? "Doubles" : "Singles";
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short"
  }).format(new Date(year, month - 1, day));
}

function initials(name) {
  return (name || "RM")
    .split(" ")
    .map((part) => part.at(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.viewTarget === viewName);
  });

  history.replaceState(null, "", `#${viewName}`);
}

function filteredRequests() {
  const area = elements.areaFilter.value.trim().toLowerCase();
  const level = elements.levelFilter.value;

  return state.requests
    .filter((request) => request.status === "open")
    .filter((request) => !area || request.area.toLowerCase().includes(area))
    .filter((request) => !level || request.level === level)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function render() {
  renderActiveProfile();
  renderAuthState();
  renderStats();
  renderRequests();
  renderMatches();
}

function renderActiveProfile() {
  const user = getActiveUser();

  if (!user) {
    elements.activeAvatar.textContent = "RM";
    elements.activeName.textContent = "Guest player";
    elements.activeMeta.textContent = state.mode === "supabase" ? "Supabase mode" : "Demo mode";
    return;
  }

  elements.activeAvatar.textContent = initials(user.name);
  elements.activeName.textContent = user.name;
  elements.activeMeta.textContent = `${formatLevel(user.level)} - ${user.area}`;
}

function renderAuthState() {
  const isSupabase = state.mode === "supabase";
  const isSignedIn = Boolean(state.activeUserId);

  elements.backendStatus.textContent = isSupabase
    ? "Supabase connected"
    : "Demo mode";
  elements.authPanel.classList.toggle("is-hidden", !isSupabase || isSignedIn);
  elements.profileEditor.classList.toggle("is-hidden", isSupabase && !isSignedIn);
  elements.signOutButton.classList.toggle("is-hidden", !isSupabase || !isSignedIn);
}

function renderStats() {
  elements.openCount.textContent = state.requests.filter(
    (request) => request.status === "open"
  ).length;
  elements.matchCount.textContent = state.requests.filter((request) =>
    isMatchForActiveUser(request)
  ).length;
}

function renderRequests() {
  if (!state.activeUserId && state.mode === "supabase") {
    elements.requestList.innerHTML = `
      <div class="empty-state">
        <p>Sign in to view local tennis requests.</p>
      </div>
    `;
    return;
  }

  const requests = filteredRequests();

  if (!requests.length) {
    elements.requestList.innerHTML = `
      <div class="empty-state">
        <p>No open requests match these filters yet.</p>
      </div>
    `;
    return;
  }

  elements.requestList.innerHTML = requests.map(renderRequestCard).join("");
}

function renderRequestCard(request) {
  const creator = getUser(request.creatorId);
  const isOwnRequest = request.creatorId === state.activeUserId;
  const hasInterest = request.interestedIds.includes(state.activeUserId);
  const interestedUsers = request.interestedIds.map(getUser).filter(Boolean);

  return `
    <article class="request-card">
      <div class="card-topline">
        <div>
          <p class="eyebrow">${escapeHtml(creator?.name || "Player")}</p>
          <h3 class="card-title">${escapeHtml(request.area)} - ${formatDate(request.date)}</h3>
        </div>
        <span class="tag">${escapeHtml(request.format)}</span>
      </div>

      <div class="tag-row">
        <span class="tag">${escapeHtml(request.time)}</span>
        <span class="tag">${formatLevel(request.level)}</span>
        ${isOwnRequest ? '<span class="tag is-warning">Your request</span>' : ""}
      </div>

      <p class="card-note">${escapeHtml(request.note || "No extra note added.")}</p>

      ${renderInterestPanel(request, interestedUsers, isOwnRequest)}

      <div class="card-actions">
        <p class="muted">${interestedUsers.length} interested</p>
        ${
          isOwnRequest
            ? '<button class="secondary-button" data-action="view-match" type="button">View matches</button>'
            : `<button class="primary-button" data-action="interest" data-request-id="${request.id}" type="button">
                ${hasInterest ? "Interest sent" : "I am interested"}
              </button>`
        }
      </div>
    </article>
  `;
}

function renderInterestPanel(request, interestedUsers, isOwnRequest) {
  if (!isOwnRequest || !interestedUsers.length) {
    return "";
  }

  return `
    <div class="interest-panel">
      ${interestedUsers
        .map(
          (user) => `
            <div class="interest-row">
              <p><strong>${escapeHtml(user.name)}</strong><br><span class="muted">${formatLevel(user.level)} - ${escapeHtml(user.area)}</span></p>
              <button
                class="primary-button"
                data-action="accept"
                data-request-id="${request.id}"
                data-user-id="${user.id}"
                type="button"
              >
                Accept
              </button>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderMatches() {
  const matches = state.requests.filter((request) => isMatchForActiveUser(request));

  if (!matches.length) {
    elements.matchList.innerHTML = `
      <div class="empty-state">
        <p>No matches yet. Accept an interested player to create one.</p>
      </div>
    `;
    return;
  }

  elements.matchList.innerHTML = matches
    .map((request) => {
      const creator = getUser(request.creatorId);
      const accepted = getUser(request.acceptedUserId);

      return `
        <article class="match-card">
          <div class="card-topline">
            <div>
              <p class="eyebrow">${escapeHtml(request.area)}</p>
              <h3 class="card-title">${formatDate(request.date)} - ${escapeHtml(request.time)}</h3>
            </div>
            <span class="tag">${escapeHtml(request.format)}</span>
          </div>

          <div class="match-grid">
            ${renderPlayerBox("Requester", creator)}
            ${renderPlayerBox("Accepted player", accepted)}
          </div>

          <div class="chat-placeholder">
            Private chat will be added in version 2. For this MVP, this page confirms
            who is matched and keeps the court-planning space ready.
          </div>
        </article>
      `;
    })
    .join("");
}

function renderPlayerBox(label, user) {
  if (!user) return "";

  return `
    <div class="player-box">
      <span class="muted">${label}</span>
      <strong>${escapeHtml(user.name)}</strong>
      <span>${formatLevel(user.level)} - ${escapeHtml(user.area)}</span>
      <span>${escapeHtml(user.bio)}</span>
    </div>
  `;
}

function isMatchForActiveUser(request) {
  return (
    request.status === "matched" &&
    (request.creatorId === state.activeUserId ||
      request.acceptedUserId === state.activeUserId)
  );
}

async function signIn(event) {
  event.preventDefault();
  await runAction(async () => {
    const formData = new FormData(event.currentTarget);
    state = await backend.signIn({
      email: formData.get("email").toString().trim(),
      password: formData.get("password").toString()
    });
    event.currentTarget.reset();
    fillProfileForm();
    render();
    showToast("Signed in.");
  });
}

async function signUp(event) {
  event.preventDefault();
  await runAction(async () => {
    const formData = new FormData(event.currentTarget);
    state = await backend.signUp({
      name: formData.get("name").toString().trim(),
      email: formData.get("email").toString().trim(),
      password: formData.get("password").toString(),
      level: formData.get("level").toString(),
      area: formData.get("area").toString().trim()
    });
    event.currentTarget.reset();
    fillProfileForm();
    render();
    showToast(state.activeUserId ? "Account created." : "Check your email to confirm.");
  });
}

async function signOut() {
  await runAction(async () => {
    state = await backend.signOut();
    fillProfileForm();
    render();
    setView("profile");
    showToast("Signed out.");
  });
}

async function markInterest(requestId) {
  await runAction(async () => {
    state = await backend.markInterest(requestId);
    render();
    showToast("Interest sent. The requester can now accept you.");
  });
}

async function acceptInterest(requestId, userId) {
  await runAction(async () => {
    state = await backend.acceptInterest(requestId, userId);
    render();
    setView("matches");
    showToast("Match created. Chat comes next in version 2.");
  });
}

async function createRequest(event) {
  event.preventDefault();

  if (!state.activeUserId) {
    setView("profile");
    showToast("Sign in to post a play request.");
    return;
  }

  await runAction(async () => {
    const formData = new FormData(event.currentTarget);
    state = await backend.createRequest({
      area: formData.get("area").toString().trim(),
      date: formData.get("date").toString(),
      time: formData.get("time").toString().trim(),
      level: formData.get("level").toString(),
      format: formData.get("format").toString(),
      note: formData.get("note").toString().trim()
    });

    event.currentTarget.reset();
    render();
    setView("requests");
    showToast("Your play request is live.");
  });
}

function fillProfileForm() {
  const user = getActiveUser();

  elements.profileForm.elements.name.value = user?.name || "";
  elements.profileForm.elements.level.value = user?.level || "beginner";
  elements.profileForm.elements.area.value = user?.area || "";
  elements.profileForm.elements.bio.value = user?.bio || "";
}

async function saveProfile(event) {
  event.preventDefault();

  await runAction(async () => {
    const form = event.currentTarget;
    state = await backend.saveProfile({
      name: form.elements.name.value.trim(),
      level: form.elements.level.value,
      area: form.elements.area.value.trim(),
      bio: form.elements.bio.value.trim()
    });
    fillProfileForm();
    render();
    showToast("Profile saved.");
  });
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Something went wrong.");
  }
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}
