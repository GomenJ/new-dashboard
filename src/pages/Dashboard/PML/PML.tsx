
// import MdaStats from "@/components/dashboard/MdaStats";
// import RealDemandChart from "@/components/dashboard/RealDemandChart";
// import TransferCapacityTarget from "@/components/dashboard/TransferCapacityTarget";
// import RecentMediciones from "@/components/dashboard/RecentMediciones";
// import DemographicCard from "@/components/dashboard/DemographicCard";
import PageMeta from "@/components/common/PageMeta";
import { SectionCards } from "@/components/dashboard/Metrics/SectionCards";

export default function PML() {
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6">
          <SectionCards />

          {/* <MdaStats /> */}
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* <TransferCapacityTarget /> */}
        </div>

        <div className="col-span-12">
          {/* <RealDemandChart /> */}
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* <DemographicCard /> */}
        </div>

        <div className="col-span-12 xl:col-span-7">
          {/* <RecentMediciones /> */}
        </div>
      </div>
    </>
  );
}
