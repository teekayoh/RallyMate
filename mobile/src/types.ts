export type SkillLevel = "beginner" | "improver" | "intermediate" | "advanced";

export type PlayFormat = "Singles" | "Doubles";

export type RequestStatus = "open" | "matched" | "cancelled";

export type Player = {
  id: string;
  name: string;
  email: string;
  level: SkillLevel;
  area: string;
  bio: string;
};

export type PlayRequest = {
  id: string;
  creatorId: string;
  area: string;
  date: string;
  time: string;
  level: SkillLevel;
  format: PlayFormat;
  note: string;
  status: RequestStatus;
  interestedIds: string[];
  acceptedUserId: string | null;
  createdAt: number;
};

export type RallyMateState = {
  activeUserId: string;
  players: Player[];
  requests: PlayRequest[];
};

export type TabKey = "requests" | "create" | "matches" | "profile";
