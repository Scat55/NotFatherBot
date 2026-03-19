export interface Wish {
  id: number;
  text: string;
  cost: number;
  order: number;
  done: boolean;
  coupleId: number;
  createdAt: string;
}

export const wishesApi = {
  getAll: async (baseUrl: string, token: string, coupleId: number): Promise<Wish[]> => {
    return $fetch<Wish[]>(`${baseUrl}/couples/${coupleId}/wishes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  create: async (
    baseUrl: string,
    token: string,
    coupleId: number,
    data: { text: string; cost?: number },
  ): Promise<Wish> => {
    return $fetch<Wish>(`${baseUrl}/couples/${coupleId}/wishes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    });
  },

  update: async (
    baseUrl: string,
    token: string,
    coupleId: number,
    wishId: number,
    data: { text?: string; cost?: number; done?: boolean },
  ): Promise<Wish> => {
    return $fetch<Wish>(`${baseUrl}/couples/${coupleId}/wishes/${wishId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    });
  },

  delete: async (
    baseUrl: string,
    token: string,
    coupleId: number,
    wishId: number,
  ): Promise<void> => {
    return $fetch(`${baseUrl}/couples/${coupleId}/wishes/${wishId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  reorder: async (
    baseUrl: string,
    token: string,
    coupleId: number,
    ids: number[],
  ): Promise<Wish[]> => {
    return $fetch<Wish[]>(`${baseUrl}/couples/${coupleId}/wishes/reorder`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: { ids },
    });
  },
};
