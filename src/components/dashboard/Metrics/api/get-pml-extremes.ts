export interface PmlExtremesData {
  data: {
    market: string;
    max: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioMarginalLocal_MWh: number;
      Sistema: string;
    };
    min: {
      FechaOperacion: string;
      HoraOperacion: number;
      PrecioMarginalLocal_MWh: number;
      Sistema: string;
    };
  };
  status: string;
}

export const getPmlExtremes = async (): Promise<PmlExtremesData> => {
  const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/current-month-extremes?market=mda`;

  if (!import.meta.env.VITE_API_URL) {
    throw new Error('API URL is not defined');
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch PML extremes: ${response.statusText}`);
  }

  return response.json();
};