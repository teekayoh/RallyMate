import { Player, PlayRequest, RallyMateState } from "../types";

export function getRelativeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export const demoPlayers: Player[] = [
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
];

export const demoRequests: PlayRequest[] = [
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
];

export const demoState: RallyMateState = {
  activeUserId: "user-amina",
  players: demoPlayers,
  requests: demoRequests
};
