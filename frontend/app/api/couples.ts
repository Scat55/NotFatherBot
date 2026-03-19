export interface CoupleUser {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export interface Couple {
  id: number;
  creatorId: number;
  partnerId?: number;
  inviteToken?: string;
  inviteExpiresAt?: string;
  createdAt: string;
  creator: CoupleUser;
  partner?: CoupleUser;
  _count: { wishes: number };
}

export const couplesApi = {
  getAll: async (baseUrl: string, token: string): Promise<Couple[]> => {
    return $fetch<Couple[]>(`${baseUrl}/couples`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getOne: async (baseUrl: string, token: string, id: number): Promise<Couple> => {
    return $fetch<Couple>(`${baseUrl}/couples/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  create: async (baseUrl: string, token: string): Promise<Couple> => {
    return $fetch<Couple>(`${baseUrl}/couples`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  leave: async (baseUrl: string, token: string, id: number): Promise<void> => {
    return $fetch(`${baseUrl}/couples/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  refreshInvite: async (baseUrl: string, token: string, id: number): Promise<Couple> => {
    return $fetch<Couple>(`${baseUrl}/couples/${id}/invite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  join: async (baseUrl: string, token: string, inviteToken: string): Promise<Couple> => {
    return $fetch<Couple>(`${baseUrl}/couples/join/${inviteToken}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
