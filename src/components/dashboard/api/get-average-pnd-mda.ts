export interface PndMdaData {
    Fecha: string; // Date in string format
    Promedio_PND: number; // Average PND value
}

export const getAveragePndMda = async (): Promise<PndMdaData[]> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/mda_mtr/latest_average_pnd_mda`;
    const response = await fetch(url);

    if (!url) {
        throw new Error('API URL is not defined');
    }

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};
