
export type TransferCapacityItem = {
    Enlace: string;
    FechaOperacion: string;
    Transferencia_Disponible_Exportacion: number;
    Transferencia_Disponible_Importacion: number;
}

export type TransferCapacityData = {
    data: TransferCapacityItem[];
    message: string;
}
export const getTransferCapacity = async (): Promise<TransferCapacityData> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/capacidad_transferencia/capacidad_transferencia_by_day_ahead`;
    const response = await fetch(url);

    if (!url) {
        throw new Error('API URL is not defined');
    }

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};

