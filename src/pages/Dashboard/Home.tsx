import Metrics from "../../components/dashboard/Metrics";
import MdaStats from "../../components/dashboard/MdaStats";
import StatisticsChart from "../../components/dashboard/StatisticsChart";
import MonthlyTarget from "../../components/dashboard/TransferCapacityTarget";
import RecentOrders from "../../components/dashboard/RecentOrders";
import DemographicCard from "../../components/dashboard/DemographicCard";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard - Mercados"
        description="Este es el dashboard de Mercados, donde puedes ver las métricas y estadísticas más recientes acerca del mercado eléctrico."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <Metrics />

          <MdaStats />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
