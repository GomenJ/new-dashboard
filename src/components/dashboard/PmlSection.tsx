import { ArrowUpIcon, ArrowDownIcon } from "../../icons";
import { useQuery } from '@tanstack/react-query';
// import { getPmlSectionData, PmlSectionData } from './api/get-pml-section'; // Uncomment when your API is ready

// Temporary mock data structure - replace with your actual API interface
interface PmlSectionData {
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

export default function PmlSection() {
    // TODO: Replace with your actual API call
    const { data: pmlData, error, isPending } = useQuery<PmlSectionData, Error>({
        queryKey: ['pml-section-data'],
        queryFn: async () => {
            // Temporary mock data - replace with actual API call
            return {
                promedioMensual: 1250.50,
                variacionMesAnterior: 12.5,
                maximoDelMes: {
                    value: 1890.75,
                    date: '2024-10-15',
                    time: '18:00'
                },
                minimoDelMes: {
                    value: 890.25,
                    date: '2024-10-08',
                    time: '03:00'
                }
            };
        },
    });

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(value);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short'
        });
    };

    if (error) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="text-red-600">Error loading PML data: {error.message}</div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            {/* Header Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                    PML MDA y MTR
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Precios Marginales Locales en los Mercados de Día en Adelanto y Tiempo Real.
                </p>
            </div>

            {/* Metrics Cards Grid */}
            {isPending ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
                                <div className="h-4 bg-gray-300 rounded w-3/4 mb-3 dark:bg-gray-600"></div>
                                <div className="h-8 bg-gray-300 rounded w-1/2 mb-2 dark:bg-gray-600"></div>
                                <div className="h-6 bg-gray-300 rounded w-1/3 dark:bg-gray-600"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : pmlData ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Promedio Mensual Card */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-t from-blue-50/50 to-white p-5 shadow-sm dark:border-gray-700 dark:from-blue-950/20 dark:to-gray-800/50">
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Promedio Mensual
                            </div>
                            <div className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums lg:text-3xl">
                                {formatCurrency(pmlData.promedioMensual)}
                            </div>
                            <div className="mt-2">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${pmlData.variacionMesAnterior >= 0
                                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    }`}>
                                    {pmlData.variacionMesAnterior >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                                    {Math.abs(pmlData.variacionMesAnterior)}%
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="font-medium">
                                {pmlData.variacionMesAnterior >= 0 ? 'Incremento' : 'Decremento'} vs mes anterior
                            </div>
                            <div className="mt-1">Comparado con septiembre</div>
                        </div>
                    </div>

                    {/* Variación vs Mes Pasado Card */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-t from-purple-50/50 to-white p-5 shadow-sm dark:border-gray-700 dark:from-purple-950/20 dark:to-gray-800/50">
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Variación vs Mes Pasado
                            </div>
                            <div className={`text-2xl font-semibold tabular-nums lg:text-3xl ${pmlData.variacionMesAnterior >= 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                                }`}>
                                {pmlData.variacionMesAnterior > 0 ? '+' : ''}{pmlData.variacionMesAnterior.toFixed(2)}%
                            </div>
                            <div className="mt-2">
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${pmlData.variacionMesAnterior >= 0
                                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    }`}>
                                    {pmlData.variacionMesAnterior >= 0 ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                                    Tendencia {pmlData.variacionMesAnterior >= 0 ? 'alcista' : 'bajista'}
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="font-medium">
                                {pmlData.variacionMesAnterior >= 0 ? 'Precios en aumento' : 'Precios en descenso'}
                            </div>
                            <div className="mt-1">Monitoreo de volatilidad</div>
                        </div>
                    </div>

                    {/* Máximo del Mes Card */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-t from-red-50/50 to-white p-5 shadow-sm dark:border-gray-700 dark:from-red-950/20 dark:to-gray-800/50">
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Máximo del Mes
                            </div>
                            <div className="text-2xl font-semibold text-red-600 dark:text-red-400 tabular-nums lg:text-3xl">
                                {formatCurrency(pmlData.maximoDelMes.value)}
                            </div>
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                                    <ArrowUpIcon className="h-3 w-3" />
                                    Pico máximo registrado
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="font-medium flex items-center gap-1">
                                📅 {formatDate(pmlData.maximoDelMes.date)}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                                🕐 {pmlData.maximoDelMes.time}
                            </div>
                        </div>
                    </div>

                    {/* Mínimo del Mes Card */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-t from-green-50/50 to-white p-5 shadow-sm dark:border-gray-700 dark:from-green-950/20 dark:to-gray-800/50">
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Mínimo del Mes
                            </div>
                            <div className="text-2xl font-semibold text-green-600 dark:text-green-400 tabular-nums lg:text-3xl">
                                {formatCurrency(pmlData.minimoDelMes.value)}
                            </div>
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                                    <ArrowDownIcon className="h-3 w-3" />
                                    Precio más bajo
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="font-medium flex items-center gap-1">
                                📅 {formatDate(pmlData.minimoDelMes.date)}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                                🕐 {pmlData.minimoDelMes.time}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}