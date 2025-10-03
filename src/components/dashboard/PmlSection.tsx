import { SectionCards } from './Metrics/SectionCards';
import { PmlChart } from './PmlChart';

export default function PmlSection() {
    return (
        <div className="space-y-6">
            {/* First Section - Cards */}
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
                <div className="@container/main">
                    <SectionCards />
                </div>
            </div>

            {/* Second Section - Chart */}
            <div className="@container/main">
                <PmlChart />
            </div>
        </div>
    );
}