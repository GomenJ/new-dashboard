export type Gerencias = | 'Central' | 'Noreste' | 'Noroeste' | 'Norte' | 'Occidental' | 'Oriental' | 'Peninsular';

export type DemandaPorHora = {
    Fecha: string;
    Gerencia: Gerencias
    Maximo_Demanda: number;
    Minimo_Demanda: number;
    Promedio_Demanda: number;
}

export type DemandaHorariaData = {
    latest_date: string;
    previous_week_date: string;
    latest_day_records: DemandaPorHora[];
    previous_week_day_records: DemandaPorHora[];
}

export const getHourlyDemand = async (): Promise<DemandaHorariaData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/demanda/demanda_comparison`;
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json() as DemandaHorariaData;
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format received');
        }

        if (!data.latest_date || !data.latest_day_records || !data.previous_week_date || !data.previous_week_day_records) {
            throw new Error('Missing required fields in the data');
        }

        return data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching current day: ${errorMessage}`);
        throw error; // Re-throw the error to be handled by the caller
    }
}