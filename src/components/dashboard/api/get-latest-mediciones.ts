export type MedicionesData = {
    FechaMedicion: string; // Date of the measurement
    MW_Promedio_ER: number; // Average MW for the ER
    Pseudonimo: string; // Pseudonym of the measurement
}

export type LatestMediciones = {
    data: MedicionesData[];
    status: "success" | "error";
}
/* 
    * This function fetches the latest measurements (mediciones) from the API.
    * It returns a promise that resolves to an object containing the data and status.
    * The data is an array of objects, each representing a measurement with its date, average MW, and pseudonym.
    * Sample
    * data structure:
    * {
    *  data: [
    *   { FechaMedicion: "2025-06-26", MW_Promedio_ER: 0.265897, Pseudonimo: "ALIMENTOS KOWI 1" },
    *   { FechaMedicion: "2025-06-26", MW_Promedio_ER: 0.070329, Pseudonimo: "ALIMENTOS KOWI 2" },
    *   { FechaMedicion: "2025-06-26", MW_Promedio_ER: 0.058904, Pseudonimo: "ALLGAIER CC #1 PUEBLA" },
    *   ],
    *   status: "success" | "error"
    * }
*/
export const getLatestMediciones = async (): Promise<LatestMediciones> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/mediciones/mediciones_overview`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const data = await response.json() as LatestMediciones;

        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format received');
        }

        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Missing required fields in the data');
        }

        return data;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching PML daily data: ${errorMessage}`);
        throw error; // Re-throw the error to be handled by the caller
    }
}
