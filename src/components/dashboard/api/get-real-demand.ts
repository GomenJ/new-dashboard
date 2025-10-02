export type DemandaDayData = {
    Fecha: string;
    MaxDemandaHoraria_MWh: number;
}

export type DemandaBalanceCurrentYearRange = {
    end: string;
    start: string;
}

export type DemandaBalancePreviousYearRange = {
    end: string;
    start: string;
}


export type DemandaBalancePromedioAnual = {
    currentYearData: DemandaDayData[];
    dateRanges: {
        currentYear: DemandaBalanceCurrentYearRange;
        previousYear: DemandaBalancePreviousYearRange;
    }
    previousYearData: DemandaDayData[];
}

/* Example response structure:
{
    currentYearData: [
        { Fecha: "2025-01-01", MaxDemandaHoraria_MWh: 29021.28713 },
        { Fecha: "2025-01-02", MaxDemandaHoraria_MWh: 35394.64766 },
        // ... more data
    ],
    dateRanges: {
        currentYear: { start: "2025-01-01", end: "2025-06-27" },
        previousYear: { start: "2024-01-01", end: "2024-06-27" }
    },
    previousYearData: [
        { Fecha: "2024-01-01", MaxDemandaHoraria_MWh: 28284.41511 },
        { Fecha: "2024-01-02", MaxDemandaHoraria_MWh: 35155.3893 },
        { Fecha: "2024-01-03", MaxDemandaHoraria_MWh: 36576.1483 },
        // ... more data
    ]
}
*/


export const getRealDemand = async (): Promise<DemandaBalancePromedioAnual> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/demanda_real_balance/yearly_peak_demand_comparison`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json() as DemandaBalancePromedioAnual;

        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format received');
        }

        if (!data.currentYearData || !data.previousYearData || !data.dateRanges) {
            throw new Error('Missing required fields in the data');
        }

        return data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching PML daily data: ${errorMessage}`);
        throw error; // Re-throw the error to be handled by the caller
    }
}