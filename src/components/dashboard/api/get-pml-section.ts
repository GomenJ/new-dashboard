// Template for PML Section API endpoint
// TODO: Replace with your actual API implementation

export interface PmlSectionData {
    promedioMensual: number;
    variacionMesAnterior: number;
    maximoDelMes: {
        value: number;
        date: string;
        time: string;
    };
    minimoDelMes: {
        value: number;
        date: string;
        time: string;
    };
}

export const getPmlSectionData = async (): Promise<PmlSectionData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/section-data`;

    if (!import.meta.env.VITE_API_URL) {
        throw new Error('API URL is not defined');
    }

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch PML section data: ${response.statusText}`);
    }

    return response.json();
};

// Alternative: If you need separate endpoints for each metric
export interface PromedioMensualData {
    value: number;
    currency: string;
}

export interface VariacionMensualData {
    percentage: number;
    trend: 'up' | 'down';
}

export interface ExtremoData {
    value: number;
    date: string;
    time: string;
    currency: string;
}

export const getPromedioMensual = async (): Promise<PromedioMensualData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/promedio-mensual`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch promedio mensual');
    return response.json();
};

export const getVariacionMensual = async (): Promise<VariacionMensualData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/variacion-mensual`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch variación mensual');
    return response.json();
};

export const getMaximoDelMes = async (): Promise<ExtremoData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/maximo-del-mes`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch máximo del mes');
    return response.json();
};

export const getMinimoDelMes = async (): Promise<ExtremoData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/pml/minimo-del-mes`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch mínimo del mes');
    return response.json();
};