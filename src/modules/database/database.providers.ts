import { getConnection } from "../../config/postgres.config";

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      return getConnection();
    },
  },
];