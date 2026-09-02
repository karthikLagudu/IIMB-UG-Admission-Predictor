function unavailable(): never {
  throw new Error("Database-backed administration is disabled on this temporary deployment.");
}

export const prisma = {
  degreeMapping: {
    findMany: async (...args: unknown[]) => {
      void args;
      return [];
    },
    upsert: async (...args: unknown[]): Promise<Record<string, never>> => {
      void args;
      return unavailable();
    },
  },
  academicCategory: {
    findFirst: async (...args: unknown[]): Promise<{ id: string } | null> => {
      void args;
      return null;
    },
  },
};
