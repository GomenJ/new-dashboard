// Data received from the API is expected to be in the following format:
// Year	Month	Monthly_Average_PML
// 2025	1	888.272020
// 2025	2	743.796668
// 2025	3	777.147565
// 2025	4	847.943342
// 2025	5	1112.143305
// 2025	6	905.374581

export interface MonthlyAveragePmlMdaData {
    Year: number; // Year in numeric format
    Month: number; // Month in numeric format
    Monthly_Average_PML: number; // Monthly average PML value
}

export const getMonthlyAveragePmlMda = async (): Promise<MonthlyAveragePmlMdaData[]> => {
    const url = `${import.meta.env.VITE_API_URL}/api/v1/mda_mtr/monthly_average_pml_mda`;
    const response = await fetch(url);

    if (!url) {
        throw new Error('API URL is not defined');
    }

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
};