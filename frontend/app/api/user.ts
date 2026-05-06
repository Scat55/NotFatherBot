export interface User {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  photoUrl?: string;
  balance?: number;
  wishlistCount?: number;
  pairsCount?: number;
  matchesCount?: number;
  skippedTasks?: number;
  completedTasks?: number;
  achievements?: number;
  createdAt?: string;
}

export const userApi = {
  getMe: async (baseUrl: string, token: string): Promise<User> => {
    const data = await $fetch<User>(`${baseUrl}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return data;
  },
};
