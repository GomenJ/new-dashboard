import {
  SidebarProvider,
  // useSidebar 
} from "../context/SidebarContext";
import { Outlet } from "react-router";
// import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
// import AppSidebar from "./AppSidebar";

const LayoutContent: React.FC = () => {
  // const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        {/* TODO: Add Juan Torrentera's project in the near feature */}
        {/* Uncomment this to add Juan Torrentera's project in the near feature */}
        {/* <AppSidebar /> */}
        <Backdrop />
      </div>
      {/* TODO: Add Juan Torrentera's project in the near feature */}
      {/* Uncomment this to add Juan Torrentera's project in the near feature */}
      {/* <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      > */}

      <div
        className={"flex-1 transition-all duration-300 ease-in-out "}
      >

        {/* TODO: Add Juan Torrentera models */}
        {/* Uncomment this to add Juan Torrentera's project in the near feature */}
        {/* <AppHeader /> */}

        <header className="mb-8 p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <div className="flex items-center gap-4 mb-4">
            <img
              src="/favicon.png"
              alt="Energía Visual Logo"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-4xl font-headline font-bold" style={{ color: '#2db2ac' }}>
                Energía Visual
              </h1>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Análisis mensual del Sector Eléctrico Mayorista de México.
          </p>
        </header>

        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
