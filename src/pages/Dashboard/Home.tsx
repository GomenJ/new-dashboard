import PmlSection from "../../components/dashboard/PmlSection";
import MdaStats from "../../components/dashboard/MdaStats";
import RealDemandChart from "../../components/dashboard/RealDemandChart";
import TransferCapacityTarget from "../../components/dashboard/TransferCapacityTarget";
import RecentMediciones from "../../components/dashboard/RecentMediciones";
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
        <div className="col-span-12 space-y-6">
          <PmlSection />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <TransferCapacityTarget />
        </div>

        <div className="col-span-12">
          <RealDemandChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentMediciones />
        </div>
      </div>
    </>
  );
}
